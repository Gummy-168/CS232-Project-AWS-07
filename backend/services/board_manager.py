from __future__ import annotations

"""Interaction board service for the Classroom Q&A System."""

from models.board import InteractionBoard
from models.course import Course
from models.question import Question


class BoardManager:
    """Handles interaction-board operations."""

    def __init__(self) -> None:
        self._boards: list[InteractionBoard] = []
        self._next_board_id = 1

    def create_board(self, course: Course, status: str = "active") -> InteractionBoard:
        """Create an interaction board for a course."""
        board = InteractionBoard(
            board_id=self._next_board_id,
            course_code=course.course_code,
            status=status,
            course=course,
        )
        self._boards.append(board)
        self._next_board_id += 1
        return board

    def get_board_by_id(self, board_id: int) -> InteractionBoard | None:
        """Retrieve a board by identifier."""
        return next((board for board in self._boards if board.board_id == board_id), None)

    def get_board_status(self, board_id: int) -> str | None:
        """Get a board status by board id."""
        board = self.get_board_by_id(board_id)
        return None if board is None else board.get_board_status()

    def set_board_status(self, board_id: int, status: str) -> InteractionBoard | None:
        """Set a board status by board id."""
        board = self.get_board_by_id(board_id)
        if board is None:
            return None

        board.set_board_status(status)
        return board

    def archive_board(self, board_id: int) -> InteractionBoard | None:
        """Archive a board."""
        board = self.get_board_by_id(board_id)
        if board is None:
            return None

        board.archive_board()
        return board

    def validate_board_status_transition(self, board_id: int, status: str) -> bool:
        """Validate a board status change."""
        board = self.get_board_by_id(board_id)
        return False if board is None else board.validate_board_status_transition(status)

    def delete_question_from_board(self, board_id: int, question: Question) -> bool:
        """Delete a question from a board if allowed."""
        if question.board_id != board_id or not question.can_be_deleted():
            return False

        question.set_question_status("deleted")
        return True

    @property
    def boards(self) -> list[InteractionBoard]:
        """Expose a copy of managed boards."""
        return list(self._boards)
