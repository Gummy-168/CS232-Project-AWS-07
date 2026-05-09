from __future__ import annotations

"""Enrollment ORM model for the Classroom Q&A System."""

from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column

from database import Base


class Enrollment(Base):
    """Represents a student's enrollment in a course."""

    __tablename__ = "enrollments"

    enrollment_id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True,
    )
    student_id: Mapped[str] = mapped_column(
        String(50),
        ForeignKey("users.user_id", onupdate="CASCADE", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    course_code: Mapped[str] = mapped_column(
        String(50),
        ForeignKey("courses.course_code", onupdate="CASCADE", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    section_id: Mapped[str | None] = mapped_column(
        String(50),
        ForeignKey("course_sections.section_id", onupdate="CASCADE", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    join_date: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        server_default=func.now(),
    )

    def normalize_state(self) -> None:
        """Normalize string fields before persistence."""
        self.student_id = self.student_id.strip()
        self.course_code = self.course_code.strip().upper()
        if self.section_id is not None:
            self.section_id = self.section_id.strip()
