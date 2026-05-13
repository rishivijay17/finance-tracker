import hashlib
from datetime import datetime
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
import models
from services.pdf_parser import extract_text_from_pdf, parse_transactions_fallback, detect_currency
from services.ai_service import extract_transactions, generate_behavioral_insights
from services.anomaly_detector import detect_anomalies
from services.recurring_detector import detect_recurring

router = APIRouter(prefix="/api/upload", tags=["upload"])


def _compute_fingerprint(transactions: list[dict]) -> str:
    items = sorted(
        f"{t.get('date','')},{t.get('description','')},{t.get('amount', 0)}"
        for t in transactions
    )
    return hashlib.md5("|".join(items).encode()).hexdigest()


def _compute_statement_period(transactions: list[dict]) -> str:
    months = []
    for t in transactions:
        try:
            months.append(t.get("date", "")[:7])  # YYYY-MM
        except Exception:
            pass
    if not months:
        return "Unknown Period"

    def fmt(ym: str) -> str:
        try:
            return datetime.strptime(ym, "%Y-%m").strftime("%B %Y")
        except Exception:
            return ym

    lo, hi = min(months), max(months)
    return fmt(lo) if lo == hi else f"{fmt(lo)} – {fmt(hi)}"


def _save_transactions(
    db: Session, analyzed: list[dict], filename: str, session_id: int
) -> list:
    saved = []
    for t in analyzed:
        db_tx = models.Transaction(
            date=t.get("date", ""),
            description=t.get("description", ""),
            amount=float(t.get("amount", 0)),
            category=t.get("category", "Other"),
            is_anomaly=t.get("is_anomaly", False),
            anomaly_reason=t.get("anomaly_reason"),
            categorization_reason=t.get("categorization_reason"),
            source_file=filename,
            session_id=session_id,
        )
        db.add(db_tx)
        saved.append(db_tx)
    db.flush()
    return saved


@router.post("")
async def upload_statement(file: UploadFile = File(...), db: Session = Depends(get_db)):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")

    contents = await file.read()

    # ── Step 1: extract text ──────────────────────────────────────────────────
    try:
        pdf_text = extract_text_from_pdf(contents)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Could not read PDF: {e}")

    if not pdf_text.strip():
        raise HTTPException(
            status_code=400,
            detail=(
                "Could not extract text from this PDF. "
                "It may be a scanned image — please use a digital bank statement."
            ),
        )

    # ── Detect and persist currency symbol ───────────────────────────────────
    currency_symbol = detect_currency(pdf_text)
    setting = db.query(models.AppSettings).filter_by(key="currency_symbol").first()
    if setting:
        setting.value = currency_symbol
    else:
        db.add(models.AppSettings(key="currency_symbol", value=currency_symbol))
    db.commit()

    # ── Step 2: try AI extraction (with built-in 3× retry on 429) ────────────
    raw_transactions: list[dict] = []
    used_fallback = False

    try:
        raw_transactions = extract_transactions(pdf_text)
    except Exception as ai_err:
        err_str = str(ai_err).lower()
        is_quota = "429" in str(ai_err) or any(
            kw in err_str for kw in ("quota", "resource exhausted", "rate limit", "too many")
        )

        if is_quota:
            try:
                raw_transactions = parse_transactions_fallback(contents)
                used_fallback = True
            except Exception as fb_err:
                raise HTTPException(
                    status_code=503,
                    detail=(
                        "Gemini quota exceeded and the fallback parser also failed. "
                        f"Fallback error: {fb_err}"
                    ),
                )
        elif "GEMINI_API_KEY" in str(ai_err):
            raise HTTPException(status_code=503, detail=str(ai_err))
        else:
            raise HTTPException(status_code=500, detail=f"AI parsing error: {ai_err}")

    if not raw_transactions:
        raise HTTPException(
            status_code=400,
            detail=(
                "No transactions found in the PDF. "
                "Make sure it is a digital bank statement."
                + (" (parsed without AI — rule-based fallback was used)" if used_fallback else "")
            ),
        )

    # ── Step 3: duplicate detection via fingerprint ───────────────────────────
    fingerprint = _compute_fingerprint(raw_transactions)
    existing = db.query(models.UploadSession).filter_by(fingerprint=fingerprint).first()
    if existing:
        return {
            "message": "This statement has already been uploaded.",
            "duplicate": True,
            "count": 0,
            "anomalies": 0,
            "session_id": existing.id,
            "statement_period": existing.statement_period,
            "method": "duplicate",
        }

    # ── Step 4: anomaly detection ─────────────────────────────────────────────
    analyzed = detect_anomalies(raw_transactions, currency_symbol=currency_symbol)

    # ── Step 5: create upload session + persist transactions ─────────────────
    statement_period = _compute_statement_period(raw_transactions)
    session = models.UploadSession(
        filename=file.filename,
        statement_period=statement_period,
        transaction_count=0,
        fingerprint=fingerprint,
    )
    db.add(session)
    db.flush()  # get session.id before inserting transactions

    saved = _save_transactions(db, analyzed, file.filename, session.id)
    session.transaction_count = len(saved)
    db.commit()

    for s in saved:
        db.refresh(s)
    db.refresh(session)

    # ── Step 6: generate behavioral insights (non-critical) ──────────────────
    try:
        insights = generate_behavioral_insights(analyzed, currency_symbol)
        for text in insights:
            db.add(models.BehavioralInsight(session_id=session.id, insight=text))
        db.commit()
    except Exception:
        pass  # Insights are non-critical — upload succeeds regardless

    # ── Step 7: detect recurring payments (non-critical) ─────────────────────
    try:
        recurring = detect_recurring(analyzed)
        for r in recurring:
            db.add(models.RecurringPayment(
                session_id=session.id,
                name=r["name"],
                amount=r["amount"],
                frequency=r["frequency"],
                annual_cost=r["annual_cost"],
                category=r["category"],
                last_date=r["last_date"],
            ))
        db.commit()
    except Exception:
        pass  # Recurring detection is non-critical

    anomaly_count = sum(1 for t in analyzed if t.get("is_anomaly"))
    message = f"Successfully imported {len(saved)} transactions."
    if used_fallback:
        message += " (Gemini quota exceeded — categories were assigned by keyword matching, not AI)"

    return {
        "message": message,
        "duplicate": False,
        "count": len(saved),
        "anomalies": anomaly_count,
        "session_id": session.id,
        "statement_period": statement_period,
        "method": "fallback" if used_fallback else "ai",
    }
