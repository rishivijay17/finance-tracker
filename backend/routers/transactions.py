from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from database import get_db
import models
from typing import Optional, List

router = APIRouter(prefix="/api/transactions", tags=["transactions"])


def _resolve_session_id(session_id: Optional[int], db: Session) -> Optional[int]:
    if session_id is not None:
        return session_id
    latest = (
        db.query(models.UploadSession)
        .order_by(models.UploadSession.upload_date.desc())
        .first()
    )
    return latest.id if latest else None


@router.get("", response_model=List[models.TransactionResponse])
def get_transactions(
    category: Optional[str] = Query(None),
    month: Optional[str] = Query(None),  # YYYY-MM
    anomalies_only: bool = Query(False),
    session_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
):
    sid = _resolve_session_id(session_id, db)

    query = db.query(models.Transaction)
    if sid is not None:
        query = query.filter(models.Transaction.session_id == sid)
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
    db.query(models.UploadSession).delete()
    db.commit()
    return {"message": "All transactions and sessions cleared."}
