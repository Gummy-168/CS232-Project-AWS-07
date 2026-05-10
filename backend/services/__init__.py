from __future__ import annotations

"""Service package for the Classroom Q&A System."""

from .analytics import AnalyticsManager
from .board_manager import BoardManager
from .course_manager import CourseManager
from .enrollment_manager import EnrollmentManager
from .notification import NotificationService
from .question_manager import QuestionManager
from .search import FeedAndSearchManager
from .user_manager import UserManager

__all__ = [
    "UserManager",
    "CourseManager",
    "EnrollmentManager",
    "BoardManager",
    "QuestionManager",
    "AnalyticsManager",
    "FeedAndSearchManager",
    "NotificationService",
]
