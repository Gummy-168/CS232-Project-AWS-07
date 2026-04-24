from __future__ import annotations

"""User model for the Classroom Q&A System."""

from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column

from database import Base

class User(Base):
    """Represents a user record in the database with validation logic."""
    __tablename__ = "users"

    # --- ส่วนของคุณ (Database Mapping) ---
    id: Mapped[str] = mapped_column(String(50), primary_key=True, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    password: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(50), nullable=False)
    nickname: Mapped[str] = mapped_column(String(100), nullable=False)

    # --- ส่วนของเพื่อน (Validation Logic) ---
    VALID_ROLES = {"student", "professor"}

    def authenticate(self, password_plain: str) -> bool:
        """Check whether the password matches."""
        return self.password == password_plain

    def validate_profile_state(self) -> bool:
        """Validate whether the user profile is ready for use."""
        return all([
            len(self.id) > 0,
            "@" in self.email,
            self.role.lower() in self.VALID_ROLES,
            len(self.nickname.strip()) > 0
        ])