"""Chiffrement du jeton Moodle. La clé dérive du secret de l'application."""

from __future__ import annotations

import base64
import hashlib

from cryptography.fernet import Fernet, InvalidToken


class MoodleTokenError(Exception):
    """Jeton illisible (secret changé ou valeur corrompue)."""


def encrypt_token(secret: str, token: str) -> str:
    blob = _fernet(secret).encrypt(token.encode("utf-8"))
    return blob.decode("ascii")


def decrypt_token(secret: str, encrypted: str) -> str:
    try:
        raw = _fernet(secret).decrypt(encrypted.encode("ascii"))
    except (InvalidToken, ValueError) as exc:
        raise MoodleTokenError("unreadable token") from exc
    return raw.decode("utf-8")


def _fernet(secret: str) -> Fernet:
    digest = hashlib.sha256(secret.encode("utf-8")).digest()
    return Fernet(base64.urlsafe_b64encode(digest))
