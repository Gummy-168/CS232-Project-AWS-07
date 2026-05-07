from __future__ import annotations

"""Schema package for request and response models."""

from .course import CourseCreate, CourseResponse
from .user import TokenResponse, UserCreate, UserLogin

__all__ = [
    "UserLogin",
    "UserCreate",
    "TokenResponse",
    "CourseCreate",
    "CourseResponse",
]
