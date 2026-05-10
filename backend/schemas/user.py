from __future__ import annotations

"""Pydantic schemas for user authentication."""

from pydantic import BaseModel, EmailStr


class UserLogin(BaseModel):
    """Request schema for user login."""

    email: EmailStr
    password: str
    role: str


class UserCreate(BaseModel):
    """Request schema for user registration."""

    id: str
    full_name: str
    email: EmailStr
    password: str
    role: str
    nickname: str


class TokenResponse(BaseModel):
    """Response schema for JWT authentication."""

    access_token: str
    token_type: str
    user_id: str
    role: str
    redirect_to: str
    full_name: str
    nickname: str
