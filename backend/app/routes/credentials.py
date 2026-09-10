"""
Routes – Credentials
POST /api/credentials                    – add a credential record for a user
GET  /api/users/{user_id}/credentials    – list all credentials for a user
"""
from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.credential import CredentialCreate, CredentialResponse
from app.services.credential_service import create_credential, get_credentials_for_user

router = APIRouter(tags=["Credentials"])


@router.post(
    "/credentials",
    response_model=CredentialResponse,
    status_code=status.HTTP_201_CREATED,
)
def add_credential(payload: CredentialCreate, db: Session = Depends(get_db)):
    """
    Register a named credential (degree, cert, employment record, etc.) for a user.
    verification_status starts as 'Unverified'.
    """
    return create_credential(db, payload)


@router.get("/users/{user_id}/credentials", response_model=List[CredentialResponse])
def list_user_credentials(user_id: str, db: Session = Depends(get_db)):
    """Return all credential records for a specific user, newest first."""
    return get_credentials_for_user(db, user_id)
