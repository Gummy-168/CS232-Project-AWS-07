from __future__ import annotations

"""Enrollment service for the Classroom Q&A System."""

from fastapi import HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from models.enrollment import Enrollment
from models.user import User
from services.course_manager import CourseManager
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

        course, section, _join_code = CourseManager.consume_join_code(
            db=db,
            code=enrollment_data.join_code,
        )
        normalized_course_code = course.course_code.strip().upper()

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
            section_id=section.section_id if section else None,
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
