from __future__ import annotations

"""Notification service for the Classroom Q&A System."""

from collections import defaultdict

from models.course import Course
from models.question import Question


class NotificationService:
    """Handles system notifications."""

    def __init__(self) -> None:
        self._notification_list: dict[str, list[str]] = defaultdict(list)
        self._unread_counts: dict[str, int] = defaultdict(int)

    def get_unread_count(self, user_id: str) -> int:
        """Return the unread notification count for a user."""
        return self._unread_counts[user_id]

    def get_unread_notification_count(self, user_id: str) -> int:
        """Keep compatibility with the older method name."""
        return self.get_unread_count(user_id)

    def dispatch_notification(
        self,
        target_user_id: str,
        message: str,
        notif_type: str = "general",
    ) -> None:
        """Dispatch a notification to a user."""
        if not self.validate_notification_target(target_user_id):
            raise ValueError(f"Invalid notification target: {target_user_id}")

        cleaned_message = message.strip()
        if not cleaned_message:
            raise ValueError("Notification message cannot be empty.")

        full_message = f"[{notif_type}] {cleaned_message}"
        self._notification_list[target_user_id].append(full_message)
        self._unread_counts[target_user_id] += 1

    def validate_notification_target(self, user_id: str) -> bool:
        """Validate whether a notification target is allowed."""
        return len(user_id.strip()) > 0

    def notify_new_question(self, question: Question) -> None:
        """Notify users about a new question."""
        if question.board is None or question.board.course is None:
            return

        self.dispatch_notification(
            question.board.course.professor_id,
            f"New question posted in course {question.board.course_code}: {question.content}",
            "new_question",
        )

    def notify_new_reply(self, question: Question) -> None:
        """Notify users about a new reply."""
        if not question.reply_content:
            return

        self.dispatch_notification(
            question.student_id,
            f"Your question #{question.question_id} has a new reply.",
            "reply",
        )

    def notify_course_status_change(self, course: Course) -> None:
        """Notify users about a course status change."""
        self.dispatch_notification(
            course.professor_id,
            f"Course {course.course_code} is now {'active' if course.is_active else 'inactive'}.",
            "course_status",
        )

    @property
    def notification_list(self) -> dict[str, list[str]]:
        """Expose a copy of stored notifications."""
        return {
            user_id: list(messages)
            for user_id, messages in self._notification_list.items()
        }
