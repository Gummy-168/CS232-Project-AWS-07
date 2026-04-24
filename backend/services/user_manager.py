from __future__ import annotations

"""User management service for the Classroom Q&A System."""

from models.user import User


class UserManager:
    """Handles user-related operations."""

    def register_user(
        self,
        email: str,
        password: str,
        role: str,
        nickname: str,
    ) -> User:
        """Register a new user."""
        pass

    def authenticate_user(self, email: str, password: str) -> User | None:
        """Authenticate a user."""
        pass

    def update_nickname(self, user_id: int, nickname: str) -> User | None:
        """Update a user's nickname."""
        pass

    def get_user_by_id(self, user_id: int) -> User | None:
        """Retrieve a user by identifier."""
        pass
