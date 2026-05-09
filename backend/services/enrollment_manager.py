from __future__ import annotations

"""Enrollment service for the Classroom Q&A System."""

from fastapi import HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from models.course import Course
from models.enrollment import Enrollment
from models.user import User
from schemas.enrollment import EnrollmentCreate


class EnrollmentManager:
    """Handles enrollment-related operations."""

    @classmethod
    def enroll_student(
        cls,
        db: Session,
        enrollment_data: EnrollmentCreate,
        student: User,
    ) -> Enrollment:
        """Enroll a student in a course if the request is valid."""
        if student.role != "student":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only students can join courses",
            )

        normalized_course_code = enrollment_data.course_code.strip().upper()
        course: Course | None = (
            db.query(Course).filter(Course.course_code == normalized_course_code).first()
        )
        if course is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Course code not found",
            )

        existing_enrollment: Enrollment | None = (
            db.query(Enrollment)
            .filter(
                Enrollment.student_id == student.user_id,
                Enrollment.course_code == normalized_course_code,
            )
            .first()
        )
        if existing_enrollment is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Student already joined this course",
            )

        enrollment = Enrollment(
            student_id=student.user_id,
            course_code=normalized_course_code,
        )
        enrollment.normalize_state()

        db.add(enrollment)
        try:
            db.commit()
        except IntegrityError as exc:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Student already joined this course",
            ) from exc
        except Exception:
            db.rollback()
            raise
        db.refresh(enrollment)

        return enrollment

    @classmethod
    def get_enrollment_by_student_and_course(
        cls,
        db: Session,
        student_id: str,
        course_code: str,
    ) -> Enrollment | None:
        """Retrieve one enrollment by student and course."""
        normalized_code = course_code.strip().upper()
        normalized_student_id = student_id.strip()
        return (
            db.query(Enrollment)
            .filter(
                Enrollment.student_id == normalized_student_id,
                Enrollment.course_code == normalized_code,
            )
            .first()
        )
