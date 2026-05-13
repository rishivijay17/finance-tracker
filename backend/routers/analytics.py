from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from database import get_db
import models
from collections import defaultdict
from datetime import date
from typing import Optional
import calendar
import math

router = APIRouter(prefix="/api/analytics", tags=["analytics"])


def _get_currency(db: Session) -> str:
    setting = db.query(models.AppSettings).filter_by(key="currency_symbol").first()
    return setting.value if setting else "$"


def _resolve_session_id(session_id: Optional[int], db: Session) -> Optional[int]:
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
            "months_count": 0,
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
        "months_count": len(monthly_data) or 1,
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


@router.get("/health-score")
def get_health_score(
    session_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
):
    sid = _resolve_session_id(session_id, db)

    query = db.query(models.Transaction)
    if sid is not None:
        query = query.filter(models.Transaction.session_id == sid)
    transactions = query.all()

    if not transactions:
        return {
            "score": 0,
            "grade": "No Data",
            "color": "#6B6B8A",
            "breakdown": {"savings_rate": 0, "consistency": 0, "category_balance": 0, "anomaly_control": 0},
            "savings_rate_pct": 0,
        }

    expenses = [t for t in transactions if t.amount < 0]
    income_txns = [t for t in transactions if t.amount > 0]
    total_income = sum(t.amount for t in income_txns)
    total_expenses = sum(abs(t.amount) for t in expenses)

    # 1. Savings Rate (40 points) — 20% savings = full score
    if total_income > 0:
        savings_rate = (total_income - total_expenses) / total_income
        savings_score = min(40.0, max(0.0, savings_rate * 200))
        savings_rate_pct = round(savings_rate * 100, 1)
    else:
        savings_score = 0.0
        savings_rate_pct = 0.0

    # 2. Spending Consistency (20 points) — lower variance = higher score
    monthly_expenses: dict[str, float] = defaultdict(float)
    for t in expenses:
        monthly_expenses[t.date[:7]] += abs(t.amount)

    if len(monthly_expenses) >= 2:
        vals = list(monthly_expenses.values())
        mean = sum(vals) / len(vals)
        variance = sum((v - mean) ** 2 for v in vals) / len(vals)
        std_dev = math.sqrt(variance)
        cv = std_dev / mean if mean > 0 else 1.0
        consistency_score = max(0.0, 20.0 * (1.0 - min(cv, 1.0)))
    else:
        consistency_score = 10.0  # Neutral for single-month data

    # 3. Category Balance (20 points) — more spread = healthier
    cat_totals: dict[str, float] = defaultdict(float)
    for t in expenses:
        cat_totals[t.category] += abs(t.amount)

    if cat_totals and total_expenses > 0:
        meaningful = sum(1 for v in cat_totals.values() if v / total_expenses > 0.05)
        balance_score = min(20.0, meaningful * 4.0)
    else:
        balance_score = 0.0

    # 4. Anomaly Control (20 points) — fewer anomalies = better
    expense_count = len(expenses)
    anomaly_count = sum(1 for t in transactions if t.is_anomaly)
    if expense_count > 0:
        anomaly_pct = anomaly_count / expense_count
        anomaly_score = max(0.0, 20.0 * (1.0 - anomaly_pct * 5.0))
    else:
        anomaly_score = 20.0

    total_score = savings_score + consistency_score + balance_score + anomaly_score
    score = min(100, max(0, round(total_score)))

    if score >= 80:
        grade, color = "Excellent", "#00D4AA"
    elif score >= 60:
        grade, color = "Good", "#FFB800"
    elif score >= 40:
        grade, color = "Fair", "#FF8C00"
    else:
        grade, color = "Needs Attention", "#FF4757"

    return {
        "score": score,
        "grade": grade,
        "color": color,
        "breakdown": {
            "savings_rate": round(savings_score, 1),
            "consistency": round(consistency_score, 1),
            "category_balance": round(balance_score, 1),
            "anomaly_control": round(anomaly_score, 1),
        },
        "savings_rate_pct": savings_rate_pct,
    }


@router.get("/insights")
def get_insights(
    session_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
):
    sid = _resolve_session_id(session_id, db)

    query = db.query(models.BehavioralInsight)
    if sid is not None:
        query = query.filter(models.BehavioralInsight.session_id == sid)
    rows = query.order_by(models.BehavioralInsight.created_at).all()

    return {"insights": [r.insight for r in rows]}


@router.get("/recurring")
def get_recurring(
    session_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
):
    sid = _resolve_session_id(session_id, db)
    currency_symbol = _get_currency(db)

    query = db.query(models.RecurringPayment)
    if sid is not None:
        query = query.filter(models.RecurringPayment.session_id == sid)
    payments = query.order_by(models.RecurringPayment.annual_cost.desc()).all()

    # Also get total income to calculate percentage
    txn_query = db.query(models.Transaction)
    if sid is not None:
        txn_query = txn_query.filter(models.Transaction.session_id == sid)
    transactions = txn_query.all()

    months_set = set(t.date[:7] for t in transactions if t.date)
    num_months = max(len(months_set), 1)
    monthly_income = sum(t.amount for t in transactions if t.amount > 0) / num_months

    total_monthly_recurring = sum(
        p.amount if p.frequency == "monthly" else
        p.amount * 52 / 12 if p.frequency == "weekly" else
        p.amount * 26 / 12 if p.frequency == "bi-weekly" else
        p.amount / 3 if p.frequency == "quarterly" else
        p.amount / 12
        for p in payments
    )

    income_pct = round(total_monthly_recurring / monthly_income * 100, 1) if monthly_income > 0 else 0
    warning = income_pct > 15

    return {
        "payments": [
            {
                "id": p.id,
                "name": p.name,
                "amount": p.amount,
                "frequency": p.frequency,
                "annual_cost": p.annual_cost,
                "category": p.category,
                "last_date": p.last_date,
            }
            for p in payments
        ],
        "total_annual": round(sum(p.annual_cost for p in payments), 2),
        "total_monthly_recurring": round(total_monthly_recurring, 2),
        "income_percentage": income_pct,
        "warning": warning,
        "currency_symbol": currency_symbol,
    }
