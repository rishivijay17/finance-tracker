from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
import models
from services.pdf_parser import extract_text_from_pdf, parse_transactions_fallback
from services.ai_service import extract_transactions
from services.anomaly_detector import detect_anomalies

router = APIRouter(prefix="/api/upload", tags=["upload"])


def _save_transactions(db: Session, analyzed: list[dict], filename: str) -> list:
    saved = []
    for t in analyzed:
        db_tx = models.Transaction(
            date=t.get("date", ""),
            description=t.get("description", ""),
            amount=float(t.get("amount", 0)),
            category=t.get("category", "Other"),
            is_anomaly=t.get("is_anomaly", False),
            anomaly_reason=t.get("anomaly_reason"),
            source_file=filename,
        )
        db.add(db_tx)
        saved.append(db_tx)
    db.commit()
    for s in saved:
        db.refresh(s)
    return saved


@router.post("")
async def upload_statement(file: UploadFile = File(...), db: Session = Depends(get_db)):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")

    contents = await file.read()

    # ── Step 1: extract text with pdfplumber (fast, no API quota used) ────────
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
            # ── Step 3: fallback to rule-based table parser ────────────────
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
            raise HTTPException(
                status_code=500, detail=f"AI parsing error: {ai_err}"
            )

    if not raw_transactions:
        raise HTTPException(
            status_code=400,
            detail=(
                "No transactions found in the PDF. "
                "Make sure it is a digital bank statement."
                + (" (parsed without AI — rule-based fallback was used)" if used_fallback else "")
            ),
        )

    # ── Step 4: anomaly detection + persist ───────────────────────────────────
    analyzed = detect_anomalies(raw_transactions)
    saved = _save_transactions(db, analyzed, file.filename)
    anomaly_count = sum(1 for t in analyzed if t.get("is_anomaly"))

    message = f"Successfully imported {len(saved)} transactions."
    if used_fallback:
        message += " (Gemini quota exceeded — categories were assigned by keyword matching, not AI)"

    return {
        "message": message,
        "count": len(saved),
        "anomalies": anomaly_count,
        "method": "fallback" if used_fallback else "ai",
    }
