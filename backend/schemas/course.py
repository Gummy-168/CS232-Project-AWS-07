from __future__ import annotations

"""Pydantic schemas for course operations."""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class CourseCreate(BaseModel):
    """Request schema for creating a course."""

    course_code: str = Field(min_length=1, max_length=50)
    course_name: str = Field(min_length=1, max_length=255)
    professor_id: str | None = Field(default=None, min_length=1, max_length=50)
    is_active: bool = True


class CourseResponse(BaseModel):
    """Response schema for course data."""

    model_config = ConfigDict(from_attributes=True)

    course_code: str
    course_name: str
    professor_id: str
    is_active: bool
    created_at: datetime
