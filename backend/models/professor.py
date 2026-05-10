from __future__ import annotations

"""Professor model for dedicated professor storage."""

import hashlib

from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column

from database import Base


class Professor(Base):
    """Represents a professor record stored outside the general users table."""

    __tablename__ = "professors"

    professor_id: Mapped[str] = mapped_column(String(50), primary_key=True, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        default="professor",
        server_default="professor",
    )
    full_name: Mapped[str] = mapped_column(String(150), nullable=False)
    nickname: Mapped[str] = mapped_column(String(100), nullable=False)

    @property
    def user_id(self) -> str:
        """Keep compatibility with older code expecting user_id."""
        return self.professor_id

    @staticmethod
    def hash_password(password_plain: str) -> str:
        """Create a deterministic password hash for storage."""
        return hashlib.sha256(password_plain.encode("utf-8")).hexdigest()

    def authenticate(self, password_plain: str) -> bool:
        """Check whether the password matches."""
        return self.password_hash == self.hash_password(password_plain)

    def validate_profile_state(self) -> bool:
        """Validate whether the professor profile is ready for use."""
        return all(
            [
                len(self.professor_id.strip()) > 0,
                "@" in self.email,
                (self.role or "").strip().lower() == "professor",
                len(self.full_name.strip()) > 0,
                len(self.nickname.strip()) > 0,
            ]
        )
