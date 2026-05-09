from __future__ import annotations

"""Course section ORM model for the Classroom Q&A System."""

from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, String, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column

from database import Base


class CourseSection(Base):
    """Represents one section belonging to a course."""

    __tablename__ = "course_sections"
    __table_args__ = (
        UniqueConstraint("course_code", "section_code", name="uq_course_sections_course_section"),
    )

    section_id: Mapped[str] = mapped_column(String(50), primary_key=True, index=True)
    course_code: Mapped[str] = mapped_column(
        String(50),
        ForeignKey("courses.course_code", onupdate="CASCADE", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    section_code: Mapped[str] = mapped_column(String(50), nullable=False)
    meeting_days: Mapped[str] = mapped_column(String(100), nullable=False, default="")
    start_time: Mapped[str] = mapped_column(String(5), nullable=False)
    end_time: Mapped[str] = mapped_column(String(5), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        server_default=func.now(),
    )

    def normalize_state(self) -> None:
        """Normalize string fields before persistence."""
        self.section_id = self.section_id.strip()
        self.course_code = self.course_code.strip().upper()
        self.section_code = self.section_code.strip().upper()
        self.meeting_days = ",".join(
            day.strip().title()
            for day in self.meeting_days.split(",")
            if day.strip()
        )
        self.start_time = self.start_time.strip()
        self.end_time = self.end_time.strip()
