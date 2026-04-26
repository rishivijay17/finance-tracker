from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text
from sqlalchemy.sql import func
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from database import Base


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(String, nullable=False)
    description = Column(String, nullable=False)
    amount = Column(Float, nullable=False)  # negative = expense, positive = income
    category = Column(String, default="Other")
    is_anomaly = Column(Boolean, default=False)
    anomaly_reason = Column(String, nullable=True)
    source_file = Column(String, nullable=True)
    created_at = Column(DateTime, server_default=func.now())


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    role = Column(String, nullable=False)  # "user" or "assistant"
    content = Column(Text, nullable=False)
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
    source_file: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class ChatRequest(BaseModel):
    message: str


class ChatResponse(BaseModel):
    reply: str
