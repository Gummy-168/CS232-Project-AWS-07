from __future__ import annotations

"""Enrollment model for the Classroom Q&A System."""

from datetime import datetime

from .course import Course
from .user import User


class Enrollment:
    """Represents a student's enrollment in a course."""

    def __init__(
        self,
        enrollment_id: int,
        student_id: str,
        course_code: str,
        join_date: datetime,
        student: User | None = None,
        course: Course | None = None,
    ) -> None:
        """Initialize an enrollment instance."""
        self._enrollment_id: int = enrollment_id
        self._student_id: str = student_id.strip()
        self._course_code: str = course_code.strip().upper()
        self._join_date: datetime = join_date
        self._student: User | None = student
        self._course: Course | None = course

    @property
    def enrollment_id(self) -> int:
        """Get the enrollment identifier."""
        return self._enrollment_id

    @enrollment_id.setter
    def enrollment_id(self, value: int) -> None:
        """Set the enrollment identifier."""
        self._enrollment_id = value

    @property
    def student_id(self) -> str:
        """Get the student identifier."""
        return self._student_id

    @student_id.setter
    def student_id(self, value: str) -> None:
        """Set the student identifier."""
        self._student_id = value.strip()

    @property
    def course_code(self) -> str:
        """Get the course code."""
        return self._course_code

    @course_code.setter
    def course_code(self, value: str) -> None:
        """Set the course code."""
        self._course_code = value.strip().upper()

    @property
    def join_date(self) -> datetime:
        """Get the join date."""
        return self._join_date

    @join_date.setter
    def join_date(self, value: datetime) -> None:
        """Set the join date."""
        self._join_date = value

    @property
    def student(self) -> User | None:
        """Get the linked student object."""
        return self._student

    @student.setter
    def student(self, value: User | None) -> None:
        """Set the linked student object."""
        self._student = value

    @property
    def course(self) -> Course | None:
        """Get the linked course object."""
        return self._course

    @course.setter
    def course(self, value: Course | None) -> None:
        """Set the linked course object."""
        self._course = value

    def get_enrollment_details(self) -> dict[str, int | str | datetime]:
        """Return key enrollment details."""
        return {
            "enrollment_id": self.enrollment_id,
            "student_id": self.student_id,
            "course_code": self.course_code,
            "join_date": self.join_date,
        }
