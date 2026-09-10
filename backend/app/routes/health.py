"""
Route – Health check
GET /api/health
"""
from fastapi import APIRouter
from app.config import get_settings

router = APIRouter(tags=["Health"])
settings = get_settings()


@router.get("/health")
def health_check():
    """
    Returns the API status, version, and database type.
    Used by monitoring tools and CI pipelines to confirm the server is up.
    """
    db_type = "postgresql" if settings.database_url.startswith(("postgres://", "postgresql://")) else "sqlite (local dev)"
    return {
        "status": "ok",
        "app": settings.app_name,
        "version": settings.app_version,
        "database": db_type,
    }
