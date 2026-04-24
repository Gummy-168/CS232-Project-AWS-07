from __future__ import annotations

"""Interaction board model for the Classroom Q&A System."""

from .course import Course


class InteractionBoard:
    """Represents an interaction board for a course."""

    VALID_STATUSES = {"draft", "open", "closed", "archived"}
    ALLOWED_TRANSITIONS = {
        "draft": {"open", "archived"},
        "open": {"closed", "archived"},
        "closed": {"open", "archived"},
        "archived": set(),
    }

    def __init__(
        self,
        board_id: int,
        course_code: str,
        status: str,
        course: Course | None = None,
    ) -> None:
        """Initialize an interaction board instance."""
        self._board_id: int = board_id
        self._course_code: str = course_code
        self._status: str = self._normalize_status(status)
        self._course: Course | None = course

    @property
    def board_id(self) -> int:
        """Get the board identifier."""
        return self._board_id

    @board_id.setter
    def board_id(self, value: int) -> None:
        """Set the board identifier."""
        self._board_id = value

    @property
    def course_code(self) -> str:
        """Get the course code."""
        return self._course_code

    @course_code.setter
    def course_code(self, value: str) -> None:
        """Set the course code."""
        self._course_code = value

    @property
    def status(self) -> str:
        """Get the board status."""
        return self._status

    @status.setter
    def status(self, value: str) -> None:
        """Set the board status."""
        self._status = self._normalize_status(value)

    @property
    def course(self) -> Course | None:
        """Get the linked course object."""
        return self._course

    @course.setter
    def course(self, value: Course | None) -> None:
        """Set the linked course object."""
        self._course = value

    def get_board_status(self) -> str:
        """Return the board status."""
        return self.status

    def set_board_status(self, new_status: str) -> None:
        """Update the board status if the transition is allowed."""
        normalized_status = self._normalize_status(new_status)
        if not self.validate_board_status_transition(normalized_status):
            raise ValueError(
                f"Cannot transition board status from {self.status} to {normalized_status}."
            )
        self._status = normalized_status

    def archive_board(self) -> None:
        """Archive the board."""
        if self.status != "archived":
            self.set_board_status("archived")

    def validate_board_status_transition(self, new_status: str) -> bool:
        """Validate whether the board can move to the given status."""
        normalized_status = self._normalize_status(new_status)
        return (
            normalized_status == self.status
            or normalized_status in self.ALLOWED_TRANSITIONS[self.status]
        )

    @classmethod
    def _normalize_status(cls, status: str) -> str:
        """Normalize and validate board status values."""
        normalized_status = status.strip().lower()
        if normalized_status not in cls.VALID_STATUSES:
            raise ValueError(f"Unsupported board status: {status}")
        return normalized_status
