import re
from typing import Literal

from pydantic import BaseModel, Field, field_validator

ContactCategory = Literal["question", "bug", "billing", "suggestion", "other"]
_EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


class ContactRequest(BaseModel):
    category: ContactCategory = "question"
    subject: str = Field(min_length=3, max_length=120)
    message: str = Field(min_length=10, max_length=4000)

    @field_validator("subject", "message")
    @classmethod
    def _strip(cls, value: str) -> str:
        return value.strip()


class PublicContactRequest(ContactRequest):
    """Visiteur non connecté : nom et e-mail demandés ; `website` est un piège à robots (doit rester vide)."""

    name: str = Field(min_length=2, max_length=80)
    email: str = Field(max_length=254)
    website: str = Field(default="", max_length=200)

    @field_validator("name")
    @classmethod
    def _strip_name(cls, value: str) -> str:
        return value.strip()

    @field_validator("email")
    @classmethod
    def _valid_email(cls, value: str) -> str:
        email = value.strip()
        if not _EMAIL_RE.match(email):
            raise ValueError("כתובת אימייל לא תקינה")
        return email


class ContactResponse(BaseModel):
    sent: bool = True
