from __future__ import annotations

"""Safely backfill legacy NULL section_id values before enforcing NOT NULL."""

import argparse
import sys
from pathlib import Path
from typing import Any

from sqlalchemy import text
from sqlalchemy.engine import Connection

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from database import engine  # noqa: E402


SECTION_ID_SQL_TYPE = "VARCHAR(50)"

FINAL_NOT_NULL_SQL = [
    f"ALTER TABLE enrollments MODIFY section_id {SECTION_ID_SQL_TYPE} NOT NULL;",
    f"ALTER TABLE course_join_codes MODIFY section_id {SECTION_ID_SQL_TYPE} NOT NULL;",
    f"ALTER TABLE interaction_boards MODIFY section_id {SECTION_ID_SQL_TYPE} NOT NULL;",
    f"ALTER TABLE questions MODIFY section_id {SECTION_ID_SQL_TYPE} NOT NULL;",
]


def fetch_rows(conn: Connection, sql: str, params: dict[str, Any] | None = None) -> list[dict[str, Any]]:
    """Return query rows as plain dictionaries."""
    result = conn.execute(text(sql), params or {})
    return [dict(row) for row in result.mappings()]


def fetch_scalar(conn: Connection, sql: str, params: dict[str, Any] | None = None) -> Any:
    """Return a scalar query result."""
    return conn.execute(text(sql), params or {}).scalar()


def apply_section_updates(
    conn: Connection,
    table_name: str,
    id_column: str,
    candidates: list[dict[str, Any]],
    apply_changes: bool,
) -> int:
    """Apply section_id updates for one table."""
    if not candidates:
        return 0

    if not apply_changes:
        return len(candidates)

    conn.execute(
        text(
            f"""
            UPDATE {table_name}
            SET section_id = :section_id
            WHERE {id_column} = :record_id
              AND section_id IS NULL
            """
        ),
        [
            {
                "record_id": row[id_column],
                "section_id": row["section_id"],
            }
            for row in candidates
        ],
    )
    return len(candidates)


def apply_join_code_deactivation(
    conn: Connection,
    candidates: list[dict[str, Any]],
    apply_changes: bool,
) -> int:
    """Deactivate active join codes that still have NULL section_id."""
    if not candidates:
        return 0

    if not apply_changes:
        return len(candidates)

    conn.execute(
        text(
            """
            UPDATE course_join_codes
            SET is_active = FALSE
            WHERE join_code_id = :join_code_id
              AND section_id IS NULL
              AND is_active = TRUE
            """
        ),
        [{"join_code_id": row["join_code_id"]} for row in candidates],
    )
    return len(candidates)


def print_rows(title: str, rows: list[dict[str, Any]]) -> None:
    """Print a compact record list."""
    print(f"\n{title}: {len(rows)}")
    for row in rows:
        parts = [f"{key}={value}" for key, value in row.items()]
        print(f"  - {' | '.join(parts)}")


def print_count_block(title: str, counts: dict[str, int]) -> None:
    """Print named counts."""
    print(f"\n{title}")
    for key, value in counts.items():
        print(f"  - {key}: {value}")


def get_null_counts(conn: Connection) -> dict[str, int]:
    """Return the main validation counts."""
    return {
        "enrollments.section_id IS NULL": int(
            fetch_scalar(conn, "SELECT COUNT(*) FROM enrollments WHERE section_id IS NULL") or 0
        ),
        "course_join_codes.section_id IS NULL": int(
            fetch_scalar(conn, "SELECT COUNT(*) FROM course_join_codes WHERE section_id IS NULL") or 0
        ),
        "course_join_codes.section_id IS NULL AND is_active = TRUE": int(
            fetch_scalar(
                conn,
                """
                SELECT COUNT(*)
                FROM course_join_codes
                WHERE section_id IS NULL
                  AND is_active = TRUE
                """,
            )
            or 0
        ),
        "interaction_boards.section_id IS NULL": int(
            fetch_scalar(conn, "SELECT COUNT(*) FROM interaction_boards WHERE section_id IS NULL") or 0
        ),
        "questions.section_id IS NULL": int(
            fetch_scalar(conn, "SELECT COUNT(*) FROM questions WHERE section_id IS NULL") or 0
        ),
    }


def get_enrollment_candidates(conn: Connection) -> list[dict[str, Any]]:
    """Backfill enrollments only when the course has exactly one section."""
    return fetch_rows(
        conn,
        """
        SELECT
            e.enrollment_id,
            MIN(cs.section_id) AS section_id
        FROM enrollments e
        JOIN course_sections cs
            ON cs.course_code = e.course_code
        WHERE e.section_id IS NULL
        GROUP BY e.enrollment_id
        HAVING COUNT(cs.section_id) = 1
        ORDER BY e.enrollment_id
        """,
    )


def get_enrollment_manual_rows(conn: Connection) -> list[dict[str, Any]]:
    """List enrollments still requiring manual review."""
    return fetch_rows(
        conn,
        """
        SELECT
            e.enrollment_id,
            e.student_id,
            e.course_code,
            COALESCE(cs.section_count, 0) AS course_section_count,
            cs.section_ids,
            CASE
                WHEN COALESCE(cs.section_count, 0) = 0 THEN 'no_sections_found_for_course'
                WHEN cs.section_count = 1 THEN 'unexpected_not_backfilled'
                ELSE 'ambiguous_course_has_multiple_sections'
            END AS reason
        FROM enrollments e
        LEFT JOIN (
            SELECT
                course_code,
                COUNT(*) AS section_count,
                GROUP_CONCAT(section_id ORDER BY section_id SEPARATOR ',') AS section_ids
            FROM course_sections
            GROUP BY course_code
        ) cs
            ON cs.course_code = e.course_code
        WHERE e.section_id IS NULL
        ORDER BY e.course_code, e.enrollment_id
        """,
    )


def get_join_code_deactivation_candidates(conn: Connection) -> list[dict[str, Any]]:
    """Return active legacy join codes that should be deactivated."""
    return fetch_rows(
        conn,
        """
        SELECT
            join_code_id,
            code,
            course_code,
            professor_id
        FROM course_join_codes
        WHERE section_id IS NULL
          AND is_active = TRUE
        ORDER BY created_at, join_code_id
        """,
    )


def get_join_code_manual_rows(conn: Connection) -> list[dict[str, Any]]:
    """List join codes still missing section_id after deactivation."""
    return fetch_rows(
        conn,
        """
        SELECT
            join_code_id,
            code,
            course_code,
            professor_id,
            is_active,
            expires_at,
            'manual_cleanup_required_before_not_null' AS reason
        FROM course_join_codes
        WHERE section_id IS NULL
        ORDER BY is_active DESC, created_at, join_code_id
        """,
    )


def get_board_candidates_from_questions(conn: Connection) -> list[dict[str, Any]]:
    """Backfill boards when all known question sections agree."""
    return fetch_rows(
        conn,
        """
        SELECT
            b.board_id,
            MIN(q.section_id) AS section_id
        FROM interaction_boards b
        JOIN questions q
            ON q.board_id = b.board_id
        WHERE b.section_id IS NULL
          AND q.section_id IS NOT NULL
        GROUP BY b.board_id
        HAVING COUNT(DISTINCT q.section_id) = 1
        ORDER BY b.board_id
        """,
    )


def get_board_candidates_from_single_section_course(conn: Connection) -> list[dict[str, Any]]:
    """Backfill boards when their course has exactly one section."""
    return fetch_rows(
        conn,
        """
        SELECT
            b.board_id,
            MIN(cs.section_id) AS section_id
        FROM interaction_boards b
        JOIN course_sections cs
            ON cs.course_code = b.course_code
        WHERE b.section_id IS NULL
        GROUP BY b.board_id
        HAVING COUNT(cs.section_id) = 1
        ORDER BY b.board_id
        """,
    )


def get_board_manual_rows(conn: Connection) -> list[dict[str, Any]]:
    """List boards that still cannot be resolved safely."""
    return fetch_rows(
        conn,
        """
        SELECT
            b.board_id,
            b.course_code,
            COALESCE(qs.non_null_question_count, 0) AS non_null_question_count,
            COALESCE(qs.distinct_question_sections, 0) AS distinct_question_sections,
            qs.question_section_ids,
            COALESCE(cs.section_count, 0) AS course_section_count,
            cs.course_section_ids,
            CASE
                WHEN COALESCE(qs.distinct_question_sections, 0) > 1 THEN 'conflicting_question_sections'
                WHEN COALESCE(qs.non_null_question_count, 0) = 0 AND COALESCE(cs.section_count, 0) = 0 THEN 'no_sections_found_for_course'
                WHEN COALESCE(qs.non_null_question_count, 0) = 0 AND COALESCE(cs.section_count, 0) > 1 THEN 'ambiguous_course_has_multiple_sections'
                ELSE 'manual_review_required'
            END AS reason
        FROM interaction_boards b
        LEFT JOIN (
            SELECT
                q.board_id,
                COUNT(*) AS non_null_question_count,
                COUNT(DISTINCT q.section_id) AS distinct_question_sections,
                GROUP_CONCAT(DISTINCT q.section_id ORDER BY q.section_id SEPARATOR ',') AS question_section_ids
            FROM questions q
            WHERE q.section_id IS NOT NULL
            GROUP BY q.board_id
        ) qs
            ON qs.board_id = b.board_id
        LEFT JOIN (
            SELECT
                course_code,
                COUNT(*) AS section_count,
                GROUP_CONCAT(section_id ORDER BY section_id SEPARATOR ',') AS course_section_ids
            FROM course_sections
            GROUP BY course_code
        ) cs
            ON cs.course_code = b.course_code
        WHERE b.section_id IS NULL
        ORDER BY b.course_code, b.board_id
        """,
    )


def get_question_candidates_from_board(conn: Connection) -> list[dict[str, Any]]:
    """Backfill questions from a known board.section_id."""
    return fetch_rows(
        conn,
        """
        SELECT
            q.question_id,
            b.section_id
        FROM questions q
        JOIN interaction_boards b
            ON b.board_id = q.board_id
        WHERE q.section_id IS NULL
          AND q.board_id IS NOT NULL
          AND b.section_id IS NOT NULL
        ORDER BY q.question_id
        """,
    )


def get_question_candidates_from_enrollment(conn: Connection) -> list[dict[str, Any]]:
    """Backfill questions when student enrollment resolves to one section."""
    return fetch_rows(
        conn,
        """
        SELECT
            q.question_id,
            enrollment_choice.section_id
        FROM questions q
        JOIN (
            SELECT
                student_id,
                course_code,
                MIN(section_id) AS section_id
            FROM enrollments
            WHERE section_id IS NOT NULL
            GROUP BY student_id, course_code
            HAVING COUNT(DISTINCT section_id) = 1
        ) enrollment_choice
            ON enrollment_choice.student_id = q.student_id
           AND enrollment_choice.course_code = q.course_code
        WHERE q.section_id IS NULL
        ORDER BY q.question_id
        """,
    )


def get_question_candidates_from_single_section_course(conn: Connection) -> list[dict[str, Any]]:
    """Backfill questions when the course has exactly one section."""
    return fetch_rows(
        conn,
        """
        SELECT
            q.question_id,
            MIN(cs.section_id) AS section_id
        FROM questions q
        JOIN course_sections cs
            ON cs.course_code = q.course_code
        WHERE q.section_id IS NULL
        GROUP BY q.question_id
        HAVING COUNT(cs.section_id) = 1
        ORDER BY q.question_id
        """,
    )


def get_question_manual_rows(conn: Connection) -> list[dict[str, Any]]:
    """List unresolved questions and the evidence that was available."""
    return fetch_rows(
        conn,
        """
        SELECT
            q.question_id,
            q.board_id,
            q.course_code,
            q.student_id,
            b.section_id AS board_section_id,
            COALESCE(es.section_count, 0) AS enrollment_section_count,
            es.enrollment_section_ids,
            COALESCE(cs.section_count, 0) AS course_section_count,
            cs.course_section_ids,
            CASE
                WHEN q.board_id IS NOT NULL AND b.section_id IS NULL AND COALESCE(cs.section_count, 0) > 1
                    THEN 'board_unresolved_and_course_has_multiple_sections'
                WHEN COALESCE(es.section_count, 0) > 1
                    THEN 'ambiguous_student_has_multiple_section_candidates'
                WHEN COALESCE(es.section_count, 0) = 0 AND COALESCE(cs.section_count, 0) > 1
                    THEN 'no_unique_enrollment_and_course_has_multiple_sections'
                WHEN COALESCE(cs.section_count, 0) = 0
                    THEN 'no_sections_found_for_course'
                ELSE 'manual_review_required'
            END AS reason
        FROM questions q
        LEFT JOIN interaction_boards b
            ON b.board_id = q.board_id
        LEFT JOIN (
            SELECT
                student_id,
                course_code,
                COUNT(DISTINCT section_id) AS section_count,
                GROUP_CONCAT(DISTINCT section_id ORDER BY section_id SEPARATOR ',') AS enrollment_section_ids
            FROM enrollments
            WHERE section_id IS NOT NULL
            GROUP BY student_id, course_code
        ) es
            ON es.student_id = q.student_id
           AND es.course_code = q.course_code
        LEFT JOIN (
            SELECT
                course_code,
                COUNT(*) AS section_count,
                GROUP_CONCAT(section_id ORDER BY section_id SEPARATOR ',') AS course_section_ids
            FROM course_sections
            GROUP BY course_code
        ) cs
            ON cs.course_code = q.course_code
        WHERE q.section_id IS NULL
        ORDER BY q.course_code, q.question_id
        """,
    )


def print_sql_checks() -> None:
    """Print the post-run validation queries."""
    print("\nPost-run validation SQL")
    print("  SELECT COUNT(*) FROM enrollments WHERE section_id IS NULL;")
    print("  SELECT COUNT(*) FROM course_join_codes WHERE section_id IS NULL AND is_active = TRUE;")
    print("  SELECT COUNT(*) FROM interaction_boards WHERE section_id IS NULL;")
    print("  SELECT COUNT(*) FROM questions WHERE section_id IS NULL;")


def print_final_alter_guidance(final_counts: dict[str, int]) -> None:
    """Print NOT NULL ALTER statements only when the data is ready."""
    remaining_blockers = [
        final_counts["enrollments.section_id IS NULL"],
        final_counts["course_join_codes.section_id IS NULL"],
        final_counts["interaction_boards.section_id IS NULL"],
        final_counts["questions.section_id IS NULL"],
    ]
    print("\nFinal NOT NULL step")
    if any(remaining_blockers):
        print("  Data is not fully clean yet. Do not run the ALTER statements below until every NULL blocker is resolved.")
    else:
        print("  Data is clean. You can now enforce NOT NULL with the statements below.")
    for statement in FINAL_NOT_NULL_SQL:
        print(f"  {statement}")


def run(apply_changes: bool) -> None:
    """Execute the full backfill workflow."""
    mode = "APPLY" if apply_changes else "DRY-RUN"
    print(f"Running section_id backfill in {mode} mode.")
    print(f"Resolved section_id SQL type from schema guidance: {SECTION_ID_SQL_TYPE}")
    context_manager = engine.begin() if apply_changes else engine.connect()
    with context_manager as conn:
        initial_counts = get_null_counts(conn)
        print_count_block("Initial NULL counts", initial_counts)

        summary = {
            "enrollments_backfilled": 0,
            "boards_backfilled": 0,
            "questions_backfilled": 0,
            "join_codes_deactivated": 0,
        }

        enrollment_candidates = get_enrollment_candidates(conn)
        summary["enrollments_backfilled"] += apply_section_updates(
            conn,
            "enrollments",
            "enrollment_id",
            enrollment_candidates,
            apply_changes,
        )
        print_rows("Enrollments backfilled from single-section course", enrollment_candidates)

        join_code_deactivation_candidates = get_join_code_deactivation_candidates(conn)
        summary["join_codes_deactivated"] += apply_join_code_deactivation(
            conn,
            join_code_deactivation_candidates,
            apply_changes,
        )
        print_rows("Join codes to deactivate because section_id is NULL", join_code_deactivation_candidates)

        board_candidates_from_questions = get_board_candidates_from_questions(conn)
        summary["boards_backfilled"] += apply_section_updates(
            conn,
            "interaction_boards",
            "board_id",
            board_candidates_from_questions,
            apply_changes,
        )
        print_rows("Boards backfilled from unanimous question.section_id", board_candidates_from_questions)

        board_candidates_from_single_section_course = get_board_candidates_from_single_section_course(conn)
        summary["boards_backfilled"] += apply_section_updates(
            conn,
            "interaction_boards",
            "board_id",
            board_candidates_from_single_section_course,
            apply_changes,
        )
        print_rows(
            "Boards backfilled from single-section course",
            board_candidates_from_single_section_course,
        )

        question_candidates_from_board = get_question_candidates_from_board(conn)
        summary["questions_backfilled"] += apply_section_updates(
            conn,
            "questions",
            "question_id",
            question_candidates_from_board,
            apply_changes,
        )
        print_rows("Questions backfilled from board.section_id", question_candidates_from_board)

        question_candidates_from_enrollment = get_question_candidates_from_enrollment(conn)
        summary["questions_backfilled"] += apply_section_updates(
            conn,
            "questions",
            "question_id",
            question_candidates_from_enrollment,
            apply_changes,
        )
        print_rows(
            "Questions backfilled from unique student enrollment.section_id",
            question_candidates_from_enrollment,
        )

        question_candidates_from_single_section_course = get_question_candidates_from_single_section_course(conn)
        summary["questions_backfilled"] += apply_section_updates(
            conn,
            "questions",
            "question_id",
            question_candidates_from_single_section_course,
            apply_changes,
        )
        print_rows(
            "Questions backfilled from single-section course",
            question_candidates_from_single_section_course,
        )

        board_candidates_after_question_backfill = get_board_candidates_from_questions(conn)
        summary["boards_backfilled"] += apply_section_updates(
            conn,
            "interaction_boards",
            "board_id",
            board_candidates_after_question_backfill,
            apply_changes,
        )
        print_rows(
            "Boards backfilled after question backfill produced unanimous section evidence",
            board_candidates_after_question_backfill,
        )

        question_candidates_after_board_backfill = get_question_candidates_from_board(conn)
        summary["questions_backfilled"] += apply_section_updates(
            conn,
            "questions",
            "question_id",
            question_candidates_after_board_backfill,
            apply_changes,
        )
        print_rows(
            "Questions backfilled after boards became resolvable",
            question_candidates_after_board_backfill,
        )

        enrollment_manual_rows = get_enrollment_manual_rows(conn)
        join_code_manual_rows = get_join_code_manual_rows(conn)
        board_manual_rows = get_board_manual_rows(conn)
        question_manual_rows = get_question_manual_rows(conn)

        print_rows("Enrollments still requiring manual review", enrollment_manual_rows)
        print_rows("Join codes still requiring manual cleanup", join_code_manual_rows)
        print_rows("Boards still requiring manual review", board_manual_rows)
        print_rows("Questions still requiring manual review", question_manual_rows)

        print_count_block(
            "Outcome summary",
            {
                "records_found_with_initial_nulls": sum(
                    [
                        initial_counts["enrollments.section_id IS NULL"],
                        initial_counts["course_join_codes.section_id IS NULL"],
                        initial_counts["interaction_boards.section_id IS NULL"],
                        initial_counts["questions.section_id IS NULL"],
                    ]
                ),
                "enrollments_backfilled": summary["enrollments_backfilled"],
                "boards_backfilled": summary["boards_backfilled"],
                "questions_backfilled": summary["questions_backfilled"],
                "join_codes_deactivated": summary["join_codes_deactivated"],
                "manual_enrollments": len(enrollment_manual_rows),
                "manual_join_codes": len(join_code_manual_rows),
                "manual_boards": len(board_manual_rows),
                "manual_questions": len(question_manual_rows),
            },
        )

        final_counts = get_null_counts(conn)
        print_count_block("Final NULL counts", final_counts)
        print_sql_checks()
        print_final_alter_guidance(final_counts)


def parse_args() -> argparse.Namespace:
    """Parse CLI flags."""
    parser = argparse.ArgumentParser(
        description="Backfill legacy NULL section_id values safely before enforcing NOT NULL."
    )
    mode_group = parser.add_mutually_exclusive_group()
    mode_group.add_argument(
        "--dry-run",
        action="store_true",
        help="Preview changes only. This is also the default when no mode flag is provided.",
    )
    mode_group.add_argument(
        "--apply",
        action="store_true",
        help="Apply updates. Default mode is dry-run and does not modify data.",
    )
    return parser.parse_args()


if __name__ == "__main__":
    args = parse_args()
    run(apply_changes=args.apply)
