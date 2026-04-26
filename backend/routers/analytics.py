from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
import models
from collections import defaultdict
from datetime import date
import calendar

router = APIRouter(prefix="/api/analytics", tags=["analytics"])


@router.get("/dashboard")
def get_dashboard(db: Session = Depends(get_db)):
    transactions = db.query(models.Transaction).all()

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
        }

    total_income = sum(t.amount for t in transactions if t.amount > 0)
    total_expenses = sum(abs(t.amount) for t in transactions if t.amount < 0)

    # Spending by category (expenses only)
    categories: dict[str, float] = defaultdict(float)
    for t in transactions:
        if t.amount < 0:
            categories[t.category] += abs(t.amount)

    # Monthly income vs expenses
    monthly: dict[str, dict] = defaultdict(lambda: {"income": 0.0, "expenses": 0.0})
    for t in transactions:
        try:
            month_key = t.date[:7]  # YYYY-MM
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
    }


@router.get("/forecast")
def get_forecast(db: Session = Depends(get_db)):
    today = date.today()
    current_month = today.strftime("%Y-%m")
    days_in_month = calendar.monthrange(today.year, today.month)[1]
    days_elapsed = max(today.day, 1)
    days_remaining = days_in_month - today.day

    month_txns = db.query(models.Transaction).filter(
        models.Transaction.date.startswith(current_month)
    ).all()

    current_spending = sum(abs(t.amount) for t in month_txns if t.amount < 0)
    current_income = sum(t.amount for t in month_txns if t.amount > 0)

    daily_rate = current_spending / days_elapsed
    projected_spending = daily_rate * days_in_month
    projected_balance = current_income - projected_spending

    alert = None
    if days_elapsed >= 3 and projected_spending > current_spending * 1.15:
        extra = projected_spending - current_spending
        alert = (
            f"At your current pace you'll spend ${projected_spending:.0f} this month — "
            f"${extra:.0f} more than you've spent so far."
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
def get_anomalies(db: Session = Depends(get_db)):
    anomalies = db.query(models.Transaction).filter(
        models.Transaction.is_anomaly == True
    ).all()
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
