from __future__ import annotations

"""Schema package for request and response models."""

from .course import CourseCreate, CourseResponse
from .enrollment import EnrollmentCreate, EnrollmentResponse
from .question import (
    CourseFeedQuestionResponse,
    CourseQuestionFeedResponse,
    ProfessorQuestionStatusUpdate,
    QuestionDeleteResponse,
    QuestionReplyResponse,
    QuestionStatusResponse,
)
from .user import TokenResponse, UserCreate, UserLogin

__all__ = [
    "UserLogin",
    "UserCreate",
    "TokenResponse",
    "CourseCreate",
    "CourseResponse",
    "EnrollmentCreate",
    "EnrollmentResponse",
    "QuestionReplyResponse",
    "CourseFeedQuestionResponse",
    "CourseQuestionFeedResponse",
    "ProfessorQuestionStatusUpdate",
    "QuestionStatusResponse",
    "QuestionDeleteResponse",
]
