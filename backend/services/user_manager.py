from __future__ import annotations

"""User management service for the Classroom Q&A System."""

from fastapi import HTTPException, status
from sqlalchemy import or_
from sqlalchemy.orm import Session

from models.user import User
from schemas.user import TokenResponse, UserCreate


class UserManager:
    """Handles user-related operations."""

    @classmethod
    def register_user(
        cls,
        db: Session,
        user_data: UserCreate,
    ) -> User:
        """Register a new user if the identifier and email are unique."""
        existing_user: User | None = (
            db.query(User)
            .filter(or_(User.user_id == user_data.id, User.email == user_data.email))
            .first()
        )

        if existing_user is not None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User id or email already exists",
            )

        user: User = User(
            user_id=user_data.id.strip(),
            email=user_data.email,
            password_hash=User.hash_password(user_data.password),
            role=user_data.role,
            nickname=user_data.nickname.strip(),
        )

        db.add(user)
        db.commit()
        db.refresh(user)

        return user

    @classmethod
    def authenticate_user(
        cls,
        db: Session,
        email: str,
        password: str,
    ) -> TokenResponse:
        """Authenticate a user and return a role-aware access token."""
        user: User | None = db.query(User).filter(User.email == email).first()

        if user is None or not user.authenticate(password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password",
            )

        return TokenResponse(
            access_token=user.user_id,
            token_type="session",
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
        user: User | None = db.query(User).filter(User.user_id == user_id).first()

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
        return db.query(User).filter(User.user_id == user_id).first()

    @classmethod
    def logout_user(
        cls,
        db: Session,
        user_id: str,
    ) -> bool:
        """Validate that a user exists before logout completes."""
        user: User | None = cls.get_user_by_id(db, user_id)
        return user is not None
