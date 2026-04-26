from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc
from database import get_db
import models
from services.ai_service import answer_question
from collections import defaultdict

router = APIRouter(prefix="/api/chat", tags=["chat"])


def _build_financial_summary(db: Session) -> str:
    transactions = db.query(models.Transaction).all()

    if not transactions:
        return "No transaction data is available yet."

    total_income = sum(t.amount for t in transactions if t.amount > 0)
    total_expenses = sum(abs(t.amount) for t in transactions if t.amount < 0)
    net = total_income - total_expenses

    by_category: dict[str, float] = defaultdict(float)
    for t in transactions:
        if t.amount < 0:
            by_category[t.category] += abs(t.amount)

    cat_lines = "\n".join(
        f"  - {cat}: ${amt:.2f}"
        for cat, amt in sorted(by_category.items(), key=lambda x: -x[1])
    )

    recent = (
        db.query(models.Transaction)
        .order_by(desc(models.Transaction.date))
        .limit(20)
        .all()
    )
    recent_lines = "\n".join(
        f"  {t.date} | {t.description} | ${t.amount:.2f} | {t.category}"
        for t in recent
    )

    anomalies = [t for t in transactions if t.is_anomaly]
    anomaly_lines = (
        "\n".join(f"  - {t.description}: ${abs(t.amount):.2f} ({t.anomaly_reason})" for t in anomalies)
        if anomalies
        else "  None detected"
    )

    return f"""
Total Income: ${total_income:.2f}
Total Expenses: ${total_expenses:.2f}
Net Balance Change: ${net:.2f}
Total Transactions: {len(transactions)}

Spending by Category:
{cat_lines}

Flagged Anomalies:
{anomaly_lines}

Recent Transactions (last 20):
{recent_lines}
"""


@router.post("", response_model=models.ChatResponse)
def chat(request: models.ChatRequest, db: Session = Depends(get_db)):
    user_msg = models.ChatMessage(role="user", content=request.message)
    db.add(user_msg)
    db.commit()

    history = db.query(models.ChatMessage).order_by(models.ChatMessage.id).all()
    history_dicts = [{"role": h.role, "content": h.content} for h in history]

    summary = _build_financial_summary(db)

    try:
        reply = answer_question(request.message, summary, history_dicts[:-1])
    except ValueError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI error: {str(e)}")

    ai_msg = models.ChatMessage(role="assistant", content=reply)
    db.add(ai_msg)
    db.commit()

    return {"reply": reply}


@router.get("/history")
def get_history(db: Session = Depends(get_db)):
    messages = db.query(models.ChatMessage).order_by(models.ChatMessage.id).all()
    return [{"id": m.id, "role": m.role, "content": m.content} for m in messages]


@router.delete("/history")
def clear_history(db: Session = Depends(get_db)):
    db.query(models.ChatMessage).delete()
    db.commit()
    return {"message": "Chat history cleared."}
