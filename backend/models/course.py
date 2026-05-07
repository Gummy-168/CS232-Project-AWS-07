from __future__ import annotations

"""Course ORM model for the Classroom Q&A System."""

from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, String, func
from sqlalchemy.orm import Mapped, mapped_column

from database import Base


class Course(Base):
    """Represents a course record in the database."""

    __tablename__ = "courses"

    course_code: Mapped[str] = mapped_column(String(50), primary_key=True, index=True)
    course_name: Mapped[str] = mapped_column(String(255), nullable=False)
    professor_id: Mapped[str] = mapped_column(
        String(50),
        ForeignKey("users.user_id", onupdate="CASCADE", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        server_default=func.now(),
    )

    @property
    def prof_id(self) -> str:
        """Expose the professor identifier with the older attribute name."""
        return self.professor_id

    @prof_id.setter
    def prof_id(self, value: str) -> None:
        """Keep compatibility with code that still writes to prof_id."""
        self.professor_id = value.strip()

    def normalize_state(self) -> None:
        """Normalize string fields before persistence."""
        self.course_code = self.course_code.strip().upper()
        self.course_name = self.course_name.strip()
        self.professor_id = self.professor_id.strip()
