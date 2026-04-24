from __future__ import annotations

"""Notification service for the Classroom Q&A System."""

from models.course import Course
from models.question import Question


class NotificationService:
    """Handles system notifications."""

    def notify_new_question(self, question: Question) -> None:
        """Notify users about a new question."""
        pass

    def notify_new_reply(self, question: Question) -> None:
        """Notify users about a new reply."""
        pass

    def notify_course_status_change(self, course: Course) -> None:
        """Notify users about a course status change."""
        pass
