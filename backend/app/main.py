"""
CredVerify FastAPI application – entry point.

Run locally:
    cd backend
    uvicorn app.main:app --reload --port 8000

API docs (auto-generated):
    http://127.0.0.1:8000/docs   (Swagger UI)
    http://127.0.0.1:8000/redoc  (ReDoc)
"""
import os
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import get_settings
from app.database import engine, Base

# Import all models so SQLAlchemy can create their tables on startup
import app.models  # noqa: F401 – side-effect import ensures tables are registered

from app.routes import (
    health_router,
    users_router,
    documents_router,
    claims_router,
    credentials_router,
)

settings = get_settings()

# ---------------------------------------------------------------------------
# Create FastAPI app
# ---------------------------------------------------------------------------
app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description=(
        "CredVerify REST API – backend foundation for AI-assisted credential "
        "verification. OCR and AI analysis are not yet implemented; this layer "
        "provides user, document, claim, and credential data management."
    ),
    docs_url="/docs",
    redoc_url="/redoc",
)

# ---------------------------------------------------------------------------
# CORS – allow the React dev server to communicate with this API
# ---------------------------------------------------------------------------
allowed_origins = [o.strip() for o in settings.allowed_origins.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from sqlalchemy import text

# ---------------------------------------------------------------------------
# Database – create all tables on startup (SQLite / dev only approach)
# ---------------------------------------------------------------------------
@app.on_event("startup")
def create_tables():
    Base.metadata.create_all(bind=engine)
    # Ensure password_hash column exists on users table if table was created previously
    try:
        with engine.connect() as conn:
            if engine.dialect.name == "sqlite":
                cursor = conn.execute(text("PRAGMA table_info(users)"))
                cols = [row[1] for row in cursor.fetchall()]
                if "password_hash" not in cols:
                    conn.execute(text("ALTER TABLE users ADD COLUMN password_hash VARCHAR(255)"))
                    conn.commit()
            elif engine.dialect.name == "postgresql":
                conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255)"))
                conn.commit()
    except Exception as e:
        print(f"[Warning] Auto-migration check: {e}")
    # Ensure uploads directory exists
    os.makedirs(settings.upload_dir, exist_ok=True)


# ---------------------------------------------------------------------------
# Global error handler – return consistent JSON for unhandled exceptions
# ---------------------------------------------------------------------------
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={
            "detail": "An unexpected server error occurred.",
            "type": type(exc).__name__,
        },
    )


# ---------------------------------------------------------------------------
# Register all routers under /api prefix
# ---------------------------------------------------------------------------
API_PREFIX = "/api"

app.include_router(health_router, prefix=API_PREFIX)
app.include_router(users_router, prefix=API_PREFIX)
app.include_router(documents_router, prefix=API_PREFIX)
app.include_router(claims_router, prefix=API_PREFIX)
app.include_router(credentials_router, prefix=API_PREFIX)


# ---------------------------------------------------------------------------
# Root redirect – helpful for developers who hit the base URL
# ---------------------------------------------------------------------------
@app.get("/", include_in_schema=False)
def root():
    return {"message": "CredVerify API is running.", "docs": "/docs", "health": "/api/health"}