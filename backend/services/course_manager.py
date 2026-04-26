from __future__ import annotations

"""Course management service for the Classroom Q&A System."""

from models.course import Course
from models.enrollment import Enrollment


class CourseManager:
    """Handles course-related operations."""

    def __init__(self) -> None:
        self._courses: list[Course] = []

    def create_course(
        self,
        course_code: str,
        course_name: str,
        professor_id: str,
        is_active: bool = True,
    ) -> Course:
        """Create a new course."""
        normalized_code = course_code.strip().upper()
        if self.get_course_by_code(normalized_code) is not None:
            raise ValueError(f"Course {normalized_code} already exists.")

        course = Course(
            course_code=normalized_code,
            course_name=course_name.strip(),
            prof_id=professor_id.strip(),
            is_active=is_active,
        )
        self._courses.append(course)
        return course

    def get_course_by_code(self, course_code: str) -> Course | None:
        """Retrieve a course by its code."""
        normalized_code = course_code.strip().upper()
        return next(
            (course for course in self._courses if course.course_code == normalized_code),
            None,
        )

    def set_course_code(self, current_code: str, new_code: str) -> Course | None:
        """Update a course code."""
        course = self.get_course_by_code(current_code)
        if course is None:
            return None

        normalized_new_code = new_code.strip().upper()
        existing_course = self.get_course_by_code(normalized_new_code)
        if existing_course is not None and existing_course is not course:
            raise ValueError(f"Course {normalized_new_code} already exists.")

        course.set_course_code(normalized_new_code)
        return course

    def generate_enrollment_report(
        self,
        course_code: str,
        enrollments: list[Enrollment],
    ) -> dict[str, int | str | bool]:
        """Generate an enrollment report for a course."""
        course = self.get_course_by_code(course_code)
        if course is None:
            raise ValueError(f"Course {course_code} not found.")

        normalized_code = course.course_code
        enrollment_count = sum(
            1
            for enrollment in enrollments
            if enrollment.course_code.strip().upper() == normalized_code
        )
        return course.generate_enrollment_report(enrollment_count)

    def verify_enrollment_eligibility(
        self,
        course_code: str,
        student_id: str,
        enrollments: list[Enrollment],
    ) -> bool:
        """Verify whether a student may enroll in a course."""
        course = self.get_course_by_code(course_code)
        if course is None:
            return False

        already_enrolled = any(
            enrollment.student_id == student_id
            and enrollment.course_code.strip().upper() == course.course_code
            for enrollment in enrollments
        )
        return course.verify_enrollment_eligibility(already_enrolled)

    @property
    def courses(self) -> list[Course]:
        """Expose a copy of managed courses."""
        return list(self._courses)
