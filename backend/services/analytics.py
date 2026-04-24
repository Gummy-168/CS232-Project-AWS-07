from __future__ import annotations

"""Analytics service for the Classroom Q&A System."""

from models.question import Question


class AnalyticsManager:
    """Provides participation and activity analytics."""

    def calculate_participation_score(self, question: Question) -> float:
        """Calculate a participation score for a question."""
        pass

    def get_course_question_summary(self, course_code: str) -> dict[str, int]:
        """Return question summary metrics for a course."""
        pass

    def get_student_activity_summary(self, student_id: int) -> dict[str, int]:
        """Return activity summary metrics for a student."""
        pass
