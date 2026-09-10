"""
ORM Models – Document (uploaded credential file metadata)
"""
import uuid
from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import String, Integer, DateTime, ForeignKey, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base
import enum


class DocumentCategory(str, enum.Enum):
    resume = "Resume"
    degree = "Degree / Marksheet"
    certification = "Certifications"
    experience_letter = "Experience Letter"
    government_id = "Government ID"
    other = "Other Document"


class DocumentStatus(str, enum.Enum):
    pending = "Pending"
    processing = "Processing"
    verified = "Verified"
    mismatch = "Mismatch"
    unsupported = "Unsupported"


class Document(Base):
    __tablename__ = "documents"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    original_name: Mapped[str] = mapped_column(String(500), nullable=False)
    stored_name: Mapped[str] = mapped_column(String(500), nullable=False)
    storage_path: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    category: Mapped[str] = mapped_column(
        SAEnum(DocumentCategory, values_callable=lambda e: [m.value for m in e]),
        nullable=False,
    )
    file_size_bytes: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    mime_type: Mapped[str] = mapped_column(
        String(100), nullable=False, default="application/pdf"
    )
    status: Mapped[str] = mapped_column(
        SAEnum(DocumentStatus, values_callable=lambda e: [m.value for m in e]),
        nullable=False,
        default=DocumentStatus.pending.value,
    )
    extracted_claims_count: Mapped[int] = mapped_column(Integer, default=0)
    uploaded_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
