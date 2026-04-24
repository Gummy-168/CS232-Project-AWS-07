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
        self._course_code: str = self._normalize_course_code(course_code)
        self._course_name: str = course_name
        self._prof_id: int = prof_id
        self._is_active: bool = is_active

    @property
    def course_code(self) -> str:
        """Get the course code."""
        return self._course_code

    @course_code.setter
    def course_code(self, value: str) -> None:
        """Set the course code."""
        self._course_code = self._normalize_course_code(value)

    @property
    def course_name(self) -> str:
        """Get the course name."""
        return self._course_name

    @course_name.setter
    def course_name(self, value: str) -> None:
        """Set the course name."""
        self._course_name = value

    @property
    def prof_id(self) -> int:
        """Get the professor identifier."""
        return self._prof_id

    @prof_id.setter
    def prof_id(self, value: int) -> None:
        """Set the professor identifier."""
        self._prof_id = value

    @property
    def professor_id(self) -> int:
        """Get the professor identifier using the naming in CODEX.md."""
        return self._prof_id

    @professor_id.setter
    def professor_id(self, value: int) -> None:
        """Set the professor identifier using the naming in CODEX.md."""
        self._prof_id = value

    @property
    def is_active(self) -> bool:
        """Get the active status."""
        return self._is_active

    @is_active.setter
    def is_active(self, value: bool) -> None:
        """Set the active status."""
        self._is_active = value

    def set_course_code(self, value: str) -> None:
        """Update the course code after validating its format."""
        self.course_code = value

    def generate_enrollment_report(
        self,
        enrollment_count: int,
    ) -> dict[str, int | str | bool]:
        """Generate a lightweight enrollment report for the course."""
        return {
            "course_code": self.course_code,
            "course_name": self.course_name,
            "professor_id": self.professor_id,
            "is_active": self.is_active,
            "enrollment_count": enrollment_count,
        }

    def verify_enrollment_eligibility(self, already_enrolled: bool) -> bool:
        """Check whether a student may enroll in the course."""
        return self.is_active and not already_enrolled

    @staticmethod
    def _normalize_course_code(course_code: str) -> str:
        """Normalize the course code for consistent matching."""
        normalized_code = course_code.strip().upper()
        if not normalized_code:
            raise ValueError("Course code cannot be empty.")
        return normalized_code
