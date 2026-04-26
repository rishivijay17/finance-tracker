from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from database import get_db
import models
from typing import Optional, List

router = APIRouter(prefix="/api/transactions", tags=["transactions"])


@router.get("", response_model=List[models.TransactionResponse])
def get_transactions(
    category: Optional[str] = Query(None),
    month: Optional[str] = Query(None),  # YYYY-MM
    anomalies_only: bool = Query(False),
    db: Session = Depends(get_db),
):
    query = db.query(models.Transaction)

    if category:
        query = query.filter(models.Transaction.category == category)
    if month:
        query = query.filter(models.Transaction.date.startswith(month))
    if anomalies_only:
        query = query.filter(models.Transaction.is_anomaly == True)

    return query.order_by(desc(models.Transaction.date)).all()


@router.delete("")
def clear_transactions(db: Session = Depends(get_db)):
    db.query(models.Transaction).delete()
    db.commit()
    return {"message": "All transactions cleared."}
