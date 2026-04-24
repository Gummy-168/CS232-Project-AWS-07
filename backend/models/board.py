from __future__ import annotations

"""Interaction board model for the Classroom Q&A System."""

from .course import Course


class InteractionBoard:
    """Represents an interaction board for a course."""

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
        self._status: str = status
        self._course: Course | None = course
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
    def course_code(self) -> str:
        """Get the course code."""
        return self._course_code
        pass

    @course_code.setter
    def course_code(self, value: str) -> None:
        """Set the course code."""
        self._course_code = value
        pass

    @property
    def status(self) -> str:
        """Get the board status."""
        return self._status
        pass

    @status.setter
    def status(self, value: str) -> None:
        """Set the board status."""
        self._status = value
        pass

    @property
    def course(self) -> Course | None:
        """Get the linked course object."""
        return self._course
        pass

    @course.setter
    def course(self, value: Course | None) -> None:
        """Set the linked course object."""
        self._course = value
        pass
