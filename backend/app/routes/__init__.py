from app.routes.health import router as health_router
from app.routes.users import router as users_router
from app.routes.documents import router as documents_router
from app.routes.claims import router as claims_router
from app.routes.credentials import router as credentials_router

__all__ = [
    "health_router",
    "users_router",
    "documents_router",
    "claims_router",
    "credentials_router",
]
