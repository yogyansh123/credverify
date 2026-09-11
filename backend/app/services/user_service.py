"""
Service – User CRUD operations
"""
import hashlib
import secrets
import uuid
from datetime import datetime, timezone
from typing import Optional
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.models.user import User
from app.schemas.user import UserCreate
from fastapi import HTTPException, status


def hash_password(password: str) -> str:
    """Generate a salted PBKDF2-HMAC-SHA256 hash."""
    salt = secrets.token_hex(16)
    key = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        bytes.fromhex(salt),
        100_000,
    ).hex()
    return f"{salt}${key}"


def verify_password(plain_password: str, stored_hash: Optional[str]) -> bool:
    """Verify plain password against stored salt$hash securely."""
    if not stored_hash or "$" not in stored_hash:
        return False
    try:
        salt, expected_key = stored_hash.split("$", 1)
        computed_key = hashlib.pbkdf2_hmac(
            "sha256",
            plain_password.encode("utf-8"),
            bytes.fromhex(salt),
            100_000,
        ).hex()
        return secrets.compare_digest(computed_key, expected_key)
    except Exception:
        return False


def get_user(db: Session, user_id: str) -> Optional[User]:
    return db.query(User).filter(User.id == user_id, User.is_active == True).first()


def get_user_by_email(db: Session, email: str) -> Optional[User]:
    normalized_email = (email or "").strip().lower()
    return db.query(User).filter(User.email.ilike(normalized_email)).first()


def authenticate_user(db: Session, email: str, password: str) -> Optional[User]:
    """
    Authenticate user by email and password.
    Returns User if valid, None otherwise.
    """
    user = get_user_by_email(db, email)
    if not user or not user.is_active:
        return None

    # If user has a stored password hash, verify it
    if user.password_hash:
        if not verify_password(password, user.password_hash):
            return None
        return user

    # If user was created without a password (legacy or test mock), allow initial login
    # and securely hash the provided password for subsequent logins
    if password:
        user.password_hash = hash_password(password)
        db.commit()
        db.refresh(user)
    return user


def create_user(db: Session, payload: UserCreate) -> User:
    normalized_email = payload.email.strip().lower()
    # Guard against duplicate email
    if get_user_by_email(db, normalized_email):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"A user with email '{payload.email}' already exists.",
        )

    now = datetime.now(timezone.utc)
    user_pw_hash = hash_password(payload.password) if payload.password else None

    user = User(
        id=str(uuid.uuid4()),
        name=payload.name,
        email=normalized_email,
        role=payload.role,
        headline=payload.headline,
        summary=payload.summary,
        avatar_url=payload.avatar_url,
        password_hash=user_pw_hash,
        is_active=True,
        created_at=now,
        updated_at=now,
    )
    db.add(user)
    try:
        db.commit()
        db.refresh(user)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered.",
        )
    return user
