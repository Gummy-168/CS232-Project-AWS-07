from __future__ import annotations

"""Course management service for the Classroom Q&A System."""

from fastapi import HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from models.course import Course
from models.course_section import CourseSection
from models.professor import Professor
from schemas.course import CourseCreate, CourseSectionCreate
from uuid import uuid4


class CourseManager:
    """Handles course-related operations."""

    @classmethod
    def create_course(
        cls,
        db: Session,
        course_data: CourseCreate,
        professor: Professor,
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

    @classmethod
    def create_section(
        cls,
        db: Session,
        professor: Professor,
        course_code: str,
        section_data: CourseSectionCreate,
    ) -> CourseSection:
        """Create a new section under one professor-owned course."""
        if professor.role != "professor":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only professors can create sections",
            )

        course = cls.get_course_by_code(db=db, course_code=course_code)
        normalized_course_code = course_code.strip().upper()
        if course is None or course.professor_id != professor.user_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Course not found for this professor",
            )

        normalized_section_code = section_data.section_code.strip().upper()
        existing_section = (
            db.query(CourseSection)
            .filter(
                CourseSection.course_code == normalized_course_code,
                CourseSection.section_code == normalized_section_code,
            )
            .first()
        )
        if existing_section is not None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Section code already exists for this course",
            )

        section = CourseSection(
            section_id=f"sec-{uuid4().hex[:12]}",
            course_code=normalized_course_code,
            section_code=normalized_section_code,
            meeting_days=",".join(section_data.meeting_days),
            start_time=section_data.start_time,
            end_time=section_data.end_time,
            is_active=section_data.is_active,
        )
        section.normalize_state()

        db.add(section)
        try:
            db.commit()
        except IntegrityError as exc:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Section code already exists for this course",
            ) from exc
        db.refresh(section)
        return section

    @classmethod
    def list_sections(
        cls,
        db: Session,
        professor: Professor,
        course_code: str,
    ) -> list[CourseSection]:
        """List sections under one professor-owned course."""
        course = cls.get_course_by_code(db=db, course_code=course_code)
        normalized_course_code = course_code.strip().upper()
        if course is None or course.professor_id != professor.user_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Course not found for this professor",
            )

        return (
            db.query(CourseSection)
            .filter(CourseSection.course_code == normalized_course_code)
            .order_by(CourseSection.section_code.asc())
            .all()
        )
