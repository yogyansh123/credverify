"""
Pydantic Schemas – Document
"""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, field_validator

VALID_CATEGORIES = {
    "Resume",
    "Degree / Marksheet",
    "Certifications",
    "Experience Letter",
    "Government ID",
    "Other Document",
}

VALID_STATUSES = {"Pending", "Processing", "Verified", "Mismatch", "Unsupported"}


class DocumentCreate(BaseModel):
    user_id: str
    original_name: str
    category: str
    file_size_bytes: int = 0
    mime_type: str = "application/pdf"

    @field_validator("category")
    @classmethod
    def category_valid(cls, v: str) -> str:
        if v not in VALID_CATEGORIES:
            raise ValueError(f"category must be one of {VALID_CATEGORIES}")
        return v

    @field_validator("file_size_bytes")
    @classmethod
    def size_non_negative(cls, v: int) -> int:
        if v < 0:
            raise ValueError("file_size_bytes must be >= 0")
        return v


class DocumentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    original_name: str
    stored_name: str
    storage_path: Optional[str] = None
    category: str
    file_size_bytes: int
    mime_type: str
    status: str
    extracted_claims_count: int
    uploaded_at: datetime

