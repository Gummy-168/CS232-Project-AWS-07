USE cs232db;

-- Safe legacy section_id cleanup for databases that were created before
-- enrollments / course_join_codes / interaction_boards / questions enforced
-- section_id as NOT NULL.
-- Verified schema type in backend/sql/init.sql:
--   course_sections.section_id = VARCHAR(50)
-- Every referencing section_id column in this migration therefore uses VARCHAR(50) too.
--
-- Rules implemented here:
-- 1. enrollments.section_id:
--    - backfill only when the course has exactly one section.
--    - otherwise report for manual review.
-- 2. course_join_codes.section_id:
--    - do not guess.
--    - deactivate active codes with NULL section_id.
--    - leave NULL rows for manual cleanup before ALTER NOT NULL.
-- 3. interaction_boards.section_id:
--    - backfill when all known question.section_id values agree.
--    - otherwise backfill only when the course has exactly one section.
--    - report the rest.
-- 4. questions.section_id:
--    - backfill from board.section_id when available.
--    - otherwise backfill from a unique student enrollment.section_id.
--    - otherwise backfill when the course has exactly one section.
--    - report the rest.
--
-- Run this file manually. Do not wire it into backend startup.
-- If you want a dry-run style report first, use:
--   python scripts/backfill_section_ids.py --dry-run

-- ---------------------------------------------------------------------------
-- Pre-check: legacy NULL counts
-- ---------------------------------------------------------------------------
SELECT COUNT(*) AS enrollment_null_count
FROM enrollments
WHERE section_id IS NULL;

SELECT COUNT(*) AS course_join_code_null_count
FROM course_join_codes
WHERE section_id IS NULL;

SELECT COUNT(*) AS active_course_join_code_null_count
FROM course_join_codes
WHERE section_id IS NULL
  AND is_active = TRUE;

SELECT COUNT(*) AS board_null_count
FROM interaction_boards
WHERE section_id IS NULL;

SELECT COUNT(*) AS question_null_count
FROM questions
WHERE section_id IS NULL;

-- ---------------------------------------------------------------------------
-- enrollments.section_id
-- ---------------------------------------------------------------------------
UPDATE enrollments e
JOIN (
    SELECT
        e2.enrollment_id,
        MIN(cs.section_id) AS section_id
    FROM enrollments e2
    JOIN course_sections cs
        ON cs.course_code = e2.course_code
    WHERE e2.section_id IS NULL
    GROUP BY e2.enrollment_id
    HAVING COUNT(cs.section_id) = 1
) candidate
    ON candidate.enrollment_id = e.enrollment_id
SET e.section_id = candidate.section_id
WHERE e.section_id IS NULL;

SELECT
    e.enrollment_id,
    e.student_id,
    e.course_code,
    COALESCE(cs.section_count, 0) AS course_section_count,
    cs.section_ids,
    CASE
        WHEN COALESCE(cs.section_count, 0) = 0 THEN 'no_sections_found_for_course'
        WHEN cs.section_count > 1 THEN 'ambiguous_course_has_multiple_sections'
        ELSE 'manual_review_required'
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
ORDER BY e.course_code, e.enrollment_id;

-- ---------------------------------------------------------------------------
-- course_join_codes.section_id
-- ---------------------------------------------------------------------------
UPDATE course_join_codes
SET is_active = FALSE
WHERE section_id IS NULL
  AND is_active = TRUE;

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
ORDER BY is_active DESC, created_at, join_code_id;

-- ---------------------------------------------------------------------------
-- interaction_boards.section_id pass 1
-- ---------------------------------------------------------------------------
UPDATE interaction_boards b
JOIN (
    SELECT
        b2.board_id,
        MIN(q.section_id) AS section_id
    FROM interaction_boards b2
    JOIN questions q
        ON q.board_id = b2.board_id
    WHERE b2.section_id IS NULL
      AND q.section_id IS NOT NULL
    GROUP BY b2.board_id
    HAVING COUNT(DISTINCT q.section_id) = 1
) candidate
    ON candidate.board_id = b.board_id
SET b.section_id = candidate.section_id
WHERE b.section_id IS NULL;

UPDATE interaction_boards b
JOIN (
    SELECT
        b2.board_id,
        MIN(cs.section_id) AS section_id
    FROM interaction_boards b2
    JOIN course_sections cs
        ON cs.course_code = b2.course_code
    WHERE b2.section_id IS NULL
    GROUP BY b2.board_id
    HAVING COUNT(cs.section_id) = 1
) candidate
    ON candidate.board_id = b.board_id
SET b.section_id = candidate.section_id
WHERE b.section_id IS NULL;

-- ---------------------------------------------------------------------------
-- questions.section_id pass 1
-- ---------------------------------------------------------------------------
UPDATE questions q
JOIN interaction_boards b
    ON b.board_id = q.board_id
SET q.section_id = b.section_id
WHERE q.section_id IS NULL
  AND q.board_id IS NOT NULL
  AND b.section_id IS NOT NULL;

UPDATE questions q
JOIN (
    SELECT
        student_id,
        course_code,
        MIN(section_id) AS section_id
    FROM enrollments
    WHERE section_id IS NOT NULL
    GROUP BY student_id, course_code
    HAVING COUNT(DISTINCT section_id) = 1
) candidate
    ON candidate.student_id = q.student_id
   AND candidate.course_code = q.course_code
SET q.section_id = candidate.section_id
WHERE q.section_id IS NULL;

UPDATE questions q
JOIN (
    SELECT
        q2.question_id,
        MIN(cs.section_id) AS section_id
    FROM questions q2
    JOIN course_sections cs
        ON cs.course_code = q2.course_code
    WHERE q2.section_id IS NULL
    GROUP BY q2.question_id
    HAVING COUNT(cs.section_id) = 1
) candidate
    ON candidate.question_id = q.question_id
SET q.section_id = candidate.section_id
WHERE q.section_id IS NULL;

-- ---------------------------------------------------------------------------
-- interaction_boards.section_id pass 2
-- Re-run after question backfill in case questions now provide unanimous evidence.
-- ---------------------------------------------------------------------------
UPDATE interaction_boards b
JOIN (
    SELECT
        b2.board_id,
        MIN(q.section_id) AS section_id
    FROM interaction_boards b2
    JOIN questions q
        ON q.board_id = b2.board_id
    WHERE b2.section_id IS NULL
      AND q.section_id IS NOT NULL
    GROUP BY b2.board_id
    HAVING COUNT(DISTINCT q.section_id) = 1
) candidate
    ON candidate.board_id = b.board_id
SET b.section_id = candidate.section_id
WHERE b.section_id IS NULL;

-- ---------------------------------------------------------------------------
-- questions.section_id pass 2
-- Re-run board-based backfill after newly resolved boards.
-- ---------------------------------------------------------------------------
UPDATE questions q
JOIN interaction_boards b
    ON b.board_id = q.board_id
SET q.section_id = b.section_id
WHERE q.section_id IS NULL
  AND q.board_id IS NOT NULL
  AND b.section_id IS NOT NULL;

-- ---------------------------------------------------------------------------
-- Manual review reports
-- ---------------------------------------------------------------------------
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
        WHEN COALESCE(qs.non_null_question_count, 0) = 0 AND COALESCE(cs.section_count, 0) > 1 THEN 'ambiguous_course_has_multiple_sections'
        WHEN COALESCE(qs.non_null_question_count, 0) = 0 AND COALESCE(cs.section_count, 0) = 0 THEN 'no_sections_found_for_course'
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
ORDER BY b.course_code, b.board_id;

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
ORDER BY q.course_code, q.question_id;

-- ---------------------------------------------------------------------------
-- Post-run validation queries
-- ---------------------------------------------------------------------------
SELECT COUNT(*) AS enrollment_null_count_after
FROM enrollments
WHERE section_id IS NULL;

SELECT COUNT(*) AS active_course_join_code_null_count_after
FROM course_join_codes
WHERE section_id IS NULL
  AND is_active = TRUE;

SELECT COUNT(*) AS board_null_count_after
FROM interaction_boards
WHERE section_id IS NULL;

SELECT COUNT(*) AS question_null_count_after
FROM questions
WHERE section_id IS NULL;

-- ---------------------------------------------------------------------------
-- Final DDL step: run only after every remaining NULL has been manually resolved.
-- These are intentionally commented out.
-- ---------------------------------------------------------------------------
-- ALTER TABLE enrollments MODIFY section_id VARCHAR(50) NOT NULL;
-- ALTER TABLE course_join_codes MODIFY section_id VARCHAR(50) NOT NULL;
-- ALTER TABLE interaction_boards MODIFY section_id VARCHAR(50) NOT NULL;
-- ALTER TABLE questions MODIFY section_id VARCHAR(50) NOT NULL;
