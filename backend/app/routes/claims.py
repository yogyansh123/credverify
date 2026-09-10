"""
Routes – Claims
POST /api/claims                    – add a resume claim for a user
GET  /api/users/{user_id}/claims    – list all claims for a user
"""
from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.claim import ClaimCreate, ClaimResponse
from app.services.claim_service import create_claim, get_claims_for_user

router = APIRouter(tags=["Claims"])


@router.post("/claims", response_model=ClaimResponse, status_code=status.HTTP_201_CREATED)
def add_claim(payload: ClaimCreate, db: Session = Depends(get_db)):
    """
    Register a single resume claim for a user.
    Status is set to 'Pending' – real analysis is a future step.
    """
    return create_claim(db, payload)


@router.get("/users/{user_id}/claims", response_model=List[ClaimResponse])
def list_user_claims(user_id: str, db: Session = Depends(get_db)):
    """Return all resume claims registered for a specific user, newest first."""
    return get_claims_for_user(db, user_id)
