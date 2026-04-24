from __future__ import annotations

"""Feed and search service for the Classroom Q&A System."""

from models.question import Question


class FeedAndSearchManager:
    """Manages question feeds and search operations."""

    def list_course_questions(self, course_code: str) -> list[Question]:
        """List all questions in a course."""
        pass

    def search_questions(
        self,
        keyword: str,
        course_code: str | None = None,
    ) -> list[Question]:
        """Search questions by keyword."""
        pass

    def filter_questions_by_status(
        self,
        status: str,
        course_code: str,
    ) -> list[Question]:
        """Filter questions by status."""
        pass
