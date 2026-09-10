"""
Pydantic Schemas – Claim
"""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, field_validator

VALID_CATEGORIES = {
    "Education", "Experience", "Certifications",
    "Skills & Publications", "Identity", "Other",
}
VALID_STATUSES = {"Pending", "Match", "Mismatch", "Unsupported"}


class ClaimCreate(BaseModel):
    user_id: str
    source_document_id: Optional[str] = None
    category: str
    claim_text: str
    status: Optional[str] = "Pending"
    details: Optional[str] = None
    confidence_pct: Optional[int] = None

    @field_validator("category")
    @classmethod
    def category_valid(cls, v: str) -> str:
        if v not in VALID_CATEGORIES:
            raise ValueError(f"category must be one of {VALID_CATEGORIES}")
        return v

    @field_validator("status")
    @classmethod
    def status_valid(cls, v: Optional[str]) -> str:
        if v is not None and v not in VALID_STATUSES:
            raise ValueError(f"status must be one of {VALID_STATUSES}")
        return v or "Pending"

    @field_validator("claim_text")
    @classmethod
    def text_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("claim_text must not be empty")
        return v.strip()


class ClaimResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    source_document_id: Optional[str] = None
    category: str
    claim_text: str
    status: str
    details: Optional[str] = None
    confidence_pct: Optional[int] = None
    matched_document: Optional[str] = None
    matched_document_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime

