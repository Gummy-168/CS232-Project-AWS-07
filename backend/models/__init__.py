from __future__ import annotations

"""Model package for the Classroom Q&A System."""

from .board import InteractionBoard
from .course import Course
from .course_section import CourseSection
from .enrollment import Enrollment
from .professor import Professor
from .question import Question
from .user import User

__all__ = [
    "User",
    "Professor",
    "Course",
    "CourseSection",
    "Enrollment",
    "InteractionBoard",
    "Question",
]
