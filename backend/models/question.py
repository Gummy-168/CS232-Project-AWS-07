from __future__ import annotations

"""Question model for the Classroom Q&A System."""

from .board import InteractionBoard
from .user import User


class Question:
    """Represents a question posted on an interaction board."""

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
        self._status: str = status
        self._is_anonymous: bool = is_anonymous
        self._participation_score: float = participation_score
        self._board: InteractionBoard | None = board
        self._student: User | None = student
        pass

    @property
    def question_id(self) -> int:
        """Get the question identifier."""
        return self._question_id
        pass

    @question_id.setter
    def question_id(self, value: int) -> None:
        """Set the question identifier."""
        self._question_id = value
        pass

    @property
    def board_id(self) -> int:
        """Get the board identifier."""
        return self._board_id
        pass

    @board_id.setter
    def board_id(self, value: int) -> None:
        """Set the board identifier."""
        self._board_id = value
        pass

    @property
    def student_id(self) -> int:
        """Get the student identifier."""
        return self._student_id
        pass

    @student_id.setter
    def student_id(self, value: int) -> None:
        """Set the student identifier."""
        self._student_id = value
        pass

    @property
    def content(self) -> str:
        """Get the question content."""
        return self._content
        pass

    @content.setter
    def content(self, value: str) -> None:
        """Set the question content."""
        self._content = value
        pass

    @property
    def reply_content(self) -> str | None:
        """Get the reply content."""
        return self._reply_content
        pass

    @reply_content.setter
    def reply_content(self, value: str | None) -> None:
        """Set the reply content."""
        self._reply_content = value
        pass

    @property
    def status(self) -> str:
        """Get the question status."""
        return self._status
        pass

    @status.setter
    def status(self, value: str) -> None:
        """Set the question status."""
        self._status = value
        pass

    @property
    def is_anonymous(self) -> bool:
        """Get the anonymous flag."""
        return self._is_anonymous
        pass

    @is_anonymous.setter
    def is_anonymous(self, value: bool) -> None:
        """Set the anonymous flag."""
        self._is_anonymous = value
        pass

    @property
    def participation_score(self) -> float:
        """Get the participation score."""
        return self._participation_score
        pass

    @participation_score.setter
    def participation_score(self, value: float) -> None:
        """Set the participation score."""
        self._participation_score = value
        pass

    @property
    def board(self) -> InteractionBoard | None:
        """Get the linked board object."""
        return self._board
        pass

    @board.setter
    def board(self, value: InteractionBoard | None) -> None:
        """Set the linked board object."""
        self._board = value
        pass

    @property
    def student(self) -> User | None:
        """Get the linked student object."""
        return self._student
        pass

    @student.setter
    def student(self, value: User | None) -> None:
        """Set the linked student object."""
        self._student = value
        pass
