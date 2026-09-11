"""
Routes – Users
POST /api/users          – create a new user profile
GET  /api/users/{user_id} – retrieve a user profile by ID
"""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.user import UserCreate, UserLogin, UserResponse
from app.services.user_service import create_user, get_user, get_user_by_email, authenticate_user

router = APIRouter(prefix="/users", tags=["Users"])


@router.post("", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_user_profile(payload: UserCreate, db: Session = Depends(get_db)):
    """Create a new user profile (individual candidate or recruiter)."""
    return create_user(db, payload)


@router.post("/login", response_model=UserResponse)
def login_user(payload: UserLogin, db: Session = Depends(get_db)):
    """Authenticate an existing user with email and password."""
    user = authenticate_user(db, payload.email, payload.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )
    return user


@router.get("", response_model=UserResponse)
def lookup_user_by_email(email: str, db: Session = Depends(get_db)):
    """Retrieve an existing user profile by email query (?email=...)."""
    user = get_user_by_email(db, email)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with email '{email}' not found.",
        )
    return user


@router.get("/{user_id}", response_model=UserResponse)
def get_user_profile(user_id: str, db: Session = Depends(get_db)):
    """Retrieve an existing user profile by its UUID."""
    user = get_user(db, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User '{user_id}' not found.",
        )
    return user

