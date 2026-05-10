from __future__ import annotations

"""Course management service for the Classroom Q&A System."""

from datetime import datetime, timedelta
import secrets

from fastapi import HTTPException, status
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from models.course import Course
from models.course_join_code import CourseJoinCode
from models.course_section import CourseSection
from models.professor import Professor
from schemas.course import CourseCreate, CourseSectionCreate
from uuid import uuid4


class CourseManager:
    """Handles course-related operations."""

    JOIN_CODE_TTL_MINUTES = 15

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

    @classmethod
    def get_section_by_code(
        cls,
        db: Session,
        course_code: str,
        section_code: str,
    ) -> CourseSection | None:
        """Find one section by course and section code."""
        return (
            db.query(CourseSection)
            .filter(
                CourseSection.course_code == course_code.strip().upper(),
                CourseSection.section_code == section_code.strip().upper(),
            )
            .first()
        )

    @classmethod
    def _require_professor_course(
        cls,
        db: Session,
        professor: Professor,
        course_code: str,
    ) -> Course:
        """Return one course only when it belongs to the professor."""
        course = cls.get_course_by_code(db=db, course_code=course_code)
        if course is None or course.professor_id != professor.user_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Course not found for this professor",
            )
        return course

    @classmethod
    def _require_course_section(
        cls,
        db: Session,
        professor: Professor,
        course_code: str,
        section_code: str,
    ) -> tuple[Course, CourseSection]:
        """Return one professor-owned course and section pair."""
        course = cls._require_professor_course(
            db=db,
            professor=professor,
            course_code=course_code,
        )
        section = cls.get_section_by_code(
            db=db,
            course_code=course.course_code,
            section_code=section_code,
        )
        if section is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Section not found for this course",
            )
        return course, section

    @classmethod
    def get_section_usage_counts(
        cls,
        db: Session,
        section_id: str,
    ) -> dict[str, int]:
        """Return counts used to decide whether a section can be deleted."""
        counts_row = db.execute(
            text(
                """
                SELECT
                    (SELECT COUNT(*) FROM enrollments WHERE section_id = :section_id) AS enrollments,
                    (SELECT COUNT(*) FROM interaction_boards WHERE section_id = :section_id) AS boards,
                    (SELECT COUNT(*) FROM questions WHERE section_id = :section_id) AS questions,
                    (
                        SELECT COUNT(*)
                        FROM course_join_codes
                        WHERE section_id = :section_id
                          AND is_active = TRUE
                    ) AS active_join_codes
                """
            ),
            {"section_id": section_id},
        ).mappings().one()
        return {
            "enrollments": int(counts_row["enrollments"] or 0),
            "boards": int(counts_row["boards"] or 0),
            "questions": int(counts_row["questions"] or 0),
            "active_join_codes": int(counts_row["active_join_codes"] or 0),
        }

    @classmethod
    def can_hard_delete_section(
        cls,
        counts: dict[str, int],
    ) -> bool:
        """Return whether a section is still empty enough to hard delete."""
        return (
            counts["enrollments"] == 0
            and counts["boards"] == 0
            and counts["questions"] == 0
        )

    @classmethod
    def deactivate_join_codes_for_section(
        cls,
        db: Session,
        course_code: str,
        section_id: str,
    ) -> int:
        """Deactivate every active join code for one section."""
        result = db.execute(
            text(
                """
                UPDATE course_join_codes
                SET is_active = FALSE
                WHERE course_code = :course_code
                  AND section_id = :section_id
                  AND is_active = TRUE
                """
            ),
            {
                "course_code": course_code.strip().upper(),
                "section_id": section_id,
            },
        )
        return int(result.rowcount or 0)

    @classmethod
    def delete_or_archive_section(
        cls,
        db: Session,
        professor: Professor,
        course_code: str,
        section_code: str,
    ) -> dict[str, object]:
        """Hard-delete empty sections, otherwise archive them safely."""
        course, section = cls._require_course_section(
            db=db,
            professor=professor,
            course_code=course_code,
            section_code=section_code,
        )
        counts = cls.get_section_usage_counts(db=db, section_id=section.section_id)
        deactivated_join_codes = cls.deactivate_join_codes_for_section(
            db=db,
            course_code=course.course_code,
            section_id=section.section_id,
        )

        if cls.can_hard_delete_section(counts=counts):
            db.delete(section)
            db.commit()
            return {
                "action": "deleted",
                "course_code": course.course_code,
                "section_code": section.section_code,
                "reason": (
                    "Section deleted because it has no enrollments, boards, or questions. "
                    f"{deactivated_join_codes} active join code(s) were deactivated first."
                ),
                "counts": {
                    "enrollments": counts["enrollments"],
                    "boards": counts["boards"],
                    "questions": counts["questions"],
                    "active_join_codes": counts["active_join_codes"],
                },
            }

        if section.is_active:
            section.is_active = False
        db.commit()
        db.refresh(section)
        return {
            "action": "archived",
            "course_code": course.course_code,
            "section_code": section.section_code,
            "reason": (
                "Section archived because it already has classroom history. "
                "Enrollments, boards, questions, replies, and analytics-related records were preserved."
            ),
            "counts": {
                "enrollments": counts["enrollments"],
                "boards": counts["boards"],
                "questions": counts["questions"],
                "active_join_codes": counts["active_join_codes"],
            },
        }

    @classmethod
    def get_course_usage_counts(
        cls,
        db: Session,
        course_code: str,
    ) -> dict[str, int]:
        """Return counts used to decide whether a course can be deleted."""
        normalized_course_code = course_code.strip().upper()
        counts_row = db.execute(
            text(
                """
                SELECT
                    (SELECT COUNT(*) FROM course_sections WHERE course_code = :course_code) AS sections,
                    (SELECT COUNT(*) FROM enrollments WHERE course_code = :course_code) AS enrollments,
                    (SELECT COUNT(*) FROM interaction_boards WHERE course_code = :course_code) AS boards,
                    (SELECT COUNT(*) FROM questions WHERE course_code = :course_code) AS questions,
                    (
                        SELECT COUNT(*)
                        FROM course_join_codes
                        WHERE course_code = :course_code
                          AND is_active = TRUE
                    ) AS active_join_codes
                """
            ),
            {"course_code": normalized_course_code},
        ).mappings().one()
        return {
            "sections": int(counts_row["sections"] or 0),
            "enrollments": int(counts_row["enrollments"] or 0),
            "boards": int(counts_row["boards"] or 0),
            "questions": int(counts_row["questions"] or 0),
            "active_join_codes": int(counts_row["active_join_codes"] or 0),
        }

    @classmethod
    def can_hard_delete_course(
        cls,
        counts: dict[str, int],
    ) -> bool:
        """Return whether a course is still empty enough to hard delete."""
        return (
            counts["enrollments"] == 0
            and counts["boards"] == 0
            and counts["questions"] == 0
        )

    @classmethod
    def deactivate_join_codes_for_course(
        cls,
        db: Session,
        course_code: str,
    ) -> int:
        """Deactivate every active join code for one course."""
        result = db.execute(
            text(
                """
                UPDATE course_join_codes
                SET is_active = FALSE
                WHERE course_code = :course_code
                  AND is_active = TRUE
                """
            ),
            {"course_code": course_code.strip().upper()},
        )
        return int(result.rowcount or 0)

    @classmethod
    def delete_or_archive_course(
        cls,
        db: Session,
        professor: Professor,
        course_code: str,
    ) -> dict[str, object]:
        """Hard-delete empty courses, otherwise archive them safely."""
        course = cls._require_professor_course(
            db=db,
            professor=professor,
            course_code=course_code,
        )
        counts = cls.get_course_usage_counts(db=db, course_code=course.course_code)
        deactivated_join_codes = cls.deactivate_join_codes_for_course(
            db=db,
            course_code=course.course_code,
        )

        if cls.can_hard_delete_course(counts=counts):
            db.delete(course)
            db.commit()
            return {
                "action": "deleted",
                "course_code": course.course_code,
                "reason": (
                    "Course deleted because it has no enrollments, boards, or questions. "
                    f"{deactivated_join_codes} active join code(s) were deactivated first."
                ),
                "counts": {
                    "sections": counts["sections"],
                    "enrollments": counts["enrollments"],
                    "boards": counts["boards"],
                    "questions": counts["questions"],
                    "active_join_codes": counts["active_join_codes"],
                },
            }

        if course.is_active:
            course.is_active = False
        (
            db.query(CourseSection)
            .filter(CourseSection.course_code == course.course_code)
            .update({CourseSection.is_active: False}, synchronize_session=False)
        )
        db.commit()
        db.refresh(course)
        return {
            "action": "archived",
            "course_code": course.course_code,
            "reason": (
                "Course archived because it already has classroom history. "
                "Sections were marked inactive and join codes were deactivated while historical data was preserved."
            ),
            "counts": {
                "sections": counts["sections"],
                "enrollments": counts["enrollments"],
                "boards": counts["boards"],
                "questions": counts["questions"],
                "active_join_codes": counts["active_join_codes"],
            },
        }

    @classmethod
    def _generate_unique_code(cls, db: Session) -> str:
        """Generate a short unique join code."""
        while True:
            candidate = f"ASK-{secrets.token_hex(3).upper()}"
            existing = (
                db.query(CourseJoinCode)
                .filter(CourseJoinCode.code == candidate)
                .first()
            )
            if existing is None:
                return candidate

    @classmethod
    def create_join_code(
        cls,
        db: Session,
        professor: Professor,
        course_code: str,
        section_code: str | None = None,
    ) -> CourseJoinCode:
        """Create a fresh 15-minute join code for one course or section."""
        if professor.role != "professor":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only professors can generate join codes",
            )

        course = cls.get_course_by_code(db=db, course_code=course_code)
        normalized_course_code = course_code.strip().upper()
        if course is None or course.professor_id != professor.user_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Course not found for this professor",
            )

        section: CourseSection | None = None
        if not section_code:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Please select a section before generating a join code",
            )

        section = cls.get_section_by_code(
            db=db,
            course_code=normalized_course_code,
            section_code=section_code,
        )
        if section is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Section not found for this course",
            )
        if not course.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot generate a join code for an inactive course",
            )
        if not section.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot generate a join code for an inactive section",
            )

        target_section_id = section.section_id if section else None

        active_codes_query = db.query(CourseJoinCode).filter(
            CourseJoinCode.course_code == normalized_course_code,
            CourseJoinCode.professor_id == professor.user_id,
            CourseJoinCode.is_active.is_(True),
        )
        if target_section_id is None:
            active_codes_query = active_codes_query.filter(
                CourseJoinCode.section_id.is_(None)
            )
        else:
            active_codes_query = active_codes_query.filter(
                CourseJoinCode.section_id == target_section_id
            )

        for existing_code in active_codes_query.all():
            existing_code.is_active = False

        join_code = CourseJoinCode(
            join_code_id=f"jcode-{uuid4().hex[:12]}",
            code=cls._generate_unique_code(db=db),
            course_code=normalized_course_code,
            section_id=target_section_id,
            professor_id=professor.user_id,
            expires_at=datetime.utcnow() + timedelta(minutes=cls.JOIN_CODE_TTL_MINUTES),
            is_active=True,
        )
        join_code.normalize_state()
        db.add(join_code)
        db.commit()
        db.refresh(join_code)
        return join_code

    @classmethod
    def get_active_join_code(
        cls,
        db: Session,
        professor: Professor,
        course_code: str,
        section_code: str | None = None,
    ) -> CourseJoinCode | None:
        """Return one active, non-expired join code for one course or section."""
        course = cls.get_course_by_code(db=db, course_code=course_code)
        normalized_course_code = course_code.strip().upper()
        if course is None or course.professor_id != professor.user_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Course not found for this professor",
            )

        target_section_id: str | None = None
        if section_code:
            section = cls.get_section_by_code(
                db=db,
                course_code=normalized_course_code,
                section_code=section_code,
            )
            if section is None:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Section not found for this course",
                )
            target_section_id = section.section_id

        query = db.query(CourseJoinCode).filter(
            CourseJoinCode.course_code == normalized_course_code,
            CourseJoinCode.professor_id == professor.user_id,
            CourseJoinCode.is_active.is_(True),
            CourseJoinCode.expires_at > datetime.utcnow(),
        )
        if target_section_id is None:
            query = query.filter(CourseJoinCode.section_id.is_(None))
        else:
            query = query.filter(CourseJoinCode.section_id == target_section_id)

        return query.order_by(CourseJoinCode.created_at.desc()).first()

    @classmethod
    def consume_join_code(
        cls,
        db: Session,
        code: str,
    ) -> tuple[Course, CourseSection | None, CourseJoinCode]:
        """Resolve a student join code into a target course and optional section."""
        normalized_code = code.strip().upper()
        join_code = (
            db.query(CourseJoinCode)
            .filter(CourseJoinCode.code == normalized_code)
            .first()
        )
        if join_code is None or not join_code.is_active:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Join code not found",
            )

        if join_code.expires_at <= datetime.utcnow():
            join_code.is_active = False
            db.commit()
            raise HTTPException(
                status_code=status.HTTP_410_GONE,
                detail="Join code expired, please ask your professor to generate a new one",
            )

        course = cls.get_course_by_code(db=db, course_code=join_code.course_code)
        if course is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Course not found for this join code",
            )
        if not course.is_active:
            join_code.is_active = False
            db.commit()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This join code belongs to an inactive course",
            )

        section = None
        if not join_code.section_id:
            join_code.is_active = False
            db.commit()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This join code is not linked to a section",
            )

        if join_code.section_id:
            section = (
                db.query(CourseSection)
                .filter(CourseSection.section_id == join_code.section_id)
                .first()
            )
            if section is None:
                join_code.is_active = False
                db.commit()
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Section not found for this join code",
                )
            if not section.is_active:
                join_code.is_active = False
                db.commit()
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="This join code belongs to an inactive section",
                )

        return course, section, join_code
