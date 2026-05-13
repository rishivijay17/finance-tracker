from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import inspect, text as sql_text
from database import engine, Base
from routers.upload import router as upload_router
from routers.transactions import router as transactions_router
from routers.chat import router as chat_router
from routers.analytics import router as analytics_router
from routers.sessions import router as sessions_router

# Create all new tables (upload_sessions, recurring_payments, behavioral_insights, etc.)
Base.metadata.create_all(bind=engine)

# ── Schema migrations for existing databases ──────────────────────────────────
with engine.connect() as conn:
    inspector = inspect(engine)
    existing_tables = inspector.get_table_names()

    if "transactions" in existing_tables:
        tx_cols = {col["name"] for col in inspector.get_columns("transactions")}
        if "session_id" not in tx_cols:
            conn.execute(sql_text(
                "ALTER TABLE transactions ADD COLUMN session_id INTEGER REFERENCES upload_sessions(id)"
            ))
            conn.commit()
        if "categorization_reason" not in tx_cols:
            conn.execute(sql_text(
                "ALTER TABLE transactions ADD COLUMN categorization_reason TEXT"
            ))
            conn.commit()

    if "upload_sessions" in existing_tables:
        sess_cols = {col["name"] for col in inspector.get_columns("upload_sessions")}
        if "fingerprint" not in sess_cols:
            conn.execute(sql_text(
                "ALTER TABLE upload_sessions ADD COLUMN fingerprint TEXT"
            ))
            conn.commit()

    # Wrap any orphaned transactions (no session_id) in a legacy session
    if "transactions" in existing_tables and "upload_sessions" in existing_tables:
        result = conn.execute(
            sql_text("SELECT COUNT(*) FROM transactions WHERE session_id IS NULL")
        )
        orphan_count = result.scalar()
        if orphan_count and orphan_count > 0:
            conn.execute(sql_text(
                "INSERT INTO upload_sessions (filename, statement_period, transaction_count) "
                "VALUES ('legacy_import.pdf', 'Previous Data', :cnt)"
            ), {"cnt": orphan_count})
            result = conn.execute(sql_text("SELECT last_insert_rowid()"))
            legacy_id = result.scalar()
            conn.execute(sql_text(
                "UPDATE transactions SET session_id = :sid WHERE session_id IS NULL"
            ), {"sid": legacy_id})
            conn.commit()
# ─────────────────────────────────────────────────────────────────────────────

app = FastAPI(title="Finance Tracker API", version="3.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(upload_router)
app.include_router(transactions_router)
app.include_router(chat_router)
app.include_router(analytics_router)
app.include_router(sessions_router)


@app.get("/api/health")
def health():
    return {"status": "ok", "message": "Finance Tracker API is running"}
