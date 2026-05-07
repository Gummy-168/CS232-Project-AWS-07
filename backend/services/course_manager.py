from __future__ import annotations

"""Course management service for the Classroom Q&A System."""

from fastapi import HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from models.course import Course
from models.user import User
from schemas.course import CourseCreate


class CourseManager:
    """Handles course-related operations."""

    @classmethod
    def create_course(
        cls,
        db: Session,
        course_data: CourseCreate,
        professor: User,
    ) -> Course:
        """Create a new course owned by the authenticated professor."""
        if professor.role != "professor":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only professors can create courses",
            )

        normalized_code = course_data.course_code.strip().upper()
        existing_course: Course | None = (
            db.query(Course).filter(Course.course_code == normalized_code).first()
        )
        if existing_course is not None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Course code already exists",
            )

        course = Course(
            course_code=normalized_code,
            course_name=course_data.course_name.strip(),
            professor_id=professor.user_id,
            is_active=course_data.is_active,
        )
        course.normalize_state()

        db.add(course)
        try:
            db.commit()
        except IntegrityError as exc:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Course code already exists",
            ) from exc
        db.refresh(course)

        return course

    @classmethod
    def get_course_by_code(
        cls,
        db: Session,
        course_code: str,
    ) -> Course | None:
        """Retrieve a course by code."""
        normalized_code = course_code.strip().upper()
        return db.query(Course).filter(Course.course_code == normalized_code).first()
