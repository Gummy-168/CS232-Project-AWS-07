from __future__ import annotations

"""Question management service for the Classroom Q&A System."""

from models.board import InteractionBoard
from models.question import Question
from models.user import User


class QuestionManager:
    """Handles question-related operations."""

    def __init__(self) -> None:
        self._questions: list[Question] = []
        self._next_question_id = 1

    def submit_question(
        self,
        board: InteractionBoard,
        student: User,
        content: str,
        is_anonymous: bool = False,
    ) -> Question:
        """Create and store a new question."""
        if student.role != "student":
            raise ValueError("Only students can submit questions.")
        if board.status != "open":
            raise ValueError("Questions can only be submitted to open boards.")

        question = Question(
            question_id=self._next_question_id,
            board_id=board.board_id,
            student_id=student.user_id,
            content=content.strip(),
            reply_content=None,
            status="pending",
            is_anonymous=is_anonymous,
            participation_score=0.0,
            board=board,
            student=student,
        )
        self._questions.append(question)
        self._next_question_id += 1
        return question

    def get_question_by_id(self, question_id: int) -> Question | None:
        """Retrieve a question by identifier."""
        return next(
            (question for question in self._questions if question.question_id == question_id),
            None,
        )

    def set_question_status(self, question_id: int, status: str) -> Question | None:
        """Update a question status."""
        question = self.get_question_by_id(question_id)
        if question is None:
            return None

        question.set_question_status(status)
        return question

    def professor_reply(self, question_id: int, reply_content: str) -> Question | None:
        """Reply to a question."""
        question = self.get_question_by_id(question_id)
        if question is None:
            return None

        question.professor_reply(reply_content)
        return question

    def delete_question(self, question_id: int) -> bool:
        """Mark a question as deleted when allowed."""
        question = self.get_question_by_id(question_id)
        if question is None or not question.can_be_deleted():
            return False

        question.set_question_status("deleted")
        return True

    def grant_participation_score(self, question_id: int, score: float) -> Question | None:
        """Grant a participation score to a question."""
        question = self.get_question_by_id(question_id)
        if question is None:
            return None

        question.grant_participation_score(score)
        return question

    def get_question_score(self, question_id: int) -> float | None:
        """Return the participation score for a question."""
        question = self.get_question_by_id(question_id)
        return None if question is None else question.get_question_score()

    def get_questions_by_board(self, board_id: int) -> list[Question]:
        """List all questions belonging to a board."""
        return [question for question in self._questions if question.board_id == board_id]

    @property
    def questions(self) -> list[Question]:
        """Expose a copy of managed questions."""
        return list(self._questions)
