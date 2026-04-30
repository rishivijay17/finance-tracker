from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
import models
from typing import List

router = APIRouter(prefix="/api/sessions", tags=["sessions"])


@router.get("", response_model=List[models.UploadSessionResponse])
def get_sessions(db: Session = Depends(get_db)):
    return (
        db.query(models.UploadSession)
        .order_by(models.UploadSession.upload_date.desc())
        .all()
    )


@router.delete("/{session_id}")
def delete_session(session_id: int, db: Session = Depends(get_db)):
    session = db.query(models.UploadSession).filter(
        models.UploadSession.id == session_id
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    db.query(models.Transaction).filter(
        models.Transaction.session_id == session_id
    ).delete()
    db.delete(session)
    db.commit()
    return {"message": "Session and its transactions deleted."}
