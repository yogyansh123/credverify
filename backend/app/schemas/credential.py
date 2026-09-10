"""
Pydantic Schemas – Credential
"""
from datetime import datetime, date
from typing import Optional
from pydantic import BaseModel, ConfigDict, field_validator

VALID_TYPES = {
    "Degree", "Certification", "Employment",
    "Internship", "Publication", "Other",
}
VALID_STATUSES = {"Unverified", "Pending", "Verified", "Needs Review"}


class CredentialCreate(BaseModel):
    user_id: str
    document_id: Optional[str] = None
    credential_type: str
    title: str
    issuing_organization: Optional[str] = None
    issue_date: Optional[date] = None
    expiry_date: Optional[date] = None
    description: Optional[str] = None

    @field_validator("credential_type")
    @classmethod
    def type_valid(cls, v: str) -> str:
        if v not in VALID_TYPES:
            raise ValueError(f"credential_type must be one of {VALID_TYPES}")
        return v

    @field_validator("title")
    @classmethod
    def title_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("title must not be empty")
        return v.strip()


class CredentialResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    document_id: Optional[str] = None
    credential_type: str
    title: str
    issuing_organization: Optional[str] = None
    issue_date: Optional[date] = None
    expiry_date: Optional[date] = None
    description: Optional[str] = None
    verification_status: str
    created_at: datetime
    updated_at: datetime

