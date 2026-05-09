from __future__ import annotations

"""Pydantic schemas for question management."""

from datetime import datetime

from pydantic import BaseModel, Field


class QuestionReplyResponse(BaseModel):
    """Response schema for a question reply item."""

    id: str
    question_id: str
    author_id: str
    author_name: str
    is_professor: bool
    content: str
    created_at: str | None
    updated_at: str | None


class CourseFeedQuestionResponse(BaseModel):
    """Response schema for one question shown in a course feed."""

    id: str
    title: str
    content: str
    status: str
    student_id: str
    student_name: str
    course_code: str
    course_name: str
    board_id: str
    created_at: str | None
    updated_at: str | None
    replies: list[QuestionReplyResponse]


class CourseQuestionFeedResponse(BaseModel):
    """Response schema for a course-wide question feed."""

    professor_id: str
    course_code: str
    course_name: str
    questions: list[CourseFeedQuestionResponse]


class ProfessorQuestionStatusUpdate(BaseModel):
    """Request schema for professor changing question status."""

    status: str = Field(min_length=1, max_length=20)


class QuestionStatusResponse(BaseModel):
    """Response schema after a question status update."""

    question_id: str
    status: str


class QuestionDeleteResponse(BaseModel):
    """Response schema after deleting a question."""

    message: str
    question_id: str
