from __future__ import annotations

"""User management service for the Classroom Q&A System."""

import os
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException, status
from jose import jwt
from sqlalchemy import or_
from sqlalchemy.orm import Session

from models.user import User
from schemas.user import TokenResponse, UserCreate


class UserManager:
    """Handles user-related operations."""

    _SECRET_KEY: str = os.getenv("SECRET_KEY", "super-secret-key-cs232")
    _ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
    _ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    @classmethod
    def register_user(
        cls,
        db: Session,
        user_data: UserCreate,
    ) -> User:
        """Register a new user if the identifier and email are unique."""
        existing_user: User | None = (
            db.query(User)
            .filter(or_(User.id == user_data.id, User.email == user_data.email))
            .first()
        )

        if existing_user is not None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User id or email already exists",
            )

        user: User = User(
            id=user_data.id,
            email=user_data.email,
            password=user_data.password,
            role=user_data.role,
            nickname=user_data.nickname,
        )

        db.add(user)
        db.commit()
        db.refresh(user)

        return user

    @classmethod
    def create_access_token(cls, data: dict[str, str]) -> str:
        """Create a JWT access token from the provided payload."""
        to_encode: dict[str, str | datetime] = data.copy()

        expire: datetime = datetime.now(timezone.utc) + timedelta(
            minutes=cls._ACCESS_TOKEN_EXPIRE_MINUTES
        )

        to_encode["exp"] = expire

        return jwt.encode(
            to_encode,
            cls._SECRET_KEY,
            algorithm=cls._ALGORITHM,
        )

    @classmethod
    def authenticate_user(
        cls,
        db: Session,
        email: str,
        password: str,
    ) -> TokenResponse:
        """Authenticate a user and return a role-aware access token."""
        user: User | None = db.query(User).filter(User.email == email).first()

        if user is None or user.password != password:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password",
            )

        access_token: str = cls.create_access_token(
            {
                "sub": user.email,
                "role": user.role,
            }
        )

        return TokenResponse(
            access_token=access_token,
            token_type="bearer",
            role=user.role,
        )

    @classmethod
    def update_nickname(
        cls,
        db: Session,
        user_id: str,
        nickname: str,
    ) -> User | None:
        """Update a user's nickname."""
        user: User | None = db.query(User).filter(User.id == user_id).first()

        if user is None:
            return None

        user.nickname = nickname.strip()
        db.commit()
        db.refresh(user)

        return user

    @classmethod
    def get_user_by_id(
        cls,
        db: Session,
        user_id: str,
    ) -> User | None:
        """Retrieve a user by identifier."""
        return db.query(User).filter(User.id == user_id).first()

    @classmethod
    def logout_user(
        cls,
        db: Session,
        user_id: str,
    ) -> bool:
        """Validate that a user exists before logout completes."""
        user: User | None = cls.get_user_by_id(db, user_id)
        return user is not None