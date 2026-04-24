from __future__ import annotations

"""User model for the Classroom Q&A System."""


class User:
    """Represents a user in the system."""

    VALID_ROLES = {"student", "professor"}

    def __init__(
        self,
        user_id: int,
        email: str,
        password_hash: str,
        role: str,
        nickname: str,
    ) -> None:
        """Initialize a user instance."""
        self._user_id: int = user_id
        self._email: str = email
        self._password_hash: str = password_hash
        self._role: str = self._normalize_role(role)
        self._nickname: str = nickname

    @property
    def user_id(self) -> int:
        """Get the user identifier."""
        return self._user_id

    @user_id.setter
    def user_id(self, value: int) -> None:
        """Set the user identifier."""
        self._user_id = value

    @property
    def email(self) -> str:
        """Get the email address."""
        return self._email

    @email.setter
    def email(self, value: str) -> None:
        """Set the email address."""
        self._email = value

    @property
    def password_hash(self) -> str:
        """Get the password hash."""
        return self._password_hash

    @password_hash.setter
    def password_hash(self, value: str) -> None:
        """Set the password hash."""
        self._password_hash = value

    @property
    def role(self) -> str:
        """Get the user role."""
        return self._role

    @role.setter
    def role(self, value: str) -> None:
        """Set the user role."""
        self._role = self._normalize_role(value)

    @property
    def nickname(self) -> str:
        """Get the nickname."""
        return self._nickname

    @nickname.setter
    def nickname(self, value: str) -> None:
        """Set the nickname."""
        self._nickname = value

    def authenticate(self, password_hash: str) -> bool:
        """Check whether the stored password hash matches the given value."""
        return self.password_hash == password_hash

    def validate_profile_state(self) -> bool:
        """Validate whether the user profile is ready for use."""
        return all(
            [
                self.user_id > 0,
                bool(self.email.strip()),
                bool(self.password_hash.strip()),
                self.role in self.VALID_ROLES,
                bool(self.nickname.strip()),
            ]
        )

    @staticmethod
    def _normalize_role(role: str) -> str:
        """Normalize and validate a user role."""
        normalized_role = role.strip().lower()
        if normalized_role not in User.VALID_ROLES:
            raise ValueError(f"Unsupported user role: {role}")
        return normalized_role
