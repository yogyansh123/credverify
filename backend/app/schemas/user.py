"""
Pydantic Schemas – User
"""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, field_validator


class UserCreate(BaseModel):
    name: str
    email: str
    password: Optional[str] = None
    role: str = "individual"
    headline: Optional[str] = None
    summary: Optional[str] = None
    avatar_url: Optional[str] = None


    @field_validator("role")
    @classmethod
    def role_must_be_valid(cls, v: str) -> str:
        allowed = {"individual", "recruiter"}
        if v not in allowed:
            raise ValueError(f"role must be one of {allowed}")
        return v

    @field_validator("name")
    @classmethod
    def name_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("name must not be empty")
        return v.strip()


class UserLogin(BaseModel):
    email: str
    password: str


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    email: str
    role: str
    headline: Optional[str] = None
    summary: Optional[str] = None
    avatar_url: Optional[str] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime

