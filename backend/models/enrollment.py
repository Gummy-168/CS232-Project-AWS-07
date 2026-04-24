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
        student_id: int,
        course_code: str,
        join_date: datetime,
        student: User | None = None,
        course: Course | None = None,
    ) -> None:
        """Initialize an enrollment instance."""
        self._enrollment_id: int = enrollment_id
        self._student_id: int = student_id
        self._course_code: str = course_code
        self._join_date: datetime = join_date
        self._student: User | None = student
        self._course: Course | None = course
        pass

    @property
    def enrollment_id(self) -> int:
        """Get the enrollment identifier."""
        return self._enrollment_id
        pass

    @enrollment_id.setter
    def enrollment_id(self, value: int) -> None:
        """Set the enrollment identifier."""
        self._enrollment_id = value
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
    def join_date(self) -> datetime:
        """Get the join date."""
        return self._join_date
        pass

    @join_date.setter
    def join_date(self, value: datetime) -> None:
        """Set the join date."""
        self._join_date = value
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
