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


class CourseSectionCreate(BaseModel):
    """Request schema for creating a course section."""

    section_code: str = Field(min_length=1, max_length=50)
    meeting_days: list[str] = Field(default_factory=list)
    start_time: str = Field(min_length=1, max_length=5)
    end_time: str = Field(min_length=1, max_length=5)
    is_active: bool = True


class CourseSectionResponse(BaseModel):
    """Response schema for course section data."""

    model_config = ConfigDict(from_attributes=True)

    section_id: str
    course_code: str
    section_code: str
    meeting_days: list[str]
    start_time: str
    end_time: str
    is_active: bool
    created_at: datetime


class CourseJoinCodeCreate(BaseModel):
    """Request schema for generating a new timed join code."""

    section_code: str | None = Field(default=None, min_length=1, max_length=50)


class CourseJoinCodeResponse(BaseModel):
    """Response schema for one active or newly generated join code."""

    model_config = ConfigDict(from_attributes=True)

    join_code_id: str
    code: str
    course_code: str
    section_id: str | None = None
    section_code: str | None = None
    professor_id: str
    expires_at: datetime
    is_active: bool
    created_at: datetime


class DeleteArchiveSectionCounts(BaseModel):
    """Usage counts that drive section delete-or-archive decisions."""

    enrollments: int
    boards: int
    questions: int
    active_join_codes: int


class DeleteArchiveSectionResponse(BaseModel):
    """Response payload for a section delete-or-archive action."""

    action: str
    course_code: str
    section_code: str
    reason: str
    counts: DeleteArchiveSectionCounts


class DeleteArchiveCourseCounts(BaseModel):
    """Usage counts that drive course delete-or-archive decisions."""

    sections: int
    enrollments: int
    boards: int
    questions: int
    active_join_codes: int


class DeleteArchiveCourseResponse(BaseModel):
    """Response payload for a course delete-or-archive action."""

    action: str
    course_code: str
    reason: str
    counts: DeleteArchiveCourseCounts
