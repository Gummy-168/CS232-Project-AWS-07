from __future__ import annotations

"""User model for the Classroom Q&A System."""


class User:
    """Represents a user in the system."""

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
        self._role: str = role
        self._nickname: str = nickname
        pass

    @property
    def user_id(self) -> int:
        """Get the user identifier."""
        return self._user_id
        pass

    @user_id.setter
    def user_id(self, value: int) -> None:
        """Set the user identifier."""
        self._user_id = value
        pass

    @property
    def email(self) -> str:
        """Get the email address."""
        return self._email
        pass

    @email.setter
    def email(self, value: str) -> None:
        """Set the email address."""
        self._email = value
        pass

    @property
    def password_hash(self) -> str:
        """Get the password hash."""
        return self._password_hash
        pass

    @password_hash.setter
    def password_hash(self, value: str) -> None:
        """Set the password hash."""
        self._password_hash = value
        pass

    @property
    def role(self) -> str:
        """Get the user role."""
        return self._role
        pass

    @role.setter
    def role(self, value: str) -> None:
        """Set the user role."""
        self._role = value
        pass

    @property
    def nickname(self) -> str:
        """Get the nickname."""
        return self._nickname
        pass

    @nickname.setter
    def nickname(self, value: str) -> None:
        """Set the nickname."""
        self._nickname = value
        pass
