from __future__ import annotations

"""Feed and search service for the Classroom Q&A System."""

from models.question import Question


class FeedAndSearchManager:
    """Manages question feeds and search operations."""

    def __init__(self, questions: list[Question] | None = None) -> None:
        self._questions: list[Question] = questions or []

    def add_question(self, question: Question) -> None:
        """Add a question to the search index."""
        self._questions.append(question)

    def list_course_questions(self, course_code: str) -> list[Question]:
        """List all questions in a course."""
        normalized_course_code = course_code.strip().upper()
        return [
            question
            for question in self._questions
            if question.board is not None
            and question.board.course_code.strip().upper() == normalized_course_code
        ]

    def validate_search_keyword(self, keyword: str) -> bool:
        """Check whether a search keyword is usable."""
        return len(keyword.strip()) > 0

    def search_questions(
        self,
        keyword: str,
        course_code: str | None = None,
    ) -> list[Question]:
        """Search questions by keyword."""
        normalized_keyword = keyword.strip().lower()
        questions = (
            self.list_course_questions(course_code)
            if course_code is not None
            else list(self._questions)
        )
        if not normalized_keyword:
            return questions

        return [
            question
            for question in questions
            if normalized_keyword in question.content.lower()
            or (
                question.reply_content is not None
                and normalized_keyword in question.reply_content.lower()
            )
        ]

    def filter_questions(
        self,
        status: str,
        course_code: str,
    ) -> list[Question]:
        """Filter questions by status for a course."""
        return self.filter_questions_by_status(status, course_code)

    def filter_questions_by_status(
        self,
        status: str,
        course_code: str,
    ) -> list[Question]:
        """Filter questions by status."""
        normalized_status = status.strip().lower()
        return [
            question
            for question in self.list_course_questions(course_code)
            if question.status == normalized_status
        ]

    def get_question_feed(
        self,
        sort_by: str = "newest",
        filter_status: str = "",
    ) -> list[Question]:
        """Prepare a simple feed of questions for display."""
        questions = list(self._questions)
        if filter_status.strip():
            normalized_status = filter_status.strip().lower()
            questions = [
                question for question in questions if question.status == normalized_status
            ]
        if sort_by == "oldest":
            return sorted(questions, key=lambda question: int(question.question_id))
        return sorted(questions, key=lambda question: int(question.question_id), reverse=True)
