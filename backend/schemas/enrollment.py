from __future__ import annotations

"""Pydantic schemas for enrollment operations."""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class EnrollmentCreate(BaseModel):
    """Request schema for joining a course."""

    student_id: str | None = Field(default=None, min_length=1, max_length=50)
    join_code: str = Field(min_length=1, max_length=20)


class EnrollmentResponse(BaseModel):
    """Response schema for enrollment data."""

    model_config = ConfigDict(from_attributes=True)

    enrollment_id: int
    student_id: str
    course_code: str
    section_id: str | None = None
    section_code: str | None = None
    course_name: str | None = None
    message: str | None = None
    join_date: datetime
