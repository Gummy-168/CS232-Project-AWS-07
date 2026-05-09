from __future__ import annotations

"""Timed join-code ORM model for course and section enrollment."""

from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, String, func
from sqlalchemy.orm import Mapped, mapped_column

from database import Base


class CourseJoinCode(Base):
    """Represents a professor-generated join code for a course or section."""

    __tablename__ = "course_join_codes"

    join_code_id: Mapped[str] = mapped_column(String(50), primary_key=True, index=True)
    code: Mapped[str] = mapped_column(String(20), nullable=False, unique=True, index=True)
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
    professor_id: Mapped[str] = mapped_column(
        String(50),
        ForeignKey("professors.professor_id", onupdate="CASCADE", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    expires_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        server_default=func.now(),
    )

    def normalize_state(self) -> None:
        """Normalize string fields before persistence."""
        self.join_code_id = self.join_code_id.strip()
        self.code = self.code.strip().upper()
        self.course_code = self.course_code.strip().upper()
        if self.section_id is not None:
            self.section_id = self.section_id.strip()
        self.professor_id = self.professor_id.strip()
