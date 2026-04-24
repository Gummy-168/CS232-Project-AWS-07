from __future__ import annotations

"""Question model for the Classroom Q&A System."""

from .board import InteractionBoard
from .user import User


class Question:
    """Represents a question posted on an interaction board."""

    VALID_STATUSES = {"pending", "answered", "hidden", "deleted"}

    def __init__(
        self,
        question_id: int,
        board_id: int,
        student_id: int,
        content: str,
        reply_content: str | None,
        status: str,
        is_anonymous: bool,
        participation_score: float,
        board: InteractionBoard | None = None,
        student: User | None = None,
    ) -> None:
        """Initialize a question instance."""
        self._question_id: int = question_id
        self._board_id: int = board_id
        self._student_id: int = student_id
        self._content: str = content
        self._reply_content: str | None = reply_content
        self._status: str = self._normalize_status(status)
        self._is_anonymous: bool = is_anonymous
        self._participation_score: float = participation_score
        self._board: InteractionBoard | None = board
        self._student: User | None = student

    @property
    def question_id(self) -> int:
        """Get the question identifier."""
        return self._question_id

    @question_id.setter
    def question_id(self, value: int) -> None:
        """Set the question identifier."""
        self._question_id = value

    @property
    def board_id(self) -> int:
        """Get the board identifier."""
        return self._board_id

    @board_id.setter
    def board_id(self, value: int) -> None:
        """Set the board identifier."""
        self._board_id = value

    @property
    def student_id(self) -> int:
        """Get the student identifier."""
        return self._student_id

    @student_id.setter
    def student_id(self, value: int) -> None:
        """Set the student identifier."""
        self._student_id = value

    @property
    def content(self) -> str:
        """Get the question content."""
        return self._content

    @content.setter
    def content(self, value: str) -> None:
        """Set the question content."""
        self._content = value

    @property
    def reply_content(self) -> str | None:
        """Get the reply content."""
        return self._reply_content

    @reply_content.setter
    def reply_content(self, value: str | None) -> None:
        """Set the reply content."""
        self._reply_content = value

    @property
    def status(self) -> str:
        """Get the question status."""
        return self._status

    @status.setter
    def status(self, value: str) -> None:
        """Set the question status."""
        self._status = self._normalize_status(value)

    @property
    def is_anonymous(self) -> bool:
        """Get the anonymous flag."""
        return self._is_anonymous

    @is_anonymous.setter
    def is_anonymous(self, value: bool) -> None:
        """Set the anonymous flag."""
        self._is_anonymous = value

    @property
    def participation_score(self) -> float:
        """Get the participation score."""
        return self._participation_score

    @participation_score.setter
    def participation_score(self, value: float) -> None:
        """Set the participation score."""
        self._participation_score = value

    @property
    def board(self) -> InteractionBoard | None:
        """Get the linked board object."""
        return self._board

    @board.setter
    def board(self, value: InteractionBoard | None) -> None:
        """Set the linked board object."""
        self._board = value

    @property
    def student(self) -> User | None:
        """Get the linked student object."""
        return self._student

    @student.setter
    def student(self, value: User | None) -> None:
        """Set the linked student object."""
        self._student = value

    def get_question_status(self) -> str:
        """Return the current question status."""
        return self.status

    def set_question_status(self, status: str) -> None:
        """Update the question status."""
        self.status = status

    def professor_reply(self, reply_content: str) -> None:
        """Store a professor reply and mark the question as answered."""
        cleaned_reply = reply_content.strip()
        if not cleaned_reply:
            raise ValueError("Reply content cannot be empty.")
        self.reply_content = cleaned_reply
        self.status = "answered"

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

    @classmethod
    def _normalize_status(cls, status: str) -> str:
        """Normalize and validate question status values."""
        normalized_status = status.strip().lower()
        if normalized_status not in cls.VALID_STATUSES:
            raise ValueError(f"Unsupported question status: {status}")
        return normalized_status
