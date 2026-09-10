"""
ORM Models – Resume Claim
"""
import uuid
from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import String, Text, Integer, DateTime, ForeignKey, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base
import enum


class ClaimCategory(str, enum.Enum):
    education = "Education"
    experience = "Experience"
    certification = "Certifications"
    skills = "Skills & Publications"
    identity = "Identity"
    other = "Other"


class ClaimStatus(str, enum.Enum):
    pending = "Pending"
    match = "Match"
    mismatch = "Mismatch"
    unsupported = "Unsupported"


class Claim(Base):
    __tablename__ = "claims"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    source_document_id: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("documents.id", ondelete="SET NULL"), nullable=True
    )
    category: Mapped[str] = mapped_column(
        SAEnum(ClaimCategory, values_callable=lambda e: [m.value for m in e]),
        nullable=False,
    )
    claim_text: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(
        SAEnum(ClaimStatus, values_callable=lambda e: [m.value for m in e]),
        nullable=False,
        default=ClaimStatus.pending.value,
    )
    details: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    confidence_pct: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )
