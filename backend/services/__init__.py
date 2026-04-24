from __future__ import annotations

"""Service package for the Classroom Q&A System."""

from .analytics import AnalyticsManager
from .notification import NotificationService
from .search import FeedAndSearchManager
from .user_manager import UserManager

__all__ = [
    "UserManager",
    "AnalyticsManager",
    "FeedAndSearchManager",
    "NotificationService",
]
