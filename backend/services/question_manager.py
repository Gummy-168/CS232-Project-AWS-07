from __future__ import annotations

"""Question management service for the Classroom Q&A System."""

from fastapi import HTTPException, status
from sqlalchemy import text
from sqlalchemy.orm import Session

from models.board import InteractionBoard
from models.question import Question
from models.user import User


class QuestionManager:
    """Handles question-related operations."""

    def __init__(self) -> None:
        self._questions: list[Question] = []
        self._next_question_id = 1

    def create_question(
        self,
        board: InteractionBoard,
        student: User,
        title: str,
        content: str,
        is_anonymous: bool = False,
    ) -> Question:
        """Create and store a new question."""
        if student.role != "student":
            raise ValueError("Only students can submit questions.")
        if board.status != "active":
            raise ValueError("Questions can only be submitted to active boards.")

        cleaned_title = title.strip()
        if not cleaned_title:
            raise ValueError("Question title cannot be empty.")

        cleaned_content = content.strip()
        if not cleaned_content:
            raise ValueError("Question content cannot be empty.")

        question = Question(
            question_id=str(self._next_question_id),
            board_id=board.board_id,
            student_id=student.user_id,
            title=cleaned_title,
            content=cleaned_content,
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

    def submit_question(
        self,
        board: InteractionBoard,
        student: User,
        title: str,
        content: str,
        is_anonymous: bool = False,
    ) -> Question:
        """Keep compatibility with the older method name."""
        return self.create_question(board, student, title, content, is_anonymous)

    def get_question_by_id(self, question_id: str) -> Question | None:
        """Retrieve a question by identifier."""
        return next(
            (question for question in self._questions if question.question_id == question_id),
            None,
        )

    def set_question_status(self, question_id: str, status: str) -> Question | None:
        """Update a question status."""
        question = self.get_question_by_id(question_id)
        if question is None:
            return None

        question.set_question_status(status)
        return question

    def reply_question(self, question_id: str, reply_content: str) -> Question | None:
        """Reply to a question."""
        question = self.get_question_by_id(question_id)
        if question is None:
            return None

        question.process_professor_reply(reply_content)
        return question

    def professor_reply(self, question_id: str, reply_content: str) -> Question | None:
        """Keep compatibility with the older method name."""
        return self.reply_question(question_id, reply_content)

    def delete_question(self, question_id: str) -> bool:
        """Mark a question as deleted when allowed."""
        question = self.get_question_by_id(question_id)
        if question is None or not question.can_be_deleted():
            return False

        question.set_question_status("deleted")
        return True

    def grant_score(self, question_id: str, score: float) -> Question | None:
        """Grant a participation score to a question."""
        question = self.get_question_by_id(question_id)
        if question is None:
            return None

        question.grant_participation_score(score)
        return question

    def grant_participation_score(self, question_id: str, score: float) -> Question | None:
        """Keep compatibility with the older method name."""
        return self.grant_score(question_id, score)

    def get_question_score(self, question_id: str) -> float | None:
        """Return the participation score for a question."""
        question = self.get_question_by_id(question_id)
        return None if question is None else question.get_question_score()

    def get_questions_by_board(self, board_id: int) -> list[Question]:
        """List all questions belonging to a board."""
        normalized_board_id = str(board_id)
        return [
            question for question in self._questions if question.board_id == normalized_board_id
        ]

    @property
    def questions(self) -> list[Question]:
        """Expose a copy of managed questions."""
        return list(self._questions)

    @classmethod
    def get_professor_question_feed(
        cls,
        db: Session,
        professor_id: str,
        course_code: str | None = None,
        status_filter: str = "all",
        search: str | None = None,
    ) -> dict[str, object]:
        """Return a professor-scoped question feed grouped by course context."""
        courses = db.execute(
            text(
                """
                SELECT course_code, course_name
                FROM courses
                WHERE professor_id = :professor_id
                ORDER BY created_at DESC
                """
            ),
            {"professor_id": professor_id},
        ).mappings().all()

        normalized_course_code = (course_code or "").strip().upper()
        available_courses = {
            str(row["course_code"]).strip().upper(): row for row in courses
        }
        if normalized_course_code and normalized_course_code not in available_courses:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Course not found for this professor",
            )

        selected_course_code = normalized_course_code
        if not selected_course_code and courses:
            selected_course_code = str(courses[0]["course_code"]).strip().upper()

        question_where = [
            "c.professor_id = :professor_id",
            "q.status <> 'deleted'",
            "author.role = 'student'",
        ]
        params: dict[str, object] = {"professor_id": professor_id}
        if selected_course_code:
            question_where.append("c.course_code = :course_code")
            params["course_code"] = selected_course_code

        normalized_status_filter = status_filter.strip().lower()
        if normalized_status_filter in {"answered", "unanswered", "pending"}:
            question_where.append("q.status = :question_status")
            params["question_status"] = (
                "answered" if normalized_status_filter == "answered" else "pending"
            )

        normalized_search = (search or "").strip()
        supports_title = cls._supports_title(db=db)
        title_select = "q.title" if supports_title else "q.content AS title"
        title_search_condition = "q.title LIKE :search OR" if supports_title else ""

        if normalized_search:
            question_where.append(
                """
                (
                    {title_search_condition}
                    q.content LIKE :search
                    OR COALESCE(author.full_name, author.nickname, author.user_id) LIKE :search
                )
                """.format(title_search_condition=f"{title_search_condition} " if title_search_condition else "")
            )
            params["search"] = f"%{normalized_search}%"

        question_rows = db.execute(
            text(
                f"""
                SELECT
                    q.question_id,
                    {title_select},
                    q.content,
                    q.status,
                    q.created_at,
                    q.updated_at,
                    q.student_id,
                    b.board_id,
                    b.course_code,
                    c.course_name,
                    COALESCE(author.full_name, author.nickname, author.user_id) AS student_name
                FROM questions q
                JOIN interaction_boards b ON b.board_id = q.board_id
                JOIN courses c ON c.course_code = b.course_code
                JOIN users author ON author.user_id = q.student_id
                WHERE {' AND '.join(question_where)}
                ORDER BY q.created_at DESC
                """
            ),
            params,
        ).mappings().all()

        question_ids = [str(row["question_id"]) for row in question_rows]
        replies_map = cls._get_question_replies_map(db=db, question_ids=question_ids)
        student_questions = cls._serialize_course_feed_questions(
            rows=question_rows,
            replies_map=replies_map,
        )

        board_where = ["c.professor_id = :professor_id"]
        board_params: dict[str, object] = {"professor_id": professor_id}
        if selected_course_code:
            board_where.append("c.course_code = :course_code")
            board_params["course_code"] = selected_course_code

        board_rows = db.execute(
            text(
                f"""
                SELECT
                    b.board_id,
                    b.course_code,
                    c.course_name,
                    b.status,
                    b.created_at,
                    COUNT(q.question_id) AS total_questions,
                    SUM(CASE WHEN q.status = 'answered' THEN 1 ELSE 0 END) AS answered_questions,
                    SUM(CASE WHEN q.status = 'pending' THEN 1 ELSE 0 END) AS unanswered_questions
                FROM interaction_boards b
                JOIN courses c ON c.course_code = b.course_code
                LEFT JOIN questions q
                    ON q.board_id = b.board_id
                   AND q.status <> 'deleted'
                WHERE {' AND '.join(board_where)}
                GROUP BY b.board_id, b.course_code, c.course_name, b.status, b.created_at
                ORDER BY b.created_at DESC
                """
            ),
            board_params,
        ).mappings().all()

        selected_course = available_courses.get(selected_course_code)
        selected_title = (
            f"{selected_course_code}: {selected_course['course_name']}"
            if selected_course
            else "No active course"
        )

        return {
            "courses": [
                {
                    "course_code": str(row["course_code"]),
                    "course_name": str(row["course_name"]),
                }
                for row in courses
            ],
            "selected_course_code": selected_course_code,
            "course": {
                "code": selected_course_code,
                "title": selected_title,
            },
            "student_questions": student_questions,
            "board_sessions": [
                {
                    "board_id": str(row["board_id"]),
                    "course_code": str(row["course_code"]),
                    "course_name": str(row["course_name"]),
                    "status": str(row["status"]).upper(),
                    "created_at": cls._serialize_datetime(row["created_at"]),
                    "total_questions": int(row["total_questions"] or 0),
                    "answered_questions": int(row["answered_questions"] or 0),
                    "unanswered_questions": int(row["unanswered_questions"] or 0),
                }
                for row in board_rows
            ],
        }

    @classmethod
    def get_course_feed(
        cls,
        db: Session,
        professor_id: str,
        course_code: str,
        search: str | None = None,
    ) -> dict[str, object]:
        """Return all visible student questions for one course owned by a professor."""
        feed = cls.get_professor_question_feed(
            db=db,
            professor_id=professor_id,
            course_code=course_code,
            status_filter="all",
            search=search,
        )

        selected_course_code = str(feed["selected_course_code"] or "").strip().upper()
        if not selected_course_code:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Course not found for this professor",
            )

        course_title = str(feed["course"]["title"])
        _, _, course_name = course_title.partition(": ")
        return {
            "professor_id": professor_id,
            "course_code": selected_course_code,
            "course_name": course_name or selected_course_code,
            "questions": feed["student_questions"],
        }

    @classmethod
    def update_question_status(
        cls,
        db: Session,
        professor_id: str,
        question_id: str,
        status_value: str,
    ) -> dict[str, str]:
        """Allow a professor to update one question status in their own course."""
        normalized_status = status_value.strip().lower()
        if normalized_status not in {"answered", "pending", "unanswered"}:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="status must be one of: answered, pending, unanswered",
            )
        resolved_status = "pending" if normalized_status == "unanswered" else normalized_status

        question = db.execute(
            text(
                """
                SELECT q.question_id
                FROM questions q
                JOIN interaction_boards b ON b.board_id = q.board_id
                JOIN courses c ON c.course_code = b.course_code
                WHERE q.question_id = :question_id
                  AND q.status <> 'deleted'
                  AND c.professor_id = :professor_id
                LIMIT 1
                """
            ),
            {
                "question_id": question_id,
                "professor_id": professor_id,
            },
        ).mappings().first()
        if question is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Question not found for this professor",
            )

        db.execute(
            text(
                """
                UPDATE questions
                SET status = :status,
                    updated_at = CURRENT_TIMESTAMP
                WHERE question_id = :question_id
                """
            ),
            {
                "status": resolved_status,
                "question_id": question_id,
            },
        )
        db.commit()

        return {
            "question_id": question_id,
            "status": "ANSWERED" if resolved_status == "answered" else "UNANSWERED",
        }

    @classmethod
    def delete_question_for_professor(
        cls,
        db: Session,
        professor_id: str,
        question_id: str,
    ) -> dict[str, str]:
        """Soft-delete a question if it belongs to one of the professor's courses."""
        question = db.execute(
            text(
                """
                SELECT q.question_id
                FROM questions q
                JOIN interaction_boards b ON b.board_id = q.board_id
                JOIN courses c ON c.course_code = b.course_code
                WHERE q.question_id = :question_id
                  AND q.status <> 'deleted'
                  AND c.professor_id = :professor_id
                LIMIT 1
                """
            ),
            {
                "question_id": question_id,
                "professor_id": professor_id,
            },
        ).mappings().first()
        if question is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Question not found for this professor",
            )

        db.execute(
            text(
                """
                UPDATE questions
                SET status = 'deleted',
                    updated_at = CURRENT_TIMESTAMP
                WHERE question_id = :question_id
                """
            ),
            {"question_id": question_id},
        )
        db.commit()

        return {
            "message": "Question deleted successfully",
            "question_id": question_id,
        }

    @staticmethod
    def _supports_title(db: Session) -> bool:
        """Check whether the questions table has a title column."""
        row = db.execute(
            text(
                """
                SELECT 1
                FROM information_schema.columns
                WHERE table_schema = DATABASE()
                  AND table_name = 'questions'
                  AND column_name = 'title'
                LIMIT 1
                """
            )
        ).first()
        return row is not None

    @classmethod
    def _get_question_replies_map(
        cls,
        db: Session,
        question_ids: list[str],
    ) -> dict[str, list[dict[str, str | bool | None]]]:
        """Return replies grouped by question id."""
        if not question_ids:
            return {}

        params = {
            f"question_id_{index}": question_id
            for index, question_id in enumerate(question_ids)
        }
        placeholders = ", ".join(
            f":question_id_{index}" for index in range(len(question_ids))
        )
        rows = db.execute(
            text(
                f"""
                SELECT
                    r.reply_id,
                    r.question_id,
                    r.user_id,
                    u.nickname AS user_name,
                    u.role AS user_role,
                    r.content,
                    r.created_at,
                    r.updated_at
                FROM question_replies r
                JOIN users u ON u.user_id = r.user_id
                WHERE r.question_id IN ({placeholders})
                ORDER BY r.created_at ASC
                """
            ),
            params,
        ).mappings().all()

        replies_map: dict[str, list[dict[str, str | bool | None]]] = {}
        for row in rows:
            question_id = str(row["question_id"])
            replies_map.setdefault(question_id, []).append(
                {
                    "id": str(row["reply_id"]),
                    "question_id": question_id,
                    "author_id": str(row["user_id"]),
                    "author_name": str(row["user_name"] or row["user_id"]),
                    "is_professor": str(row["user_role"]).lower() == "professor",
                    "content": str(row["content"]),
                    "created_at": cls._serialize_datetime(row["created_at"]),
                    "updated_at": cls._serialize_datetime(row["updated_at"]),
                }
            )
        return replies_map

    @classmethod
    def _serialize_course_feed_questions(
        cls,
        rows: list[dict[str, object]],
        replies_map: dict[str, list[dict[str, str | bool | None]]],
    ) -> list[dict[str, object]]:
        """Map question rows into the API response structure."""
        status_map = {
            "pending": "UNANSWERED",
            "answered": "ANSWERED",
            "deleted": "DELETED",
        }
        return [
            {
                "id": str(row["question_id"]),
                "title": str(row["title"]),
                "content": str(row["content"]),
                "status": status_map.get(str(row["status"]).lower(), "UNANSWERED"),
                "student_id": str(row["student_id"]),
                "student_name": str(row["student_name"]),
                "course_code": str(row["course_code"]),
                "course_name": str(row["course_name"]),
                "board_id": str(row["board_id"]),
                "created_at": cls._serialize_datetime(row["created_at"]),
                "updated_at": cls._serialize_datetime(row["updated_at"]),
                "replies": replies_map.get(str(row["question_id"]), []),
            }
            for row in rows
        ]

    @staticmethod
    def _serialize_datetime(value: object) -> str | None:
        """Convert datetime-like values to ISO strings when present."""
        if value is None:
            return None
        return value.isoformat()
