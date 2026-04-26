from __future__ import annotations

"""Analytics service for the Classroom Q&A System."""

from models.enrollment import Enrollment
from models.question import Question


class AnalyticsManager:
    """Provides participation and activity analytics."""

    def __init__(
        self,
        questions: list[Question] | None = None,
        enrollments: list[Enrollment] | None = None,
    ) -> None:
        self._questions: list[Question] = questions or []
        self._enrollments: list[Enrollment] = enrollments or []

    def add_question(self, question: Question) -> None:
        """Add a question for analytics aggregation."""
        self._questions.append(question)

    def add_enrollment(self, enrollment: Enrollment) -> None:
        """Add an enrollment for analytics aggregation."""
        self._enrollments.append(enrollment)

    def calculate_participation_score(self, question: Question) -> float:
        """Calculate a participation score for a question."""
        score = 1.0
        if question.reply_content:
            score += 1.0
        if not question.is_anonymous:
            score += 0.5
        if question.status == "answered":
            score += 0.5
        question.grant_participation_score(score)
        return question.participation_score

    def get_course_question_summary(self, course_code: str) -> dict[str, int]:
        """Return question summary metrics for a course."""
        normalized_course_code = course_code.strip().upper()
        course_questions = [
            question
            for question in self._questions
            if question.board is not None
            and question.board.course_code.strip().upper() == normalized_course_code
        ]
        return {
            "total_questions": len(course_questions),
            "answered_questions": sum(
                1 for question in course_questions if question.status == "answered"
            ),
            "pending_questions": sum(
                1 for question in course_questions if question.status == "pending"
            ),
            "enrolled_students": sum(
                1
                for enrollment in self._enrollments
                if enrollment.course_code.strip().upper() == normalized_course_code
            ),
        }

    def generate_class_overview(self, course_code: str) -> dict[str, int]:
        """Return the main analytics summary for a course."""
        return self.get_course_question_summary(course_code)

    def generate_student_insight(self, student_id: str) -> dict[str, int]:
        """Return the main analytics summary for a student."""
        return self.get_student_activity_summary(student_id)

    def get_student_activity_summary(self, student_id: str) -> dict[str, int]:
        """Return activity summary metrics for a student."""
        student_questions = [
            question for question in self._questions if question.student_id == student_id
        ]
        total_score = int(sum(question.participation_score for question in student_questions))
        return {
            "submitted_questions": len(student_questions),
            "answered_questions": sum(
                1 for question in student_questions if question.status == "answered"
            ),
            "total_participation_score": total_score,
        }

    def check_data_sufficiency(self, course_code: str) -> bool:
        """Check whether there is enough course data to show analytics."""
        summary = self.get_course_question_summary(course_code)
        return summary["total_questions"] > 0 and summary["enrolled_students"] > 0
