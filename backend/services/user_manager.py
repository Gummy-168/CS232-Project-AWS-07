from __future__ import annotations

"""User management service for the Classroom Q&A System."""

import os
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException, status
from jose import JWTError, jwt
from sqlalchemy import and_, or_
from sqlalchemy.orm import Session

from models.user import User
from schemas.user import TokenResponse, UserCreate


class UserManager:
    """Handles user-related operations."""

    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "change-this-secret-in-env")
    JWT_ALGORITHM = "HS256"
    JWT_EXPIRE_MINUTES = int(os.getenv("JWT_EXPIRE_MINUTES", "60"))
    ROLE_REDIRECTS: dict[str, str] = {
        "student": "/student/dashboard",
        "professor": "/professor/dashboard",
    }

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

        normalized_role = user_data.role.strip().lower()
        if normalized_role not in User.VALID_ROLES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Role must be either 'student' or 'professor'",
            )

        user: User = User(
            user_id=user_data.id.strip(),
            email=user_data.email,
            password_hash=User.hash_password(user_data.password),
            role=normalized_role,
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
        selected_role: str,
    ) -> TokenResponse:
        """Authenticate a user and return a role-aware access token."""
        normalized_selected_role = selected_role.strip().lower()
        if normalized_selected_role not in cls.ROLE_REDIRECTS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Role must be either 'student' or 'professor'",
            )

        user: User | None = (
            db.query(User)
            .filter(
                and_(
                    User.email == email,
                    User.role == normalized_selected_role,
                )
            )
            .first()
        )

        if user is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="No account found for this role",
            )

        if not user.validate_profile_state():
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User profile is invalid",
            )

        if not user.authenticate(password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password",
            )

        redirect_to = cls.ROLE_REDIRECTS.get(normalized_selected_role, "/")
        access_token = cls.create_access_token(user)
        return TokenResponse(
            access_token=access_token,
            token_type="bearer",
            user_id=user.user_id,
            role=normalized_selected_role,
            redirect_to=redirect_to,
            nickname=user.nickname,
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

    @classmethod
    def create_access_token(cls, user: User) -> str:
        """Generate a signed JWT token for a user."""
        expires_at = datetime.now(timezone.utc) + timedelta(
            minutes=cls.JWT_EXPIRE_MINUTES
        )
        payload = {
            "sub": user.user_id,
            "role": user.role,
            "exp": expires_at,
        }
        return jwt.encode(
            payload,
            cls.JWT_SECRET_KEY,
            algorithm=cls.JWT_ALGORITHM,
        )

    @classmethod
    def get_current_user(
        cls,
        db: Session,
        token: str,
    ) -> User:
        """Resolve the authenticated user from a JWT token."""
        unauthorized_exception = HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )

        try:
            payload = jwt.decode(
                token,
                cls.JWT_SECRET_KEY,
                algorithms=[cls.JWT_ALGORITHM],
            )
        except JWTError as exc:
            raise unauthorized_exception from exc

        user_id = str(payload.get("sub", "")).strip()
        if not user_id:
            raise unauthorized_exception

        user = cls.get_user_by_id(db=db, user_id=user_id)
        if user is None:
            raise unauthorized_exception

        return user

    @classmethod
    def require_professor(
        cls,
        db: Session,
        token: str,
    ) -> User:
        """Resolve the current user and ensure they are a professor."""
        user = cls.get_current_user(db=db, token=token)
        if user.role != "professor":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only professors can perform this action",
            )
        return user
