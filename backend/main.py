import json
from datetime import datetime
from uuid import uuid4

from fastapi import Depends, FastAPI, Header, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from sqlalchemy import text
from sqlalchemy.orm import Session

from database import Base, SessionLocal, engine
from models.professor import Professor
from models.user import User
from schemas.course import (
    CourseCreate,
    CourseJoinCodeCreate,
    CourseJoinCodeResponse,
    CourseResponse,
    CourseSectionCreate,
    CourseSectionResponse,
)
from schemas.enrollment import EnrollmentCreate, EnrollmentResponse
from schemas.question import (
    CourseQuestionFeedResponse,
    ProfessorQuestionStatusUpdate,
    QuestionDeleteResponse,
    QuestionStatusResponse,
)
from schemas.user import TokenResponse, UserCreate, UserLogin
from services.course_manager import CourseManager
from services.enrollment_manager import EnrollmentManager
from services.question_manager import QuestionManager
from services.user_manager import UserManager

import models.course
import models.course_join_code
import models.course_section
import models.enrollment
import models.professor
import models.board
import models.question
import models.user

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)
with engine.begin() as conn:
    has_full_name_column = conn.execute(
        text(
            """
            SELECT COUNT(*)
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE()
              AND TABLE_NAME = 'users'
              AND COLUMN_NAME = 'full_name'
            """
        )
    ).scalar()
    if not has_full_name_column:
        conn.execute(
            text("ALTER TABLE users ADD COLUMN full_name VARCHAR(150) NULL AFTER role")
        )
    has_question_tags_column = conn.execute(
        text(
            """
            SELECT COUNT(*)
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE()
              AND TABLE_NAME = 'questions'
              AND COLUMN_NAME = 'tags'
            """
        )
    ).scalar()
    if not has_question_tags_column:
        conn.execute(text("ALTER TABLE questions ADD COLUMN tags JSON NULL AFTER is_anonymous"))
    question_board_nullable = conn.execute(
        text(
            """
            SELECT IS_NULLABLE
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE()
              AND TABLE_NAME = 'questions'
              AND COLUMN_NAME = 'board_id'
            """
        )
    ).scalar()
    if question_board_nullable == 'NO':
        conn.execute(text("ALTER TABLE questions MODIFY COLUMN board_id VARCHAR(50) NULL"))
    has_question_course_code_column = conn.execute(
        text(
            """
            SELECT COUNT(*)
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE()
              AND TABLE_NAME = 'questions'
              AND COLUMN_NAME = 'course_code'
            """
        )
    ).scalar()
    if not has_question_course_code_column:
        conn.execute(text("ALTER TABLE questions ADD COLUMN course_code VARCHAR(50) NULL AFTER board_id"))
    has_question_section_id_column = conn.execute(
        text(
            """
            SELECT COUNT(*)
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE()
              AND TABLE_NAME = 'questions'
              AND COLUMN_NAME = 'section_id'
            """
        )
    ).scalar()
    if not has_question_section_id_column:
        conn.execute(text("ALTER TABLE questions ADD COLUMN section_id VARCHAR(50) NULL AFTER course_code"))
    conn.execute(
        text(
            """
            UPDATE questions q
            LEFT JOIN interaction_boards b ON b.board_id = q.board_id
            SET q.course_code = b.course_code,
                q.section_id = b.section_id
            WHERE q.course_code IS NULL OR q.course_code = ''
            """
        )
    )
    course_code_not_null = conn.execute(
        text(
            """
            SELECT COUNT(*)
            FROM questions
            WHERE course_code IS NULL OR course_code = ''
            """
        )
    ).scalar()
    if course_code_not_null == 0:
        conn.execute(text("ALTER TABLE questions MODIFY COLUMN course_code VARCHAR(50) NOT NULL"))
    conn.execute(
        text(
            """
            UPDATE users
            SET full_name = COALESCE(NULLIF(full_name, ''), nickname, user_id)
            WHERE full_name IS NULL OR full_name = ''
            """
        )
    )
    conn.execute(
        text(
            """
            CREATE TABLE IF NOT EXISTS professors (
                professor_id VARCHAR(50) PRIMARY KEY,
                email VARCHAR(255) NULL UNIQUE,
                password_hash VARCHAR(255) NULL,
                role VARCHAR(50) NOT NULL DEFAULT 'professor',
                full_name VARCHAR(150) NULL,
                nickname VARCHAR(100) NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_professors_email (email),
                INDEX idx_professors_professor_id (professor_id)
            )
            """
        )
    )
    has_professor_user_fk = conn.execute(
        text(
            """
            SELECT COUNT(*)
            FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
            WHERE TABLE_SCHEMA = DATABASE()
              AND TABLE_NAME = 'professors'
              AND CONSTRAINT_TYPE = 'FOREIGN KEY'
              AND CONSTRAINT_NAME = 'fk_professors_user'
            """
        )
    ).scalar()
    if has_professor_user_fk:
        conn.execute(text("ALTER TABLE professors DROP FOREIGN KEY fk_professors_user"))
    professor_columns = {
        "email": "ALTER TABLE professors ADD COLUMN email VARCHAR(255) NULL UNIQUE AFTER professor_id",
        "password_hash": "ALTER TABLE professors ADD COLUMN password_hash VARCHAR(255) NULL AFTER email",
        "role": "ALTER TABLE professors ADD COLUMN role VARCHAR(50) NOT NULL DEFAULT 'professor' AFTER password_hash",
        "full_name": "ALTER TABLE professors ADD COLUMN full_name VARCHAR(150) NULL AFTER role",
        "nickname": "ALTER TABLE professors ADD COLUMN nickname VARCHAR(100) NULL AFTER full_name",
    }
    for column_name, alter_sql in professor_columns.items():
        has_column = conn.execute(
            text(
                """
                SELECT COUNT(*)
                FROM INFORMATION_SCHEMA.COLUMNS
                WHERE TABLE_SCHEMA = DATABASE()
                  AND TABLE_NAME = 'professors'
                  AND COLUMN_NAME = :column_name
                """
            ),
            {"column_name": column_name},
        ).scalar()
        if not has_column:
            conn.execute(text(alter_sql))
    conn.execute(
        text(
            """
            UPDATE professors
            SET role = 'professor'
            WHERE role IS NULL OR role = ''
            """
        )
    )
    conn.execute(
        text(
            """
            UPDATE users
            SET email = 'prof001@example.com',
                password_hash = COALESCE(NULLIF(password_hash, ''), :prof_hash),
                role = 'professor',
                full_name = 'Professor CS232',
                nickname = 'Prof CS232'
            WHERE user_id = 'prof001'
            """
        ),
        {"prof_hash": "1ec76e799fcbdafce642c640793c7ca39a586bd17166ba0d4f9c98c65713b284"},
    )
    conn.execute(
        text(
            """
            UPDATE users
            SET password_hash = :student_hash
            WHERE user_id IN ('stu001', 'stu002')
              AND password_hash = 'hashed_password'
            """
        ),
        {"student_hash": "debb161e8b26f3cab862f7c9f1e87fb88f8282d566bb724e0eb1d583faf84f6a"},
    )
    conn.execute(
        text(
            """
            INSERT IGNORE INTO users (
                user_id,
                email,
                password_hash,
                role,
                full_name,
                nickname
            ) VALUES (
                'prof001',
                'prof001@example.com',
                :prof_hash,
                'professor',
                'Professor CS232',
                'Prof CS232'
            )
            """
        ),
        {"prof_hash": "1ec76e799fcbdafce642c640793c7ca39a586bd17166ba0d4f9c98c65713b284"},
    )
    conn.execute(
        text(
            """
            INSERT IGNORE INTO professors (
                professor_id,
                email,
                password_hash,
                role,
                full_name,
                nickname
            ) VALUES (
                'prof001',
                'prof001@example.com',
                :prof_hash,
                'professor',
                'Professor CS232',
                'Prof CS232'
            )
            """
        ),
        {"prof_hash": "1ec76e799fcbdafce642c640793c7ca39a586bd17166ba0d4f9c98c65713b284"},
    )
    conn.execute(
        text(
            """
            INSERT IGNORE INTO professors (
                professor_id,
                email,
                password_hash,
                role,
                full_name,
                nickname
            )
            SELECT
                user_id,
                email,
                password_hash,
                'professor',
                full_name,
                COALESCE(NULLIF(nickname, ''), full_name, user_id)
            FROM users
            WHERE role = 'professor'
            """
        )
    )
    conn.execute(
        text(
            """
            UPDATE professors p
            JOIN users u ON u.user_id = p.professor_id
            SET p.email = COALESCE(NULLIF(p.email, ''), u.email),
                p.password_hash = COALESCE(NULLIF(p.password_hash, ''), u.password_hash),
                p.role = 'professor',
                p.full_name = COALESCE(NULLIF(p.full_name, ''), u.full_name, u.nickname, u.user_id),
                p.nickname = COALESCE(NULLIF(p.nickname, ''), u.nickname, u.full_name, u.user_id)
            WHERE p.email IS NULL
               OR p.email = ''
               OR p.password_hash IS NULL
               OR p.password_hash = ''
               OR p.role IS NULL
               OR p.role = ''
               OR p.full_name IS NULL
               OR p.full_name = ''
               OR p.nickname IS NULL
               OR p.nickname = ''
            """
        )
    )
    conn.execute(
        text(
            """
            UPDATE professors
            SET email = 'prof001@example.com',
                password_hash = COALESCE(NULLIF(password_hash, ''), :prof_hash),
                role = 'professor',
                full_name = 'Professor CS232',
                nickname = 'Prof CS232'
            WHERE professor_id = 'prof001'
            """
        ),
        {"prof_hash": "1ec76e799fcbdafce642c640793c7ca39a586bd17166ba0d4f9c98c65713b284"},
    )
    conn.execute(
        text(
            """
            INSERT IGNORE INTO users (
                user_id,
                email,
                password_hash,
                role,
                full_name,
                nickname
            )
            SELECT
                p.professor_id,
                p.email,
                p.password_hash,
                p.role,
                p.full_name,
                p.nickname
            FROM professors p
            WHERE p.email IS NOT NULL
              AND p.password_hash IS NOT NULL
              AND p.role = 'professor'
              AND p.full_name IS NOT NULL
              AND p.nickname IS NOT NULL
            """
        )
    )
    conn.execute(
        text(
            """
            UPDATE users u
            JOIN professors p ON p.professor_id = u.user_id
            SET u.email = p.email,
                u.password_hash = p.password_hash,
                u.role = p.role,
                u.full_name = p.full_name,
                u.nickname = p.nickname
            WHERE p.role = 'professor'
            """
        )
    )
    conn.execute(
        text(
            """
            CREATE TABLE IF NOT EXISTS question_replies (
                reply_id VARCHAR(50) PRIMARY KEY,
                question_id VARCHAR(50) NOT NULL,
                user_id VARCHAR(50) NOT NULL,
                content TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_question_replies_question_id (question_id),
                INDEX idx_question_replies_user_id (user_id),
                CONSTRAINT fk_question_replies_question
                    FOREIGN KEY (question_id) REFERENCES questions(question_id)
                    ON UPDATE CASCADE
                    ON DELETE CASCADE,
                CONSTRAINT fk_question_replies_user
                    FOREIGN KEY (user_id) REFERENCES users(user_id)
                    ON UPDATE CASCADE
                    ON DELETE CASCADE
            )
            """
        )
    )
    conn.execute(
        text(
            """
            CREATE TABLE IF NOT EXISTS course_sections (
                section_id VARCHAR(50) PRIMARY KEY,
                course_code VARCHAR(50) NOT NULL,
                section_code VARCHAR(50) NOT NULL,
                meeting_days VARCHAR(100) NOT NULL DEFAULT '',
                start_time VARCHAR(5) NOT NULL,
                end_time VARCHAR(5) NOT NULL,
                is_active BOOLEAN DEFAULT TRUE,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_course_sections_course_code (course_code),
                CONSTRAINT uq_course_sections_course_section UNIQUE (course_code, section_code),
                CONSTRAINT fk_course_sections_course
                    FOREIGN KEY (course_code) REFERENCES courses(course_code)
                    ON UPDATE CASCADE
                    ON DELETE CASCADE
            )
            """
        )
    )
    has_board_section_column = conn.execute(
        text(
            """
            SELECT COUNT(*)
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE()
              AND TABLE_NAME = 'interaction_boards'
              AND COLUMN_NAME = 'section_id'
            """
        )
    ).scalar()
    if not has_board_section_column:
        conn.execute(
            text(
                """
                ALTER TABLE interaction_boards
                ADD COLUMN section_id VARCHAR(50) NULL AFTER course_code
                """
            )
        )
        conn.execute(
            text("ALTER TABLE interaction_boards ADD INDEX idx_interaction_boards_section_id (section_id)")
        )
    has_board_section_fk = conn.execute(
        text(
            """
            SELECT COUNT(*)
            FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
            WHERE TABLE_SCHEMA = DATABASE()
              AND TABLE_NAME = 'interaction_boards'
              AND CONSTRAINT_TYPE = 'FOREIGN KEY'
              AND CONSTRAINT_NAME = 'fk_interaction_boards_section'
            """
        )
    ).scalar()
    if not has_board_section_fk:
        conn.execute(
            text(
                """
                ALTER TABLE interaction_boards
                ADD CONSTRAINT fk_interaction_boards_section
                    FOREIGN KEY (section_id) REFERENCES course_sections(section_id)
                    ON UPDATE CASCADE
                    ON DELETE SET NULL
                """
            )
        )
    has_board_title_column = conn.execute(
        text(
            """
            SELECT COUNT(*)
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE()
              AND TABLE_NAME = 'interaction_boards'
              AND COLUMN_NAME = 'board_title'
            """
        )
    ).scalar()
    if not has_board_title_column:
        conn.execute(
            text(
                """
                ALTER TABLE interaction_boards
                ADD COLUMN board_title VARCHAR(255) NULL AFTER section_id
                """
            )
        )
    has_board_opened_by_column = conn.execute(
        text(
            """
            SELECT COUNT(*)
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE()
              AND TABLE_NAME = 'interaction_boards'
              AND COLUMN_NAME = 'opened_by'
            """
        )
    ).scalar()
    if not has_board_opened_by_column:
        conn.execute(
            text(
                """
                ALTER TABLE interaction_boards
                ADD COLUMN opened_by VARCHAR(50) NULL AFTER board_title
                """
            )
        )
    has_board_closed_at_column = conn.execute(
        text(
            """
            SELECT COUNT(*)
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE()
              AND TABLE_NAME = 'interaction_boards'
              AND COLUMN_NAME = 'closed_at'
            """
        )
    ).scalar()
    if not has_board_closed_at_column:
        conn.execute(
            text(
                """
                ALTER TABLE interaction_boards
                ADD COLUMN closed_at DATETIME NULL AFTER created_at
                """
            )
        )
    has_enrollment_section_column = conn.execute(
        text(
            """
            SELECT COUNT(*)
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE()
              AND TABLE_NAME = 'enrollments'
              AND COLUMN_NAME = 'section_id'
            """
        )
    ).scalar()
    if not has_enrollment_section_column:
        conn.execute(
            text(
                """
                ALTER TABLE enrollments
                ADD COLUMN section_id VARCHAR(50) NULL AFTER course_code
                """
            )
        )
        conn.execute(text("ALTER TABLE enrollments ADD INDEX idx_enrollments_section_id (section_id)"))
    has_enrollment_section_fk = conn.execute(
        text(
            """
            SELECT COUNT(*)
            FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
            WHERE TABLE_SCHEMA = DATABASE()
              AND TABLE_NAME = 'enrollments'
              AND CONSTRAINT_TYPE = 'FOREIGN KEY'
              AND CONSTRAINT_NAME = 'fk_enrollments_section'
            """
        )
    ).scalar()
    if not has_enrollment_section_fk:
        conn.execute(
            text(
                """
                ALTER TABLE enrollments
                ADD CONSTRAINT fk_enrollments_section
                    FOREIGN KEY (section_id) REFERENCES course_sections(section_id)
                    ON UPDATE CASCADE
                    ON DELETE SET NULL
                """
            )
        )
    conn.execute(
        text(
            """
            CREATE TABLE IF NOT EXISTS course_join_codes (
                join_code_id VARCHAR(50) PRIMARY KEY,
                code VARCHAR(20) NOT NULL UNIQUE,
                course_code VARCHAR(50) NOT NULL,
                section_id VARCHAR(50) NULL,
                professor_id VARCHAR(50) NOT NULL,
                expires_at DATETIME NOT NULL,
                is_active BOOLEAN DEFAULT TRUE,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_course_join_codes_code (code),
                INDEX idx_course_join_codes_course_code (course_code),
                INDEX idx_course_join_codes_section_id (section_id),
                INDEX idx_course_join_codes_professor_id (professor_id),
                CONSTRAINT fk_course_join_codes_course
                    FOREIGN KEY (course_code) REFERENCES courses(course_code)
                    ON UPDATE CASCADE
                    ON DELETE CASCADE,
                CONSTRAINT fk_course_join_codes_section
                    FOREIGN KEY (section_id) REFERENCES course_sections(section_id)
                    ON UPDATE CASCADE
                    ON DELETE SET NULL,
                CONSTRAINT fk_course_join_codes_professor
                    FOREIGN KEY (professor_id) REFERENCES professors(professor_id)
                    ON UPDATE CASCADE
                    ON DELETE CASCADE
            )
            """
        )
    )


class CreateQuestionRequest(BaseModel):
    """Request schema for creating a student question."""

    course_code: str = Field(min_length=1, max_length=50)
    section_code: str | None = Field(default=None, min_length=1, max_length=50)
    title: str = Field(min_length=1, max_length=255)
    detail: str | None = None
    tags: list[str] = Field(default_factory=list)
    is_anonymous: bool = False


class NicknameUpdateRequest(BaseModel):
    """Request schema for student nickname updates."""

    nickname: str = Field(min_length=1, max_length=100)


class UpdateQuestionRequest(BaseModel):
    """Request schema for editing an existing student question."""

    title: str = Field(min_length=1, max_length=255)
    detail: str | None = None


class CreateQuestionReplyRequest(BaseModel):
    """Request schema for creating a question reply."""

    content: str = Field(min_length=1, max_length=2000)


class UpdateProfessorQuestionStatusRequest(BaseModel):
    """Request schema for professor changing question status."""

    status: str = Field(min_length=1, max_length=20)


class CreateProfessorReplyRequest(BaseModel):
    """Request schema for professor reply on a question."""

    content: str = Field(min_length=1, max_length=2000)


class CreateProfessorBoardRequest(BaseModel):
    """Request schema for opening a board session by professor."""

    board_title: str = Field(min_length=1, max_length=255)
    section_code: str | None = Field(default=None, min_length=1, max_length=50)
    force_close_existing: bool = False


def get_db() -> Session:
    """Provide a database session for request handling."""
    db: Session = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_bearer_token(authorization: str = Header(default="")) -> str:
    """Extract a bearer token from the Authorization header."""
    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token.strip():
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header with Bearer token is required",
        )
    return token.strip()


def get_current_professor(
    db: Session = Depends(get_db),
    token: str = Depends(get_bearer_token),
):
    """Resolve the currently authenticated professor."""
    return UserManager.require_professor(db=db, token=token)


def get_current_user(
    db: Session = Depends(get_db),
    token: str = Depends(get_bearer_token),
) -> User:
    """Resolve the currently authenticated user."""
    return UserManager.get_current_user(db=db, token=token)


def require_student(db: Session, student_id: str) -> User:
    """Resolve and validate a student user."""
    user: User | None = UserManager.get_user_by_id(db=db, user_id=student_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found",
        )
    if user.role != "student":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This endpoint is available for student accounts only",
        )
    return user


def require_professor(db: Session, professor_id: str) -> Professor:
    """Resolve and validate a professor user."""
    professor: Professor | None = UserManager.get_professor_by_id(
        db=db,
        professor_id=professor_id,
    )
    if professor is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Professor not found",
        )
    if not professor.validate_profile_state():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Professor profile is invalid",
        )
    return professor


def serialize_datetime(value: datetime | None) -> str | None:
    """Convert datetime values to ISO format."""
    if value is None:
        return None
    return value.isoformat()


def serialize_tags(value: object) -> list[str]:
    """Normalize JSON tag values from MySQL into a list of strings."""
    if value is None:
        return []
    if isinstance(value, list):
        return [str(tag) for tag in value]
    if isinstance(value, str):
        try:
            parsed = json.loads(value)
        except json.JSONDecodeError:
            return []
        if isinstance(parsed, list):
            return [str(tag) for tag in parsed]
    return []


def has_table_column(db: Session, table_name: str, column_name: str) -> bool:
    """Check whether a table contains a specific column in the current schema."""
    row = db.execute(
        text(
            """
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = DATABASE()
              AND table_name = :table_name
              AND column_name = :column_name
            LIMIT 1
            """
        ),
        {
            "table_name": table_name,
            "column_name": column_name,
        },
    ).first()
    return row is not None

def get_question_replies_map(
    db: Session,
    question_ids: list[str],
) -> dict[str, list[dict[str, str | bool | None]]]:
    """Return question replies grouped by question id."""
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
                u.full_name AS user_full_name,
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
                "author_full_name": str(
                    row["user_full_name"] or row["user_name"] or row["user_id"]
                ),
                "is_professor": str(row["user_role"]).lower() == "professor",
                "content": str(row["content"]),
                "created_at": serialize_datetime(row["created_at"]),
                "updated_at": serialize_datetime(row["updated_at"]),
            }
        )
    return replies_map


def get_on_class_participation_stats(
    db: Session,
    student_id: str,
) -> tuple[int, int, int]:
    """
    Calculate on-class participation based on board sessions and direct course questions.

    Participation means the student asked at least one non-deleted question
    in a board session or directly in an enrolled course, after the student joined.
    """
    board_stats = db.execute(
        text(
            """
            SELECT
                COUNT(DISTINCT b.board_id) AS opened_boards,
                COUNT(DISTINCT CASE WHEN q.board_id IS NOT NULL THEN q.board_id END) AS board_participated_count,
                COUNT(DISTINCT CASE WHEN q.board_id IS NULL THEN 1 END) AS direct_question_count
            FROM enrollments e
            LEFT JOIN interaction_boards b
                ON b.course_code = e.course_code
            LEFT JOIN questions q
                ON (q.board_id = b.board_id OR (q.board_id IS NULL AND COALESCE(q.course_code, '') = e.course_code))
               AND q.student_id = :student_id
               AND q.status <> 'deleted'
            WHERE e.student_id = :student_id
            """
        ),
        {"student_id": student_id},
    ).mappings().one()

    opened_boards = int(board_stats["opened_boards"] or 0)
    board_participated = int(board_stats["board_participated_count"] or 0)
    direct_questions = int(board_stats["direct_question_count"] or 0)
    participated_boards = board_participated + (1 if direct_questions > 0 else 0)
    on_class_participation = (
        int(round((participated_boards / max(opened_boards, 1)) * 100))
        if opened_boards > 0 or direct_questions > 0
        else 0
    )
    return on_class_participation, opened_boards, participated_boards


@app.get("/")
def read_root():
    return {"message": "Backend is running"}


@app.get("/api/db-test")
def db_test():
    with engine.connect() as conn:
        conn.execute(text("SELECT 1"))
    return {"message": "MySQL connected successfully"}


@app.post("/login", response_model=TokenResponse)
def login(user_login: UserLogin, db: Session = Depends(get_db)) -> TokenResponse:
    """Authenticate a user with email and plain-text password."""
    return UserManager.authenticate_user(
        db=db,
        email=user_login.email,
        password=user_login.password,
        selected_role=user_login.role,
    )


@app.post("/register")
def register(user_data: UserCreate, db: Session = Depends(get_db)) -> dict[str, str]:
    """Register a new user with a plain-text password."""
    user = UserManager.register_user(db=db, user_data=user_data)
    return {
        "message": "User registered successfully",
        "id": user.user_id,
        "full_name": user.full_name,
        "email": user.email,
        "role": user.role,
        "nickname": user.nickname,
    }


@app.post("/courses", response_model=CourseResponse, status_code=status.HTTP_201_CREATED)
def create_course(
    course_data: CourseCreate,
    db: Session = Depends(get_db),
) -> CourseResponse:
    """Create a course for the authenticated professor."""
    # TODO: Re-enable security before deployment
    professor_id = (course_data.professor_id or "prof001").strip()
    professor = UserManager.get_professor_by_id(db=db, professor_id=professor_id)

    if professor is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A valid professor_id is required",
        )

    return CourseManager.create_course(
        db=db,
        course_data=course_data,
        professor=professor,
    )


@app.get(
    "/professors/{professor_id}/courses/{course_code}/sections",
    response_model=list[CourseSectionResponse],
)
def list_course_sections(
    professor_id: str,
    course_code: str,
    db: Session = Depends(get_db),
) -> list[CourseSectionResponse]:
    """List sections under one professor-owned course."""
    professor = UserManager.get_professor_by_id(db=db, professor_id=professor_id)
    if professor is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A valid professor_id is required",
        )

    sections = CourseManager.list_sections(
        db=db,
        professor=professor,
        course_code=course_code,
    )
    return [
        CourseSectionResponse(
            section_id=section.section_id,
            course_code=section.course_code,
            section_code=section.section_code,
            meeting_days=[
                day.strip() for day in section.meeting_days.split(",") if day.strip()
            ],
            start_time=section.start_time,
            end_time=section.end_time,
            is_active=section.is_active,
            created_at=section.created_at,
        )
        for section in sections
    ]


@app.post(
    "/professors/{professor_id}/courses/{course_code}/sections",
    response_model=CourseSectionResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_course_section(
    professor_id: str,
    course_code: str,
    section_data: CourseSectionCreate,
    db: Session = Depends(get_db),
) -> CourseSectionResponse:
    """Create a section under one professor-owned course."""
    professor = UserManager.get_professor_by_id(db=db, professor_id=professor_id)
    if professor is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A valid professor_id is required",
        )

    section = CourseManager.create_section(
        db=db,
        professor=professor,
        course_code=course_code,
        section_data=section_data,
    )
    return CourseSectionResponse(
        section_id=section.section_id,
        course_code=section.course_code,
        section_code=section.section_code,
        meeting_days=[day.strip() for day in section.meeting_days.split(",") if day.strip()],
        start_time=section.start_time,
        end_time=section.end_time,
        is_active=section.is_active,
        created_at=section.created_at,
    )


@app.get(
    "/professors/{professor_id}/courses/{course_code}/join-code",
    response_model=CourseJoinCodeResponse | None,
)
def get_active_course_join_code(
    professor_id: str,
    course_code: str,
    section_code: str | None = Query(default=None),
    db: Session = Depends(get_db),
) -> CourseJoinCodeResponse | None:
    """Return the current active join code for one course or section."""
    professor = UserManager.get_professor_by_id(db=db, professor_id=professor_id)
    if professor is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A valid professor_id is required",
        )

    join_code = CourseManager.get_active_join_code(
        db=db,
        professor=professor,
        course_code=course_code,
        section_code=section_code,
    )
    if join_code is None:
        return None

    section_code_value = None
    if join_code.section_id:
        section_row = db.execute(
            text(
                """
                SELECT section_code
                FROM course_sections
                WHERE section_id = :section_id
                LIMIT 1
                """
            ),
            {"section_id": join_code.section_id},
        ).mappings().first()
        if section_row is not None:
            section_code_value = str(section_row["section_code"])

    return CourseJoinCodeResponse(
        join_code_id=join_code.join_code_id,
        code=join_code.code,
        course_code=join_code.course_code,
        section_id=join_code.section_id,
        section_code=section_code_value,
        professor_id=join_code.professor_id,
        expires_at=join_code.expires_at,
        is_active=join_code.is_active,
        created_at=join_code.created_at,
    )


@app.post(
    "/professors/{professor_id}/courses/{course_code}/join-code",
    response_model=CourseJoinCodeResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_course_join_code(
    professor_id: str,
    course_code: str,
    payload: CourseJoinCodeCreate,
    db: Session = Depends(get_db),
) -> CourseJoinCodeResponse:
    """Generate a new 15-minute join code for one course or section."""
    professor = UserManager.get_professor_by_id(db=db, professor_id=professor_id)
    if professor is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A valid professor_id is required",
        )

    join_code = CourseManager.create_join_code(
        db=db,
        professor=professor,
        course_code=course_code,
        section_code=payload.section_code,
    )

    section_code_value = None
    if join_code.section_id:
        section_row = db.execute(
            text(
                """
                SELECT section_code
                FROM course_sections
                WHERE section_id = :section_id
                LIMIT 1
                """
            ),
            {"section_id": join_code.section_id},
        ).mappings().first()
        if section_row is not None:
            section_code_value = str(section_row["section_code"])

    return CourseJoinCodeResponse(
        join_code_id=join_code.join_code_id,
        code=join_code.code,
        course_code=join_code.course_code,
        section_id=join_code.section_id,
        section_code=section_code_value,
        professor_id=join_code.professor_id,
        expires_at=join_code.expires_at,
        is_active=join_code.is_active,
        created_at=join_code.created_at,
    )


@app.get("/students/{student_id}/profile")
def get_student_profile(
    student_id: str,
    db: Session = Depends(get_db),
) -> dict[str, str | int]:
    """Return student profile info from the database."""
    student = require_student(db=db, student_id=student_id)
    enrollment_count = db.execute(
        text(
            """
            SELECT COUNT(*) AS total
            FROM enrollments
            WHERE student_id = :student_id
            """
        ),
        {"student_id": student_id},
    ).mappings().one()
    return {
        "user_id": student.user_id,
        "full_name": student.full_name,
        "nickname": student.nickname,
        "email": student.email,
        "role": student.role,
        "enrolled_courses": int(enrollment_count["total"] or 0),
    }


@app.patch("/students/{student_id}/nickname")
def update_student_nickname(
    student_id: str,
    payload: NicknameUpdateRequest,
    db: Session = Depends(get_db),
) -> dict[str, str]:
    """Update student nickname in the database."""
    require_student(db=db, student_id=student_id)
    updated_user = UserManager.update_nickname(
        db=db,
        user_id=student_id,
        nickname=payload.nickname,
    )
    if updated_user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found",
        )
    return {
        "message": "Nickname updated successfully",
        "user_id": updated_user.user_id,
        "nickname": updated_user.nickname,
    }


@app.get("/students/{student_id}/courses")
def get_student_courses(
    student_id: str,
    db: Session = Depends(get_db),
) -> dict[str, list[dict[str, str | bool | None]]]:
    """List courses that a student has joined."""
    require_student(db=db, student_id=student_id)
    rows = db.execute(
        text(
            """
            SELECT
                c.course_code,
                c.course_name,
                c.is_active,
                c.professor_id,
                p.nickname AS professor_name,
                p.full_name AS professor_full_name,
                e.section_id,
                s.section_code,
                e.join_date
            FROM enrollments e
            JOIN courses c ON c.course_code = e.course_code
            LEFT JOIN professors p ON p.professor_id = c.professor_id
            LEFT JOIN course_sections s ON s.section_id = e.section_id
            WHERE e.student_id = :student_id
            ORDER BY e.join_date DESC
            """
        ),
        {"student_id": student_id},
    ).mappings().all()

    courses = [
        {
            "course_code": str(row["course_code"]),
            "course_name": str(row["course_name"]),
            "is_active": bool(row["is_active"]),
            "professor_id": str(row["professor_id"]),
            "professor_name": str(row["professor_name"] or row["professor_id"]),
            "professor_full_name": str(
                row["professor_full_name"] or row["professor_name"] or row["professor_id"]
            ),
            "section_id": str(row["section_id"]) if row["section_id"] else None,
            "section_code": str(row["section_code"]) if row["section_code"] else None,
            "join_date": serialize_datetime(row["join_date"]),
        }
        for row in rows
    ]
    return {"courses": courses}


@app.get("/students/{student_id}/courses/{course_code}/board")
def get_student_course_board(
    student_id: str,
    course_code: str,
    db: Session = Depends(get_db),
) -> dict[str, object]:
    """Return the active board and course summary for one enrolled student course."""
    student = require_student(db=db, student_id=student_id)
    normalized_course_code = course_code.strip().upper()

    course = db.execute(
        text(
            """
            SELECT
                c.course_code,
                c.course_name,
                COALESCE(p.nickname, c.professor_id) AS professor_name,
                COALESCE(p.full_name, p.nickname, c.professor_id) AS professor_full_name,
                e.section_id,
                s.section_code
            FROM enrollments e
            JOIN courses c ON c.course_code = e.course_code
            LEFT JOIN professors p ON p.professor_id = c.professor_id
            LEFT JOIN course_sections s ON s.section_id = e.section_id
            WHERE e.student_id = :student_id
              AND c.course_code = :course_code
            LIMIT 1
            """
        ),
        {
            "student_id": student_id,
            "course_code": normalized_course_code,
        },
    ).mappings().first()

    if course is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found for this student",
        )

    active_board = db.execute(
        text(
            """
            SELECT
                b.board_id,
                b.board_title,
                b.section_id,
                s.section_code,
                b.status,
                b.created_at,
                COUNT(q.question_id) AS total_questions,
                SUM(CASE WHEN q.status = 'answered' THEN 1 ELSE 0 END) AS answered_questions,
                SUM(CASE WHEN q.status = 'pending' THEN 1 ELSE 0 END) AS unanswered_questions
            FROM interaction_boards b
            LEFT JOIN course_sections s ON s.section_id = b.section_id
            LEFT JOIN questions q
                ON q.board_id = b.board_id
               AND q.status <> 'deleted'
            WHERE b.course_code = :course_code
              AND (
                    (:section_id IS NULL AND b.section_id IS NULL)
                 OR b.section_id = :section_id
              )
              AND b.status = 'active'
            GROUP BY b.board_id, b.section_id, s.section_code, b.status, b.created_at
            ORDER BY b.created_at DESC
            LIMIT 1
            """
        ),
        {
            "course_code": normalized_course_code,
            "section_id": str(course["section_id"]) if course["section_id"] else None,
        },
    ).mappings().first()

    

    return {
        "student": {
            "id": student.user_id,
            "name": student.nickname,
        },
        "course": {
            "course_code": str(course["course_code"]),
            "course_name": str(course["course_name"]),
            "professor_name": str(course["professor_name"]),
            "professor_full_name": str(course["professor_full_name"]),
            "section_id": str(course["section_id"]) if course["section_id"] else None,
            "section_code": str(course["section_code"]) if course["section_code"] else None,
        },
        "active_board": (
            {
                "board_id": str(active_board["board_id"]),
                "board_title": str(active_board["board_title"] or active_board["board_id"]),
                "section_id": str(active_board["section_id"]) if active_board["section_id"] else None,
                "section_code": str(active_board["section_code"]) if active_board["section_code"] else None,
                "status": str(active_board["status"]).upper(),
                "created_at": serialize_datetime(active_board["created_at"]),
                "total_questions": int(active_board["total_questions"] or 0),
                "answered_questions": int(active_board["answered_questions"] or 0),
                "unanswered_questions": int(active_board["unanswered_questions"] or 0),
            }
            if active_board
            else None
        ),
    }


@app.post(
    "/students/{student_id}/courses/join",
    response_model=EnrollmentResponse,
    status_code=status.HTTP_201_CREATED,
)
def join_student_course(
    student_id: str,
    payload: EnrollmentCreate,
    db: Session = Depends(get_db),
) -> EnrollmentResponse:
    """Enroll a student into a course by a timed join code."""
    # TODO: Re-enable JWT security
    resolved_student_id = (payload.student_id or student_id).strip()
    student = require_student(db=db, student_id=resolved_student_id)

    enrollment_data = EnrollmentCreate(
        student_id=resolved_student_id,
        join_code=payload.join_code,
    )
    enrollment = EnrollmentManager.enroll_student(
        db=db,
        enrollment_data=enrollment_data,
        student=student,
    )
    course_row = db.execute(
        text(
            """
            SELECT
                c.course_name,
                s.section_code
            FROM enrollments e
            JOIN courses c ON c.course_code = e.course_code
            LEFT JOIN course_sections s ON s.section_id = e.section_id
            WHERE e.enrollment_id = :enrollment_id
            LIMIT 1
            """
        ),
        {"enrollment_id": enrollment.enrollment_id},
    ).mappings().first()
    return EnrollmentResponse(
        enrollment_id=enrollment.enrollment_id,
        student_id=enrollment.student_id,
        course_code=enrollment.course_code,
        section_id=enrollment.section_id,
        section_code=str(course_row["section_code"]) if course_row and course_row["section_code"] else None,
        course_name=str(course_row["course_name"]) if course_row and course_row["course_name"] else None,
        join_date=enrollment.join_date,
    )


@app.get("/students/{student_id}/questions")
def get_student_questions(
    student_id: str,
    scope: str = Query(default="all", pattern="^(all|mine)$"),
    course_code: str | None = Query(default=None),
    section_code: str | None = Query(default=None),
    status_filter: str = Query(default="all", alias="status"),
    search: str | None = Query(default=None),
    tag: str | None = Query(default=None),
    db: Session = Depends(get_db),
) -> dict[str, list[dict[str, object | str | bool | None]]]:
    """Return questions for student feed pages."""
    require_student(db=db, student_id=student_id)
    supports_title = has_table_column(db=db, table_name="questions", column_name="title")

    normalized_course_code = course_code.strip().upper() if course_code else None
    normalized_section_code = section_code.strip().upper() if section_code else None
    normalized_search = search.strip().lower() if search else None
    normalized_status_filter = status_filter.strip().lower()
    normalized_tag = tag.strip() if tag else None
    title_select = "q.title AS title" if supports_title else "q.content AS title"
    title_search_term = "q.title," if supports_title else ""
    supports_tags = has_table_column(db=db, table_name="questions", column_name="tags")
    tags_select = "q.tags" if supports_tags else "NULL AS tags"

    base_query = """
        SELECT
            q.question_id,
            COALESCE(b.course_code, q.course_code) AS course_code,
            c.course_name,
            {title_select},
            q.content,
            q.reply_content,
            q.status,
            q.is_anonymous,
            {tags_select},
            q.created_at,
            q.updated_at,
            COALESCE(b.section_id, q.section_id) AS section_id,
            s.section_code,
            u.user_id AS author_id,
            u.nickname AS author_name,
            u.full_name AS author_full_name
        FROM questions q
        LEFT JOIN interaction_boards b ON b.board_id = q.board_id
        LEFT JOIN courses c ON c.course_code = COALESCE(b.course_code, q.course_code)
        LEFT JOIN course_sections s ON s.section_id = COALESCE(b.section_id, q.section_id)
        JOIN users u ON u.user_id = q.student_id
    """.format(title_select=title_select, tags_select=tags_select)

    params: dict[str, str] = {"student_id": student_id}
    where_clauses = ["q.status <> 'deleted'"]

    if scope == "mine":
        where_clauses.append("q.student_id = :student_id")
    else:
        base_query += """
            JOIN enrollments e
                ON e.course_code = COALESCE(b.course_code, q.course_code)
                AND e.student_id = :student_id
        """
        where_clauses.append(
            """
            (
                (e.section_id IS NULL AND COALESCE(b.section_id, q.section_id) IS NULL)
                OR COALESCE(b.section_id, q.section_id) = e.section_id
            )
            """
        )

    if normalized_course_code:
        where_clauses.append("COALESCE(b.course_code, q.course_code) = :course_code")
        params["course_code"] = normalized_course_code

    if normalized_section_code:
        where_clauses.append("s.section_code = :section_code")
        params["section_code"] = normalized_section_code

    if normalized_status_filter in {"answered", "unanswered", "pending"}:
        where_clauses.append("q.status = :status")
        params["status"] = (
            "answered" if normalized_status_filter == "answered" else "pending"
        )

    if normalized_search:
        where_clauses.append(
            """
            LOWER(
                CONCAT_WS(
                    ' ',
                    {title_search_term}
                    q.content,
                    COALESCE(u.nickname, ''),
                    COALESCE(c.course_name, ''),
                    b.course_code
                )
            ) LIKE :search
            """
            .format(title_search_term=title_search_term)
        )
        params["search"] = f"%{normalized_search}%"

    if normalized_tag and supports_tags:
        where_clauses.append("JSON_CONTAINS(q.tags, CAST(:tag_json AS JSON))")
        params["tag_json"] = json.dumps(normalized_tag)

    query = f"""
        {base_query}
        WHERE {' AND '.join(where_clauses)}
        ORDER BY q.created_at DESC
    """
    rows = db.execute(text(query), params).mappings().all()
    question_ids = [str(row["question_id"]) for row in rows]
    replies_map = get_question_replies_map(db=db, question_ids=question_ids)

    status_map = {
        "pending": "UNANSWERED",
        "answered": "ANSWERED",
        "deleted": "DELETED",
    }
    questions = [
        {
            "id": str(row["question_id"]),
            "course_code": str(row["course_code"]),
            "course_name": str(row["course_name"]),
            "title": str(row["title"]),
            "content": str(row["content"]),
            "reply_content": None
            if row["reply_content"] is None
            else str(row["reply_content"]),
            "status": status_map.get(str(row["status"]).lower(), "UNANSWERED"),
            "is_anonymous": bool(row["is_anonymous"]),
            "tags": serialize_tags(row["tags"]),
            "created_at": serialize_datetime(row["created_at"]),
            "updated_at": serialize_datetime(row["updated_at"]),
            "section_id": str(row["section_id"]) if row["section_id"] else None,
            "section_code": str(row["section_code"]) if row["section_code"] else None,
            "author_id": str(row["author_id"]),
            "author_name": str(row["author_name"]),
            "author_full_name": str(
                row["author_full_name"] or row["author_name"] or row["author_id"]
            ),
            "replies": replies_map.get(str(row["question_id"]), []),
        }
        for row in rows
    ]
    return {"questions": questions}


@app.get("/api/courses/{course_code}/questions/search")
def search_course_questions(
    course_code: str,
    q: str | None = Query(default=None),
    status_filter: str = Query(default="all", alias="status"),
    tag: str | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[dict[str, object]]:
    """Search and filter questions for a course the current user can access."""
    normalized_course_code = course_code.strip().upper()
    if not normalized_course_code:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="course_code is required",
        )

    if current_user.role == "professor":
        access_row = db.execute(
            text(
                """
                SELECT 1
                FROM courses
                WHERE course_code = :course_code
                  AND professor_id = :user_id
                LIMIT 1
                """
            ),
            {"course_code": normalized_course_code, "user_id": current_user.user_id},
        ).first()
    else:
        access_row = db.execute(
            text(
                """
                SELECT 1
                FROM enrollments
                WHERE course_code = :course_code
                  AND student_id = :user_id
                LIMIT 1
                """
            ),
            {"course_code": normalized_course_code, "user_id": current_user.user_id},
        ).first()

    if access_row is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Course is not accessible for this user",
        )

    supports_title = has_table_column(db=db, table_name="questions", column_name="title")
    supports_tags = has_table_column(db=db, table_name="questions", column_name="tags")
    title_select = "q.title AS title" if supports_title else "q.content AS title"
    title_search_term = "q.title," if supports_title else ""
    tags_select = "q.tags" if supports_tags else "NULL AS tags"
    normalized_status_filter = status_filter.strip().lower()
    normalized_search = (q or "").strip().lower()
    normalized_tag = tag.strip() if tag else None

    where_clauses = [
        "COALESCE(b.course_code, q.course_code) = :course_code",
        "q.status <> 'deleted'",
    ]
    params: dict[str, object] = {"course_code": normalized_course_code}

    if normalized_status_filter in {"answered", "unanswered", "pending"}:
        where_clauses.append("q.status = :status")
        params["status"] = (
            "answered" if normalized_status_filter == "answered" else "pending"
        )

    if normalized_search:
        where_clauses.append(
            """
            LOWER(
                CONCAT_WS(
                    ' ',
                    {title_search_term}
                    q.content,
                    COALESCE(u.nickname, ''),
                    COALESCE(c.course_name, ''),
                    b.course_code
                )
            ) LIKE :search
            """.format(title_search_term=title_search_term)
        )
        params["search"] = f"%{normalized_search}%"

    if normalized_tag and supports_tags:
        where_clauses.append("JSON_CONTAINS(q.tags, CAST(:tag_json AS JSON))")
        params["tag_json"] = json.dumps(normalized_tag)

    rows = db.execute(
        text(
            f"""
            SELECT
                q.question_id,
                {title_select},
                q.content,
                q.status,
                q.student_id,
                b.board_id,
                COALESCE(b.course_code, q.course_code) AS course_code,
                c.course_name,
                COALESCE(u.full_name, u.nickname, u.user_id) AS student_name,
                {tags_select},
                q.created_at,
                q.updated_at
            FROM questions q
            LEFT JOIN interaction_boards b ON b.board_id = q.board_id
            LEFT JOIN courses c ON c.course_code = COALESCE(b.course_code, q.course_code)
            JOIN users u ON u.user_id = q.student_id
            WHERE {' AND '.join(where_clauses)}
            ORDER BY q.created_at DESC
            """
        ),
        params,
    ).mappings().all()

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
            "tags": serialize_tags(row["tags"]),
            "created_at": serialize_datetime(row["created_at"]),
            "updated_at": serialize_datetime(row["updated_at"]),
        }
        for row in rows
    ]


@app.post("/students/{student_id}/questions", status_code=status.HTTP_201_CREATED)
def create_student_question(
    student_id: str,
    payload: CreateQuestionRequest,
    db: Session = Depends(get_db),
) -> dict[str, object]:
    """Create a new question inside an active course board."""
    student = require_student(db=db, student_id=student_id)
    supports_title = has_table_column(db=db, table_name="questions", column_name="title")
    normalized_course_code = payload.course_code.strip().upper()
    normalized_title = payload.title.strip()
    normalized_detail = (payload.detail or "").strip()
    content = normalized_detail or normalized_title
    tags = [
        tag.strip()
        for tag in payload.tags
        if isinstance(tag, str) and tag.strip()
    ]
    supports_tags = has_table_column(db=db, table_name="questions", column_name="tags")

    if not normalized_title or not content:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Question title/content cannot be empty",
        )

    enrollment = db.execute(
        text(
            """
            SELECT
                e.section_id,
                s.section_code
            FROM enrollments e
            LEFT JOIN course_sections s ON s.section_id = e.section_id
            WHERE e.student_id = :student_id
              AND e.course_code = :course_code
            """
        ),
        {
            "student_id": student_id,
            "course_code": normalized_course_code,
        },
    ).mappings().first()
    if enrollment is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Student is not enrolled in this course",
        )

    enrollment_section_id = str(enrollment["section_id"]) if enrollment["section_id"] else None
    enrollment_section_code = (
        str(enrollment["section_code"]).strip().upper()
        if enrollment["section_code"]
        else None
    )

    enrollment_section_id = enrollment["section_id"]

    if payload.section_code and enrollment_section_code != payload.section_code.strip().upper():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Student cannot post to a different section",
        )
    
    board = db.execute(
        text(
            """
            SELECT board_id
            FROM interaction_boards
            WHERE course_code = :course_code
              AND (
                    (:section_id IS NULL AND section_id IS NULL)
                 OR section_id = :section_id
              )
              AND status = 'active'
            ORDER BY created_at DESC
            LIMIT 1
            """
        ),
        {
            "course_code": normalized_course_code,
            "section_id": enrollment_section_id,
        },
    ).mappings().first()

    board_id = str(board["board_id"]) if board else None
    question_id = f"q_{uuid4().hex[:12]}"
    created_at = datetime.utcnow().isoformat()
    if supports_title:
        db.execute(
            text(
                """
                INSERT INTO questions (
                    question_id,
                    board_id,
                    course_code,
                    section_id,
                    student_id,
                    title,
                    content,
                    reply_content,
                    status,
                    is_anonymous,
                    participation_score,
                    tags
                ) VALUES (
                    :question_id,
                    :board_id,
                    :course_code,
                    :section_id,
                    :student_id,
                    :title,
                    :content,
                    NULL,
                    'pending',
                    :is_anonymous,
                    0,
                    :tags
                )
                """
            ),
            {
                "question_id": question_id,
                "board_id": board_id,
                "course_code": normalized_course_code,
                "section_id": enrollment_section_id,
                "student_id": student.user_id,
                "title": normalized_title,
                "content": content,
                "is_anonymous": payload.is_anonymous,
                "tags": json.dumps(tags) if supports_tags else None,
            },
        )
    else:
        db.execute(
            text(
                """
                INSERT INTO questions (
                    question_id,
                    board_id,
                    course_code,
                    section_id,
                    student_id,
                    content,
                    reply_content,
                    status,
                    is_anonymous,
                    participation_score,
                    tags
                ) VALUES (
                    :question_id,
                    :board_id,
                    :course_code,
                    :section_id,
                    :student_id,
                    :content,
                    NULL,
                    'pending',
                    :is_anonymous,
                    0,
                    :tags
                )
                """
            ),
            {
                "question_id": question_id,
                "board_id": board_id,
                "course_code": normalized_course_code,
                "section_id": enrollment_section_id,
                "student_id": student.user_id,
                "content": content,
                "is_anonymous": payload.is_anonymous,
                "tags": json.dumps(tags) if supports_tags else None,
            },
        )
    db.commit()

    return {
        "id": question_id,
        "course_code": normalized_course_code,
        "course_name": normalized_course_code,
        "section_id": enrollment_section_id,
        "section_code": enrollment_section_code,
        "title": normalized_title,
        "content": content,
        "reply_content": None,
        "status": "UNANSWERED",
        "is_anonymous": payload.is_anonymous,
        "tags": tags,
        "created_at": created_at,
        "updated_at": created_at,
        "author_id": student.user_id,
        "author_name": student.nickname,
    }




@app.patch("/students/{student_id}/questions/{question_id}")
def update_student_question(
    student_id: str,
    question_id: str,
    payload: UpdateQuestionRequest,
    db: Session = Depends(get_db),
) -> dict[str, str | bool | None]:
    """Allow a student to edit their own question."""
    student = require_student(db=db, student_id=student_id)
    supports_title = has_table_column(db=db, table_name="questions", column_name="title")

    question = db.execute(
        text(
            """
            SELECT
                q.question_id,
                q.student_id,
                q.status,
                COALESCE(b.course_code, q.course_code) AS course_code
            FROM questions q
            LEFT JOIN interaction_boards b ON b.board_id = q.board_id
            WHERE q.question_id = :question_id
            LIMIT 1
            """
        ),
        {"question_id": question_id},
    ).mappings().first()

    if question is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Question not found",
        )

    if str(question["student_id"]) != student.user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can edit only your own question",
        )

    normalized_status = str(question["status"]).strip().lower()
    if normalized_status == "deleted":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Deleted question cannot be edited",
        )

    normalized_title = payload.title.strip()
    normalized_detail = (payload.detail or "").strip()
    content = normalized_detail or normalized_title

    if supports_title:
        db.execute(
            text(
                """
                UPDATE questions
                SET title = :title,
                    content = :content,
                    updated_at = CURRENT_TIMESTAMP
                WHERE question_id = :question_id
                """
            ),
            {
                "title": normalized_title,
                "content": content,
                "question_id": question_id,
            },
        )
    else:
        db.execute(
            text(
                """
                UPDATE questions
                SET content = :content,
                    updated_at = CURRENT_TIMESTAMP
                WHERE question_id = :question_id
                """
            ),
            {
                "content": content,
                "question_id": question_id,
            },
        )
    db.commit()

    return {
        "id": question_id,
        "course_code": str(question["course_code"]),
        "course_name": str(question["course_code"]),
        "title": normalized_title,
        "content": content,
        "reply_content": None,
        "status": "ANSWERED" if normalized_status == "answered" else "UNANSWERED",
        "is_anonymous": False,
        "created_at": None,
        "updated_at": datetime.utcnow().isoformat(),
        "author_id": student.user_id,
        "author_name": student.nickname,
    }


@app.post(
    "/students/{student_id}/questions/{question_id}/replies",
    status_code=status.HTTP_201_CREATED,
)
def create_student_question_reply(
    student_id: str,
    question_id: str,
    payload: CreateQuestionReplyRequest,
    db: Session = Depends(get_db),
) -> dict[str, str | bool | None]:
    """Create a reply for a question in a course that the student joined."""
    student = require_student(db=db, student_id=student_id)
    content = payload.content.strip()
    if not content:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Reply content cannot be empty",
        )

    question = db.execute(
        text(
            """
            SELECT
                q.question_id,
                q.status,
                COALESCE(b.course_code, q.course_code) AS course_code
            FROM questions q
            LEFT JOIN interaction_boards b ON b.board_id = q.board_id
            JOIN enrollments e
                ON e.course_code = COALESCE(b.course_code, q.course_code)
                AND e.student_id = :student_id
            WHERE q.question_id = :question_id
            LIMIT 1
            """
        ),
        {
            "student_id": student_id,
            "question_id": question_id,
        },
    ).mappings().first()

    if question is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Question not found or not accessible",
        )

    if str(question["status"]).lower() == "deleted":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot reply to a deleted question",
        )

    reply_id = f"r_{uuid4().hex[:12]}"
    db.execute(
        text(
            """
            INSERT INTO question_replies (
                reply_id,
                question_id,
                user_id,
                content
            ) VALUES (
                :reply_id,
                :question_id,
                :user_id,
                :content
            )
            """
        ),
        {
            "reply_id": reply_id,
            "question_id": question_id,
            "user_id": student.user_id,
            "content": content,
        },
    )
    db.commit()

    created_at = datetime.utcnow().isoformat()
    return {
        "id": reply_id,
        "question_id": question_id,
        "author_id": student.user_id,
        "author_name": student.nickname,
        "is_professor": False,
        "content": content,
        "created_at": created_at,
        "updated_at": created_at,
    }


@app.get("/students/{student_id}/dashboard")
def get_student_dashboard(
    student_id: str,
    db: Session = Depends(get_db),
) -> dict[str, object]:
    """Return student dashboard summary from the database."""
    student = require_student(db=db, student_id=student_id)

    active_session = db.execute(
        text(
            """
            SELECT
                c.course_code,
                c.course_name,
                COALESCE(p.nickname, c.professor_id) AS professor_name,
                b.board_id,
                b.board_title,
                b.created_at
            FROM interaction_boards b
            JOIN enrollments e
              ON e.course_code = b.course_code
             AND (
                    (e.section_id IS NULL AND b.section_id IS NULL)
                 OR e.section_id = b.section_id
             )
            JOIN courses c ON c.course_code = e.course_code
            LEFT JOIN professors p ON p.professor_id = c.professor_id
            WHERE e.student_id = :student_id
              AND b.status = 'active'
            ORDER BY b.created_at DESC
            LIMIT 1
            """
        ),
        {"student_id": student_id},
    ).mappings().first()

    stats = db.execute(
        text(
            """
            SELECT
                COUNT(*) AS total,
                SUM(CASE WHEN status = 'answered' THEN 1 ELSE 0 END) AS answered,
                SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending
            FROM questions
            WHERE student_id = :student_id
              AND status <> 'deleted'
            """
        ),
        {"student_id": student_id},
    ).mappings().one()

    recent = db.execute(
        text(
            """
            SELECT content
            FROM questions
            WHERE student_id = :student_id
              AND status <> 'deleted'
            ORDER BY created_at DESC
            LIMIT 1
            """
        ),
        {"student_id": student_id},
    ).mappings().first()

    total_questions = int(stats["total"] or 0)
    answered_questions = int(stats["answered"] or 0)
    pending_questions = int(stats["pending"] or 0)
    (
        on_class_participation,
        opened_boards,
        participated_boards,
    ) = get_on_class_participation_stats(db=db, student_id=student_id)

    return {
        "student": {
            "id": student.user_id,
            "name": student.nickname,
        },
        "session": {
            "course_code": str(active_session["course_code"]) if active_session else "",
            "title": (
                f"{active_session['course_code']}: {active_session['course_name']}"
                if active_session
                else "No active board right now"
            ),
            "time": "-",
            "instructor": str(active_session["professor_name"]) if active_session else "-",
            "board_id": str(active_session["board_id"]) if active_session else "",
            "board_title": (
                str(active_session["board_title"] or active_session["board_id"])
                if active_session
                else ""
            ),
            "has_active_board": active_session is not None,
        },
        "stats": {
            "participation": on_class_participation,
            "on_class_participation": on_class_participation,
            "opened_boards": opened_boards,
            "participated_boards": participated_boards,
            "questions": total_questions,
            "answered": answered_questions,
            "pending": pending_questions,
        },
        "recent_question": str(recent["content"]) if recent else "",
    }


@app.get("/students/{student_id}/analytics")
def get_student_analytics(
    student_id: str,
    db: Session = Depends(get_db),
) -> dict[str, object]:
    """Return analytics summary for student screens."""
    student = require_student(db=db, student_id=student_id)

    stats = db.execute(
        text(
            """
            SELECT
                COUNT(*) AS total,
                SUM(CASE WHEN status = 'answered' THEN 1 ELSE 0 END) AS answered,
                SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending
            FROM questions
            WHERE student_id = :student_id
              AND status <> 'deleted'
            """
        ),
        {"student_id": student_id},
    ).mappings().one()

    course_activity_rows = db.execute(
        text(
            """
            SELECT
                e.course_code AS course_code,
                c.course_name AS course_name,
                COALESCE(q.total_questions, 0) AS total_questions,
                COALESCE(q.answered_questions, 0) AS answered_questions,
                COALESCE(bs.board_sessions_joined, 0) AS board_sessions_joined,
                COALESCE(r.total_replies, 0) AS total_replies,
                (
                    COALESCE(q.total_questions, 0) +
                    COALESCE(r.total_replies, 0)
                ) AS total_interactions
            FROM enrollments e
            JOIN courses c
              ON c.course_code = e.course_code
            LEFT JOIN (
                SELECT
                    COALESCE(b.course_code, q.course_code) AS course_code,
                    COUNT(*) AS total_questions,
                    SUM(CASE WHEN q.status = 'answered' THEN 1 ELSE 0 END) AS answered_questions
                FROM questions q
                LEFT JOIN interaction_boards b
                  ON b.board_id = q.board_id
                WHERE q.student_id = :student_id
                  AND q.status <> 'deleted'
                GROUP BY COALESCE(b.course_code, q.course_code)
            ) q
              ON q.course_code = e.course_code
            LEFT JOIN (
                SELECT
                    COALESCE(b.course_code, q.course_code) AS course_code,
                    COUNT(DISTINCT CASE WHEN q.board_id IS NOT NULL THEN q.board_id END) AS board_sessions_joined
                FROM questions q
                LEFT JOIN interaction_boards b
                  ON b.board_id = q.board_id
                WHERE q.student_id = :student_id
                  AND q.status <> 'deleted'
                GROUP BY COALESCE(b.course_code, q.course_code)
            ) bs
              ON bs.course_code = e.course_code
            LEFT JOIN (
                SELECT
                    COALESCE(b.course_code, q.course_code) AS course_code,
                    COUNT(*) AS total_replies
                FROM question_replies r
                JOIN questions q
                  ON q.question_id = r.question_id
                LEFT JOIN interaction_boards b
                  ON b.board_id = q.board_id
                WHERE r.user_id = :student_id
                GROUP BY COALESCE(b.course_code, q.course_code)
            ) r
              ON r.course_code = e.course_code
            WHERE e.student_id = :student_id
            ORDER BY e.join_date DESC, e.course_code ASC
            """
        ),
        {"student_id": student_id},
    ).mappings().all()

    activity_rows = db.execute(
        text(
            """
            SELECT WEEKDAY(created_at) AS weekday_idx, COUNT(*) AS total
            FROM questions
            WHERE student_id = :student_id
              AND status <> 'deleted'
            GROUP BY WEEKDAY(created_at)
            """
        ),
        {"student_id": student_id},
    ).mappings().all()

    chart_by_day = [0, 0, 0, 0, 0, 0, 0]
    for row in activity_rows:
        day_index = int(row["weekday_idx"])
        if 0 <= day_index <= 6:
            chart_by_day[day_index] = int(row["total"] or 0)

    total_questions = int(stats["total"] or 0)
    answered_questions = int(stats["answered"] or 0)
    pending_questions = int(stats["pending"] or 0)
    (
        on_class_participation,
        opened_boards,
        participated_boards,
    ) = get_on_class_participation_stats(db=db, student_id=student_id)

    return {
        "student": {
            "id": student.user_id,
            "name": student.nickname,
        },
        "stats": {
            "participation": on_class_participation,
            "on_class_participation": on_class_participation,
            "opened_boards": opened_boards,
            "participated_boards": participated_boards,
            "questions": total_questions,
            "answered": answered_questions,
            "unanswered": pending_questions,
            "board": opened_boards,
            "active_courses": len(course_activity_rows),
        },
        "chart": [
            {"day": "Mon", "value": chart_by_day[0]},
            {"day": "Tue", "value": chart_by_day[1]},
            {"day": "Wed", "value": chart_by_day[2]},
            {"day": "Thu", "value": chart_by_day[3]},
            {"day": "Fri", "value": chart_by_day[4]},
            {"day": "Sat", "value": chart_by_day[5]},
            {"day": "Sun", "value": chart_by_day[6]},
        ],
        "course_activity": [
            {
                "course_code": str(row["course_code"] or ""),
                "course_name": str(row["course_name"] or ""),
                "title": f"{row['course_code']}: {row['course_name']}",
                "total_questions": int(row["total_questions"] or 0),
                "answered_questions": int(row["answered_questions"] or 0),
                "board_sessions_joined": int(row["board_sessions_joined"] or 0),
                "total_replies": int(row["total_replies"] or 0),
                "total_interactions": int(row["total_interactions"] or 0),
            }
            for row in course_activity_rows
        ],
    }


@app.get("/professors/{professor_id}/questions")
def get_professor_questions(
    professor_id: str,
    course_code: str | None = Query(default=None),
    section_code: str | None = Query(default=None),
    status_filter: str = Query(default="all", alias="status"),
    search: str | None = Query(default=None),
    tag: str | None = Query(default=None),
    db: Session = Depends(get_db),
) -> dict[str, object]:
    """Return professor question feed split into student questions and board sessions."""
    # TODO: Re-enable JWT security
    professor = require_professor(db=db, professor_id=professor_id)
    feed = QuestionManager.get_professor_question_feed(
        db=db,
        professor_id=professor_id,
        course_code=course_code,
        section_code=section_code,
        status_filter=status_filter,
        search=search,
        tag=tag,
    )
    return {
        "professor": {
            "id": professor.user_id,
            "name": professor.nickname,
            "full_name": professor.full_name,
        },
        **feed,
    }


@app.get(
    "/professors/{professor_id}/courses/{course_code}/questions",
    response_model=CourseQuestionFeedResponse,
)
def get_course_question_feed(
    professor_id: str,
    course_code: str,
    search: str | None = Query(default=None),
    db: Session = Depends(get_db),
) -> CourseQuestionFeedResponse:
    """Return all student questions for one professor-owned course."""
    # TODO: Re-enable JWT security
    require_professor(db=db, professor_id=professor_id)
    return QuestionManager.get_course_feed(
        db=db,
        professor_id=professor_id,
        course_code=course_code,
        search=search,
    )


@app.post(
    "/professors/{professor_id}/courses/{course_code}/boards",
    status_code=status.HTTP_201_CREATED,
)
def create_professor_board_session(
    professor_id: str,
    course_code: str,
    section_code: str | None = Query(default=None),
    payload: CreateProfessorBoardRequest | None = None,
    db: Session = Depends(get_db),
) -> dict[str, str | None]:
    """Create a new board session for a professor's course."""
    require_professor(db=db, professor_id=professor_id)
    normalized_course_code = course_code.strip().upper()
    payload_section_code = payload.section_code if payload and payload.section_code else None
    resolved_section_code = payload_section_code or section_code
    normalized_section_code = resolved_section_code.strip().upper() if resolved_section_code else None
    board_title = (payload.board_title if payload else "").strip()
    force_close_existing = bool(payload.force_close_existing) if payload else False

    if not normalized_section_code:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please select a section before opening a board",
        )
    if not board_title:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Board title is required",
        )

    course = db.execute(
        text(
            """
            SELECT course_code, course_name
            FROM courses
            WHERE course_code = :course_code
              AND professor_id = :professor_id
            LIMIT 1
            """
        ),
        {
            "course_code": normalized_course_code,
            "professor_id": professor_id,
        },
    ).mappings().first()
    if course is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found for this professor",
        )

    section_id: str | None = None
    if normalized_section_code:
        section = db.execute(
            text(
                """
                SELECT section_id, section_code
                FROM course_sections
                WHERE course_code = :course_code
                  AND section_code = :section_code
                LIMIT 1
                """
            ),
            {
                "course_code": normalized_course_code,
                "section_code": normalized_section_code,
            },
        ).mappings().first()
        if section is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Section not found for this course",
            )
        section_id = str(section["section_id"])

    existing_active_board = db.execute(
        text(
            """
            SELECT board_id, board_title
            FROM interaction_boards
            WHERE course_code = :course_code
              AND section_id = :section_id
              AND status = 'active'
            ORDER BY created_at DESC
            LIMIT 1
            """
        ),
        {
            "course_code": normalized_course_code,
            "section_id": section_id,
        },
    ).mappings().first()
    if existing_active_board and not force_close_existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Section already has an active board ({existing_active_board['board_id']})",
        )
    if existing_active_board and force_close_existing:
        db.execute(
            text(
                """
                UPDATE interaction_boards
                SET status = 'closed',
                    closed_at = CURRENT_TIMESTAMP
                WHERE board_id = :board_id
                """
            ),
            {"board_id": str(existing_active_board["board_id"])},
        )

    board_id = f"board_{uuid4().hex[:10]}"
    db.execute(
        text(
            """
            INSERT INTO interaction_boards (
                board_id,
                course_code,
                section_id,
                board_title,
                opened_by,
                status
            )
            VALUES (
                :board_id,
                :course_code,
                :section_id,
                :board_title,
                :opened_by,
                'active'
            )
            """
        ),
        {
            "board_id": board_id,
            "course_code": normalized_course_code,
            "section_id": section_id,
            "board_title": board_title,
            "opened_by": professor_id,
        },
    )
    db.commit()

    return {
        "board_id": board_id,
        "course_code": normalized_course_code,
        "course_name": str(course["course_name"]),
        "section_code": normalized_section_code,
        "board_title": board_title,
        "status": "ACTIVE",
    }


@app.patch(
    "/professors/{professor_id}/boards/{board_id}/close",
    status_code=status.HTTP_200_OK,
)
def close_professor_board_session(
    professor_id: str,
    board_id: str,
    db: Session = Depends(get_db),
) -> dict[str, str | None]:
    """Close an active board session owned by the professor."""
    require_professor(db=db, professor_id=professor_id)
    board = db.execute(
        text(
            """
            SELECT
                b.board_id,
                b.course_code,
                b.section_id,
                s.section_code,
                b.board_title,
                b.status
            FROM interaction_boards b
            JOIN courses c ON c.course_code = b.course_code
            LEFT JOIN course_sections s ON s.section_id = b.section_id
            WHERE b.board_id = :board_id
              AND c.professor_id = :professor_id
            LIMIT 1
            """
        ),
        {
            "board_id": board_id,
            "professor_id": professor_id,
        },
    ).mappings().first()
    if board is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Board not found for this professor",
        )
    if str(board["status"]).lower() == "closed":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Board is already closed",
        )

    db.execute(
        text(
            """
            UPDATE interaction_boards
            SET status = 'closed',
                closed_at = CURRENT_TIMESTAMP
            WHERE board_id = :board_id
            """
        ),
        {"board_id": board_id},
    )
    db.commit()

    return {
        "board_id": str(board["board_id"]),
        "course_code": str(board["course_code"]),
        "section_code": str(board["section_code"]) if board["section_code"] else None,
        "board_title": str(board["board_title"]) if board["board_title"] else None,
        "status": "CLOSED",
    }


@app.patch(
    "/professors/{professor_id}/questions/{question_id}/status",
    response_model=QuestionStatusResponse,
)
def update_professor_question_status(
    professor_id: str,
    question_id: str,
    payload: ProfessorQuestionStatusUpdate,
    db: Session = Depends(get_db),
) -> QuestionStatusResponse:
    """Allow professor to mark a question answered or unanswered."""
    # TODO: Re-enable JWT security
    require_professor(db=db, professor_id=professor_id)
    return QuestionManager.update_question_status(
        db=db,
        professor_id=professor_id,
        question_id=question_id,
        status_value=payload.status,
    )


@app.delete(
    "/professors/{professor_id}/questions/{question_id}",
    response_model=QuestionDeleteResponse,
)
def delete_professor_question(
    professor_id: str,
    question_id: str,
    db: Session = Depends(get_db),
) -> QuestionDeleteResponse:
    """Allow professor to soft-delete a question in their own course."""
    # TODO: Re-enable JWT security
    require_professor(db=db, professor_id=professor_id)
    return QuestionManager.delete_question_for_professor(
        db=db,
        professor_id=professor_id,
        question_id=question_id,
    )


@app.post(
    "/professors/{professor_id}/questions/{question_id}/replies",
    status_code=status.HTTP_201_CREATED,
)
def create_professor_question_reply(
    professor_id: str,
    question_id: str,
    payload: CreateProfessorReplyRequest,
    db: Session = Depends(get_db),
) -> dict[str, str | bool | None]:
    """Allow professor to reply to questions in their own courses."""
    professor = require_professor(db=db, professor_id=professor_id)
    content = payload.content.strip()
    if not content:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Reply content cannot be empty",
        )

    question = db.execute(
        text(
            """
            SELECT q.question_id
            FROM questions q
            LEFT JOIN interaction_boards b ON b.board_id = q.board_id
            JOIN courses c ON c.course_code = COALESCE(b.course_code, q.course_code)
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

    reply_id = f"r_{uuid4().hex[:12]}"
    db.execute(
        text(
            """
            INSERT INTO question_replies (
                reply_id,
                question_id,
                user_id,
                content
            ) VALUES (
                :reply_id,
                :question_id,
                :user_id,
                :content
            )
            """
        ),
        {
            "reply_id": reply_id,
            "question_id": question_id,
            "user_id": professor.user_id,
            "content": content,
        },
    )
    db.execute(
        text(
            """
            UPDATE questions
            SET status = 'answered',
                updated_at = CURRENT_TIMESTAMP
            WHERE question_id = :question_id
            """
        ),
        {"question_id": question_id},
    )
    db.commit()

    created_at = datetime.utcnow().isoformat()
    return {
        "id": reply_id,
        "question_id": question_id,
        "author_id": professor.user_id,
        "author_name": professor.nickname,
        "author_full_name": professor.full_name or professor.nickname or professor.user_id,
        "is_professor": True,
        "content": content,
        "created_at": created_at,
        "updated_at": created_at,
    }
