from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.sql import func
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from database import Base


class UploadSession(Base):
    __tablename__ = "upload_sessions"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, nullable=False)
    upload_date = Column(DateTime, server_default=func.now())
    statement_period = Column(String, nullable=True)
    transaction_count = Column(Integer, default=0)
    fingerprint = Column(String, nullable=True)


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(String, nullable=False)
    description = Column(String, nullable=False)
    amount = Column(Float, nullable=False)  # negative = expense, positive = income
    category = Column(String, default="Other")
    is_anomaly = Column(Boolean, default=False)
    anomaly_reason = Column(String, nullable=True)
    categorization_reason = Column(String, nullable=True)
    source_file = Column(String, nullable=True)
    session_id = Column(Integer, ForeignKey("upload_sessions.id"), nullable=True)
    created_at = Column(DateTime, server_default=func.now())


class AppSettings(Base):
    __tablename__ = "app_settings"

    key = Column(String, primary_key=True)
    value = Column(String, nullable=False)


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    role = Column(String, nullable=False)  # "user" or "assistant"
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, server_default=func.now())


class RecurringPayment(Base):
    __tablename__ = "recurring_payments"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("upload_sessions.id"), nullable=True)
    name = Column(String, nullable=False)
    amount = Column(Float, nullable=False)
    frequency = Column(String, nullable=False)  # monthly, weekly, quarterly, annual
    annual_cost = Column(Float, nullable=False)
    category = Column(String, default="Utilities")
    last_date = Column(String, nullable=True)


class BehavioralInsight(Base):
    __tablename__ = "behavioral_insights"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("upload_sessions.id"), nullable=True)
    insight = Column(Text, nullable=False)
    created_at = Column(DateTime, server_default=func.now())


# ── Pydantic schemas ──────────────────────────────────────────────────────────

class TransactionResponse(BaseModel):
    id: int
    date: str
    description: str
    amount: float
    category: str
    is_anomaly: bool
    anomaly_reason: Optional[str] = None
    categorization_reason: Optional[str] = None
    source_file: Optional[str] = None
    session_id: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True


class UploadSessionResponse(BaseModel):
    id: int
    filename: str
    upload_date: datetime
    statement_period: Optional[str] = None
    transaction_count: int

    class Config:
        from_attributes = True


class ChatRequest(BaseModel):
    message: str


class ChatResponse(BaseModel):
    reply: str
