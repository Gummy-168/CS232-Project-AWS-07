from __future__ import annotations

"""User management service for the Classroom Q&A System."""

from hashlib import sha256

from models.user import User


class UserManager:
    """Handles user-related operations."""

    def __init__(self) -> None:
        self._users: list[User] = []
        self._next_user_id = 1

    def register_user(
        self,
        email: str,
        password: str,
        role: str,
        nickname: str,
    ) -> User:
        """Register a new user."""
        normalized_email = email.strip().lower()
        if any(user.email.lower() == normalized_email for user in self._users):
            raise ValueError(f"User with email {email} already exists.")

        user = User(
            user_id=self._next_user_id,
            email=normalized_email,
            password_hash=self._hash_password(password),
            role=role,
            nickname=nickname.strip(),
        )
        if not user.validate_profile_state():
            raise ValueError("User profile is incomplete.")

        self._users.append(user)
        self._next_user_id += 1
        return user

    def authenticate_user(self, email: str, password: str) -> User | None:
        """Authenticate a user."""
        normalized_email = email.strip().lower()
        password_hash = self._hash_password(password)
        for user in self._users:
            if user.email.lower() == normalized_email and user.authenticate(password_hash):
                return user
        return None

    def update_nickname(self, user_id: int, nickname: str) -> User | None:
        """Update a user's nickname."""
        user = self.get_user_by_id(user_id)
        if user is None:
            return None

        user.nickname = nickname.strip()
        return user

    def get_user_by_id(self, user_id: int) -> User | None:
        """Retrieve a user by identifier."""
        return next((user for user in self._users if user.user_id == user_id), None)

    def logout_user(self, user_id: int) -> bool:
        """Validate that a user exists before logout completes."""
        return self.get_user_by_id(user_id) is not None

    @property
    def users(self) -> list[User]:
        """Expose a copy of managed users."""
        return list(self._users)

    @staticmethod
    def _hash_password(password: str) -> str:
        """Hash a password for simple in-memory authentication."""
        if not password:
            raise ValueError("Password cannot be empty.")
        return sha256(password.encode("utf-8")).hexdigest()
