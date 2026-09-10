"""
ORM Models – Credential Record
"""
import uuid
from datetime import datetime, timezone, date
from typing import Optional
from sqlalchemy import String, Text, Date, DateTime, ForeignKey, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base
import enum


class CredentialType(str, enum.Enum):
    degree = "Degree"
    certification = "Certification"
    employment = "Employment"
    internship = "Internship"
    publication = "Publication"
    other = "Other"


class CredentialStatus(str, enum.Enum):
    unverified = "Unverified"
    pending = "Pending"
    verified = "Verified"
    needs_review = "Needs Review"


class Credential(Base):
    __tablename__ = "credentials"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    document_id: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("documents.id", ondelete="SET NULL"), nullable=True
    )
    credential_type: Mapped[str] = mapped_column(
        SAEnum(CredentialType, values_callable=lambda e: [m.value for m in e]),
        nullable=False,
    )
    title: Mapped[str] = mapped_column(String(300), nullable=False)
    issuing_organization: Mapped[Optional[str]] = mapped_column(String(300), nullable=True)
    issue_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    expiry_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    verification_status: Mapped[str] = mapped_column(
        SAEnum(CredentialStatus, values_callable=lambda e: [m.value for m in e]),
        nullable=False,
        default=CredentialStatus.unverified.value,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )
