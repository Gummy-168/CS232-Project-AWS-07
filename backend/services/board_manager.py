from __future__ import annotations

"""Interaction board service for the Classroom Q&A System."""

import re

from sqlalchemy import text
from sqlalchemy.orm import Session

from database import SessionLocal
from models.board import InteractionBoard
from models.course import Course
from models.question import Question


class BoardManager:
    """Handles interaction-board operations."""

    def __init__(self, db: Session | None = None) -> None:
        self._db: Session = db if db is not None else SessionLocal()

    def create_board(self, course: Course, status: str = "active") -> InteractionBoard:
        """Create an interaction board for a course."""
        next_board_id = self._get_next_board_id()
        db_board_id = self._format_db_board_id(next_board_id)
        board = InteractionBoard(
            board_id=next_board_id,
            course_code=course.course_code,
            status=status,
            course=course,
        )

        self._db.execute(
            text(
                """
                INSERT INTO interaction_boards (board_id, course_code, status)
                VALUES (:board_id, :course_code, :status)
                """
            ),
            {
                "board_id": db_board_id,
                "course_code": board.course_code,
                "status": board.status,
            },
        )
        self._db.commit()
        return board

    def get_board_by_id(self, board_id: int) -> InteractionBoard | None:
        """Retrieve a board by identifier."""
        row = self._find_board_row_by_numeric_id(board_id)
        return None if row is None else self._row_to_board(row)

    def get_board_status(self, board_id: int) -> str | None:
        """Get a board status by board id."""
        board = self.get_board_by_id(board_id)
        return None if board is None else board.get_board_status()

    def set_board_status(self, board_id: int, status: str) -> InteractionBoard | None:
        """Set a board status by board id."""
        row = self._find_board_row_by_numeric_id(board_id)
        if row is None:
            return None

        board = self._row_to_board(row)
        board.set_board_status(status)
        self._db.execute(
            text(
                """
                UPDATE interaction_boards
                SET status = :status
                WHERE board_id = :board_id
                """
            ),
            {"status": board.status, "board_id": row["board_id"]},
        )
        self._db.commit()
        return board

    def archive_board(self, board_id: int) -> InteractionBoard | None:
        """Archive a board."""
        row = self._find_board_row_by_numeric_id(board_id)
        if row is None:
            return None

        board = self._row_to_board(row)
        board.archive_board()
        self._db.execute(
            text(
                """
                UPDATE interaction_boards
                SET status = :status
                WHERE board_id = :board_id
                """
            ),
            {"status": board.status, "board_id": row["board_id"]},
        )
        self._db.commit()
        return board

    def validate_board_status_transition(self, board_id: int, status: str) -> bool:
        """Validate a board status change."""
        board = self.get_board_by_id(board_id)
        return False if board is None else board.validate_board_status_transition(status)

    def delete_question_from_board(self, board_id: int, question: Question) -> bool:
        """Delete a question from a board if allowed."""
        if question.board_id != board_id or not question.can_be_deleted():
            return False

        board_row = self._find_board_row_by_numeric_id(board_id)
        if board_row is None:
            return False

        row = (
            self._db.execute(
                text(
                    """
                    SELECT status
                    FROM questions
                    WHERE question_id = :question_id
                      AND board_id = :board_id
                    LIMIT 1
                    """
                ),
                {
                    "question_id": question.question_id,
                    "board_id": board_row["board_id"],
                },
            )
            .mappings()
            .first()
        )
        if row is None or row["status"] == "deleted":
            return False

        self._db.execute(
            text(
                """
                UPDATE questions
                SET status = 'deleted'
                WHERE question_id = :question_id
                  AND board_id = :board_id
                """
            ),
            {
                "question_id": question.question_id,
                "board_id": board_row["board_id"],
            },
        )
        self._db.commit()
        question.set_question_status("deleted")
        return True

    @property
    def boards(self) -> list[InteractionBoard]:
        """Return all boards from the database."""
        rows = (
            self._db.execute(
                text(
                    """
                    SELECT board_id, course_code, status
                    FROM interaction_boards
                    ORDER BY CAST(board_id AS UNSIGNED), board_id
                    """
                )
            )
            .mappings()
            .all()
        )
        return [self._row_to_board(row) for row in rows]

    def _get_next_board_id(self) -> int:
        """Generate the next numeric board id based on persisted records."""
        rows = (
            self._db.execute(
                text(
                    """
                    SELECT board_id
                    FROM interaction_boards
                    """
                )
            )
            .mappings()
            .all()
        )
        parsed_ids: list[int] = []
        for row in rows:
            parsed_id = self._extract_numeric_board_id(str(row["board_id"]))
            if parsed_id is not None:
                parsed_ids.append(parsed_id)
        return (max(parsed_ids) if parsed_ids else 0) + 1

    @staticmethod
    def _format_db_board_id(board_id: int) -> str:
        """Format the board id value as used in the database."""
        return f"board{board_id:03d}"

    def _find_board_row_by_numeric_id(self, board_id: int) -> dict[str, str] | None:
        """Find the raw board row by its numeric board id."""
        rows = (
            self._db.execute(
                text(
                    """
                    SELECT board_id, course_code, status
                    FROM interaction_boards
                    """
                )
            )
            .mappings()
            .all()
        )
        for row in rows:
            raw_board_id = str(row["board_id"])
            numeric_id = self._extract_numeric_board_id(raw_board_id)
            if raw_board_id == str(board_id) or numeric_id == board_id:
                return row
        return None

    @staticmethod
    def _extract_numeric_board_id(raw_board_id: str) -> int | None:
        """Extract numeric board id from values such as `1` or `board001`."""
        normalized_id = raw_board_id.strip()
        if normalized_id.isdigit():
            return int(normalized_id)

        match = re.search(r"(\d+)$", normalized_id)
        if match is None:
            return None
        return int(match.group(1))

    def _parse_board_id_or_raise(self, raw_board_id: str) -> int:
        """Parse a board id and fail loudly when the format is unsupported."""
        numeric_id = self._extract_numeric_board_id(raw_board_id)
        if numeric_id is None:
            raise ValueError(f"Unsupported board_id format in database: {raw_board_id}")
        return numeric_id

    def _row_to_board(self, row: dict[str, str]) -> InteractionBoard:
        """Map a database row to an InteractionBoard model."""
        return InteractionBoard(
            board_id=self._parse_board_id_or_raise(str(row["board_id"])),
            course_code=row["course_code"],
            status=row["status"],
        )
