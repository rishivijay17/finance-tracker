from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
from routers.upload import router as upload_router
from routers.transactions import router as transactions_router
from routers.chat import router as chat_router
from routers.analytics import router as analytics_router

# Create all database tables on startup
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Finance Tracker API", version="1.0.0")

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


@app.get("/api/health")
def health():
    return {"status": "ok", "message": "Finance Tracker API is running"}
