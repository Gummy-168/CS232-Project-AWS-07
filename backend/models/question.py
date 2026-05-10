from __future__ import annotations

"""Question ORM model for the Classroom Q&A System."""

from datetime import datetime

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, String, Text, func, JSON
from sqlalchemy.orm import Mapped, mapped_column

from database import Base

from .user import User


class Question(Base):
    """Represents a question posted on an interaction board."""

    __tablename__ = "questions"
    __allow_unmapped__ = True

    VALID_STATUSES = {"pending", "answered", "deleted"}

    question_id: Mapped[str] = mapped_column(String(50), primary_key=True)
    board_id: Mapped[str | None] = mapped_column(String(50), nullable=True, index=True)
    course_code: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    section_id: Mapped[str] = mapped_column(
        String(50),
        ForeignKey("course_sections.section_id", onupdate="CASCADE", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    student_id: Mapped[str] = mapped_column(
        String(50),
        ForeignKey("users.user_id", onupdate="CASCADE", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    reply_content: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="pending")
    is_anonymous: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    tags: Mapped[list[str] | None] = mapped_column(JSON, nullable=True)
    participation_score: Mapped[float] = mapped_column(
        Float,
        nullable=False,
        default=0,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        server_default=func.now(),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )

    student: User | None = None

    def __init__(
        self,
        question_id: str,
        board_id: int | str | None,
        course_code: str,
        section_id: str,
        student_id: str,
        title: str,
        content: str,
        reply_content: str | None = None,
        status: str = "pending",
        is_anonymous: bool = False,
        tags: list[str] | None = None,
        participation_score: float = 0.0,
        board: InteractionBoard | None = None,
        student: User | None = None,
        created_at: datetime | None = None,
        updated_at: datetime | None = None,
    ) -> None:
        """Initialize a question instance with legacy compatibility."""
        self.question_id = question_id
        self.board_id = str(board_id).strip() if board_id is not None else None
        self.course_code = course_code.strip()
        self.section_id = section_id.strip()
        self.student_id = student_id.strip()
        self.title = self._clean_title(title)
        self.content = self._clean_content(content)
        self.reply_content = reply_content.strip() if reply_content else None
        self.status = self._normalize_status(status)
        self.is_anonymous = is_anonymous
        self.tags = tags or []
        self.participation_score = participation_score
        self.student = student
        if created_at is not None:
            self.created_at = created_at
        if updated_at is not None:
            self.updated_at = updated_at

    def get_question_status(self) -> str:
        """Return the current question status."""
        return self.status

    def set_question_status(self, status: str) -> None:
        """Update the question status."""
        self.status = self._normalize_status(status)

    def process_professor_reply(self, reply_content: str) -> None:
        """Store a professor reply and mark the question as answered."""
        cleaned_reply = reply_content.strip()
        if not cleaned_reply:
            raise ValueError("Reply content cannot be empty.")
        self.reply_content = cleaned_reply
        self.status = "answered"

    def professor_reply(self, reply_content: str) -> None:
        """Keep compatibility for callers that still use the old method name."""
        self.process_professor_reply(reply_content)

    def can_be_deleted(self) -> bool:
        """Check whether the question can be deleted."""
        return self.status != "deleted"

    def grant_participation_score(self, score: float) -> None:
        """Grant participation score to the question."""
        if score < 0:
            raise ValueError("Participation score cannot be negative.")
        self.participation_score = score

    def get_question_score(self) -> float:
        """Return the participation score."""
        return self.participation_score

    @staticmethod
    def _clean_title(value: str) -> str:
        """Normalize and validate the question title."""
        cleaned_value = value.strip()
        if not cleaned_value:
            raise ValueError("Question title cannot be empty.")
        return cleaned_value

    @staticmethod
    def _clean_content(value: str) -> str:
        """Normalize and validate the question content."""
        cleaned_value = value.strip()
        if not cleaned_value:
            raise ValueError("Question content cannot be empty.")
        return cleaned_value

    @classmethod
    def _normalize_status(cls, status: str) -> str:
        """Normalize and validate question status values."""
        normalized_status = status.strip().lower()
        if normalized_status not in cls.VALID_STATUSES:
            raise ValueError(f"Unsupported question status: {status}")
        return normalized_status
