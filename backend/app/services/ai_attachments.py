"""Fichiers joints à un appel IA (envoyés tels quels à Gemini, texte brut pour les autres fournisseurs)."""

import base64
from dataclasses import dataclass

_MIME_BY_SUFFIX = {".pdf": "application/pdf", ".txt": "text/plain", ".md": "text/plain"}


@dataclass(frozen=True)
class AiAttachment:
    filename: str
    mime_type: str
    data: bytes
    # Texte extrait : utilisé uniquement si le fournisseur ne sait pas lire le fichier.
    fallback_text: str = ""


def mime_type_for_suffix(suffix: str) -> str:
    return _MIME_BY_SUFFIX.get(suffix.lower(), "application/octet-stream")


def gemini_parts(attachments: list[AiAttachment]) -> list[dict]:
    """Parts `inlineData` de l'API Gemini (fichier complet, encodé en base64)."""
    return [
        {"inlineData": {"mimeType": a.mime_type, "data": base64.b64encode(a.data).decode("ascii")}}
        for a in attachments
    ]


def text_fallback_block(attachments: list[AiAttachment]) -> str:
    """Contenu texte des fichiers, pour un fournisseur sans lecture de fichiers."""
    sections = [f"### File: {a.filename}\n{a.fallback_text}" for a in attachments if a.fallback_text.strip()]
    if not sections:
        return ""
    return "Attached files (text content):\n\n" + "\n\n---\n\n".join(sections) + "\n\n"
