"""
Service – Credential CRUD operations
"""
import uuid
from datetime import datetime, timezone
from typing import List
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.credential import Credential
from app.schemas.credential import CredentialCreate
from app.services.user_service import get_user


def create_credential(db: Session, payload: CredentialCreate) -> Credential:
    user = get_user(db, payload.user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User '{payload.user_id}' not found.",
        )

    now = datetime.now(timezone.utc)
    cred = Credential(
        id=str(uuid.uuid4()),
        user_id=payload.user_id,
        document_id=payload.document_id,
        credential_type=payload.credential_type,
        title=payload.title,
        issuing_organization=payload.issuing_organization,
        issue_date=payload.issue_date,
        expiry_date=payload.expiry_date,
        description=payload.description,
        verification_status="Unverified",
        created_at=now,
        updated_at=now,
    )
    db.add(cred)
    db.commit()
    db.refresh(cred)
    return cred


def get_credentials_for_user(db: Session, user_id: str) -> List[Credential]:
    user = get_user(db, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User '{user_id}' not found.",
        )
    return (
        db.query(Credential)
        .filter(Credential.user_id == user_id)
        .order_by(Credential.created_at.desc())
        .all()
    )
