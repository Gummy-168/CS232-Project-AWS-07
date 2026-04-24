from __future__ import annotations

"""Course model for the Classroom Q&A System."""


class Course:
    """Represents a course in the system."""

    def __init__(
        self,
        course_code: str,
        course_name: str,
        prof_id: int,
        is_active: bool,
    ) -> None:
        """Initialize a course instance."""
        self._course_code: str = course_code
        self._course_name: str = course_name
        self._prof_id: int = prof_id
        self._is_active: bool = is_active
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
    def course_name(self) -> str:
        """Get the course name."""
        return self._course_name
        pass

    @course_name.setter
    def course_name(self, value: str) -> None:
        """Set the course name."""
        self._course_name = value
        pass

    @property
    def prof_id(self) -> int:
        """Get the professor identifier."""
        return self._prof_id
        pass

    @prof_id.setter
    def prof_id(self, value: int) -> None:
        """Set the professor identifier."""
        self._prof_id = value
        pass

    @property
    def is_active(self) -> bool:
        """Get the active status."""
        return self._is_active
        pass

    @is_active.setter
    def is_active(self, value: bool) -> None:
        """Set the active status."""
        self._is_active = value
        pass
