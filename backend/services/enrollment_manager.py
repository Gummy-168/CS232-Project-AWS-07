from __future__ import annotations

"""Enrollment service for the Classroom Q&A System."""

from datetime import datetime

from models.course import Course
from models.enrollment import Enrollment
from models.user import User


class EnrollmentManager:
    """Handles enrollment-related operations."""

    def __init__(self) -> None:
        self._enrollments: list[Enrollment] = []
        self._next_enrollment_id = 1

    def enroll_student(
        self,
        student: User,
        course: Course,
    ) -> Enrollment:
        """Link a student with a course."""
        if student.role != "student":
            raise ValueError("Only students can be enrolled in courses.")
        if not course.verify_enrollment_eligibility(
            already_enrolled=self._has_enrollment(student.user_id, course.course_code)
        ):
            raise ValueError("Student is not eligible to enroll in this course.")

        enrollment = Enrollment(
            enrollment_id=self._next_enrollment_id,
            student_id=student.user_id,
            course_code=course.course_code,
            join_date=datetime.utcnow(),
            student=student,
            course=course,
        )
        self._enrollments.append(enrollment)
        self._next_enrollment_id += 1
        return enrollment

    def get_enrollment_by_id(self, enrollment_id: int) -> Enrollment | None:
        """Retrieve enrollment details by identifier."""
        return next(
            (
                enrollment
                for enrollment in self._enrollments
                if enrollment.enrollment_id == enrollment_id
            ),
            None,
        )

    def get_enrollments_by_student(self, student_id: int) -> list[Enrollment]:
        """Retrieve enrollments for a student."""
        return [
            enrollment
            for enrollment in self._enrollments
            if enrollment.student_id == student_id
        ]

    def get_enrollments_by_course(self, course_code: str) -> list[Enrollment]:
        """Retrieve enrollments for a course."""
        normalized_code = course_code.strip().upper()
        return [
            enrollment
            for enrollment in self._enrollments
            if enrollment.course_code.strip().upper() == normalized_code
        ]

    @property
    def enrollments(self) -> list[Enrollment]:
        """Expose a copy of managed enrollments."""
        return list(self._enrollments)

    def _has_enrollment(self, student_id: int, course_code: str) -> bool:
        """Check whether a student is already enrolled in a course."""
        normalized_code = course_code.strip().upper()
        return any(
            enrollment.student_id == student_id
            and enrollment.course_code.strip().upper() == normalized_code
            for enrollment in self._enrollments
        )
