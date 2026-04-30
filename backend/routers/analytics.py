from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from database import get_db
import models
from collections import defaultdict
from datetime import date
from typing import Optional
import calendar

router = APIRouter(prefix="/api/analytics", tags=["analytics"])


def _get_currency(db: Session) -> str:
    setting = db.query(models.AppSettings).filter_by(key="currency_symbol").first()
    return setting.value if setting else "$"


def _resolve_session_id(session_id: Optional[int], db: Session) -> Optional[int]:
    """If no session_id given, return the latest session's id (or None if no sessions)."""
    if session_id is not None:
        return session_id
    latest = (
        db.query(models.UploadSession)
        .order_by(models.UploadSession.upload_date.desc())
        .first()
    )
    return latest.id if latest else None


@router.get("/currency")
def get_currency(db: Session = Depends(get_db)):
    return {"currency_symbol": _get_currency(db)}


@router.get("/dashboard")
def get_dashboard(
    session_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
):
    sid = _resolve_session_id(session_id, db)
    currency_symbol = _get_currency(db)

    query = db.query(models.Transaction)
    if sid is not None:
        query = query.filter(models.Transaction.session_id == sid)
    transactions = query.all()

    if not transactions:
        return {
            "total_income": 0,
            "total_expenses": 0,
            "net_balance": 0,
            "transaction_count": 0,
            "categories": {},
            "monthly_data": [],
            "anomaly_count": 0,
            "recent_transactions": [],
            "currency_symbol": currency_symbol,
            "session_id": sid,
        }

    total_income = sum(t.amount for t in transactions if t.amount > 0)
    total_expenses = sum(abs(t.amount) for t in transactions if t.amount < 0)

    categories: dict[str, float] = defaultdict(float)
    for t in transactions:
        if t.amount < 0:
            categories[t.category] += abs(t.amount)

    monthly: dict[str, dict] = defaultdict(lambda: {"income": 0.0, "expenses": 0.0})
    for t in transactions:
        try:
            month_key = t.date[:7]
            if t.amount > 0:
                monthly[month_key]["income"] += t.amount
            else:
                monthly[month_key]["expenses"] += abs(t.amount)
        except Exception:
            pass

    monthly_data = [
        {"month": k, "income": round(v["income"], 2), "expenses": round(v["expenses"], 2)}
        for k, v in sorted(monthly.items())
    ]

    anomaly_count = sum(1 for t in transactions if t.is_anomaly)
    recent = sorted(transactions, key=lambda x: x.date, reverse=True)[:5]
    recent_list = [
        {
            "id": t.id,
            "date": t.date,
            "description": t.description,
            "amount": t.amount,
            "category": t.category,
            "is_anomaly": t.is_anomaly,
        }
        for t in recent
    ]

    return {
        "total_income": round(total_income, 2),
        "total_expenses": round(total_expenses, 2),
        "net_balance": round(total_income - total_expenses, 2),
        "transaction_count": len(transactions),
        "categories": {k: round(v, 2) for k, v in categories.items()},
        "monthly_data": monthly_data,
        "anomaly_count": anomaly_count,
        "recent_transactions": recent_list,
        "currency_symbol": currency_symbol,
        "session_id": sid,
    }


@router.get("/forecast")
def get_forecast(
    session_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
):
    sid = _resolve_session_id(session_id, db)
    today = date.today()
    current_month = today.strftime("%Y-%m")
    days_in_month = calendar.monthrange(today.year, today.month)[1]
    days_elapsed = max(today.day, 1)
    days_remaining = days_in_month - today.day
    currency_symbol = _get_currency(db)

    query = db.query(models.Transaction).filter(
        models.Transaction.date.startswith(current_month)
    )
    if sid is not None:
        query = query.filter(models.Transaction.session_id == sid)
    month_txns = query.all()

    current_spending = sum(abs(t.amount) for t in month_txns if t.amount < 0)
    current_income = sum(t.amount for t in month_txns if t.amount > 0)

    daily_rate = current_spending / days_elapsed
    projected_spending = daily_rate * days_in_month
    projected_balance = current_income - projected_spending

    alert = None
    if days_elapsed >= 3 and projected_spending > current_spending * 1.15:
        extra = projected_spending - current_spending
        alert = (
            f"At your current pace you'll spend {currency_symbol}{projected_spending:.0f} this month — "
            f"{currency_symbol}{extra:.0f} more than you've spent so far."
        )

    return {
        "current_month_spending": round(current_spending, 2),
        "projected_month_spending": round(projected_spending, 2),
        "current_income": round(current_income, 2),
        "projected_balance": round(projected_balance, 2),
        "days_elapsed": days_elapsed,
        "days_remaining": days_remaining,
        "daily_rate": round(daily_rate, 2),
        "alert": alert,
    }


@router.get("/anomalies")
def get_anomalies(
    session_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
):
    sid = _resolve_session_id(session_id, db)

    query = db.query(models.Transaction).filter(models.Transaction.is_anomaly == True)
    if sid is not None:
        query = query.filter(models.Transaction.session_id == sid)
    anomalies = query.all()

    return [
        {
            "id": t.id,
            "date": t.date,
            "description": t.description,
            "amount": t.amount,
            "category": t.category,
            "anomaly_reason": t.anomaly_reason,
        }
        for t in anomalies
    ]
