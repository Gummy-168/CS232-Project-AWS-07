from __future__ import annotations

"""User model for the Classroom Q&A System."""

import hashlib

from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column

from database import Base


class User(Base):
    """Represents a user record in the database with validation logic."""

    __tablename__ = "users"

    user_id: Mapped[str] = mapped_column("user_id", String(50), primary_key=True, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    password_hash: Mapped[str] = mapped_column("password_hash", String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(50), nullable=False)
    nickname: Mapped[str] = mapped_column(String(100), nullable=False)

    VALID_ROLES = {"student", "professor"}

    @property
    def id(self) -> str:
        """Expose the user identifier with the name used in some existing code."""
        return self.user_id

    @id.setter
    def id(self, value: str) -> None:
        """Keep compatibility for code that still writes to id."""
        self.user_id = value

    @staticmethod
    def hash_password(password_plain: str) -> str:
        """Create a deterministic password hash for storage."""
        return hashlib.sha256(password_plain.encode("utf-8")).hexdigest()

    def set_password(self, password_plain: str) -> None:
        """Store a hashed password instead of raw text."""
        self.password_hash = self.hash_password(password_plain)

    def authenticate(self, password_plain: str) -> bool:
        """Check whether the password matches."""
        return self.password_hash == self.hash_password(password_plain)

    def validate_profile_state(self) -> bool:
        """Validate whether the user profile is ready for use."""
        return all(
            [
                len(self.user_id.strip()) > 0,
                "@" in self.email,
                self.role.lower() in self.VALID_ROLES,
                len(self.nickname.strip()) > 0,
            ]
        )
