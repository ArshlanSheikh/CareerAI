from pydantic import BaseModel, Field, field_validator
from typing import Optional
from app.common.validators import is_valid_email


class RegisterRequest(BaseModel):
    email: str = Field(..., description="Valid student email address")
    password: str = Field(..., min_length=6, description="Password must be at least 6 characters")
    full_name: str = Field(..., min_length=2, max_length=100, description="Full name of the student")

    @field_validator("email")
    @classmethod
    def validate_and_normalize_email(cls, v: str) -> str:
        clean = v.strip().lower()
        if not is_valid_email(clean):
            raise ValueError("Invalid email format")
        return clean

    @field_validator("full_name")
    @classmethod
    def clean_name(cls, v: str) -> str:
        clean = v.strip()
        if len(clean) < 2:
            raise ValueError("Full name must be at least 2 characters long")
        return clean


class LoginRequest(BaseModel):
    email: str = Field(..., description="Student email address")
    password: str = Field(..., min_length=1, description="Password is required")

    @field_validator("email")
    @classmethod
    def validate_and_normalize_email(cls, v: str) -> str:
        clean = v.strip().lower()
        if not is_valid_email(clean):
            raise ValueError("Invalid email format")
        return clean


class UserResponse(BaseModel):
    id: str
    email: str
    full_name: str
    created_at: Optional[str] = None
