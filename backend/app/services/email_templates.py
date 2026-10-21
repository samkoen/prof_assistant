"""Modèles HTML des e-mails transactionnels (hébreu, RTL)."""

from __future__ import annotations

import html

_EMAIL_STYLES = """
  body, table, td { direction: rtl; text-align: right; }
  .wrapper { width: 100%; background-color: #f4f6f8; padding: 24px 0; }
  .card {
    max-width: 520px; margin: 0 auto; background: #ffffff;
    border-radius: 8px; border: 1px solid #e0e4e8;
  }
  .content { padding: 28px 32px; font-family: 'Segoe UI', Arial, sans-serif;
    font-size: 16px; line-height: 1.65; color: #1a1a1a; text-align: right; }
  .greeting { margin: 0 0 16px; font-size: 18px; font-weight: 600; }
  .para { margin: 0 0 14px; }
  .btn-wrap { margin: 24px 0; text-align: right; }
  .btn {
    display: inline-block; padding: 12px 28px;
    background-color: #1565c0; color: #ffffff !important;
    text-decoration: none; border-radius: 6px; font-weight: 600;
    font-size: 16px;
  }
  .link-label { margin: 20px 0 8px; font-size: 14px; color: #555; }
  .link-box {
    direction: ltr; text-align: left; word-break: break-all;
    font-size: 13px; color: #1565c0; background: #f5f8fc;
    border: 1px solid #d0dce8; border-radius: 4px; padding: 12px 14px;
    margin: 0 0 20px;
  }
  .footer { margin: 0; font-size: 13px; color: #888; }
"""


def _paragraphs_html(paragraphs: tuple[str, ...]) -> str:
    return "".join(
        f'<p style="margin:0 0 14px;text-align:right;direction:rtl;">{text}</p>'
        for text in paragraphs
    )


def _action_button(label: str, url: str) -> str:
    safe_url = html.escape(url, quote=True)
    safe_label = html.escape(label)
    return (
        '<table role="presentation" cellpadding="0" cellspacing="0" dir="rtl" '
        'style="margin:24px 0;direction:rtl;"><tr><td align="right">'
        f'<a href="{safe_url}" style="display:inline-block;padding:12px 28px;'
        "background:#1565c0;color:#ffffff;text-decoration:none;border-radius:6px;"
        f'font-weight:600;font-size:16px;">{safe_label}</a></td></tr></table>'
    )


def _link_box(url: str) -> str:
    safe_url = html.escape(url, quote=True)
    return (
        '<p style="margin:20px 0 8px;font-size:14px;color:#555;text-align:right;">'
        "אם הכפתור לא עובד, העתק את הקישור לדפדפן:</p>"
        '<div dir="ltr" style="direction:ltr;text-align:left;word-break:break-all;'
        "font-size:13px;color:#1565c0;background:#f5f8fc;border:1px solid #d0dce8;"
        'border-radius:4px;padding:12px 14px;margin:0 0 20px;">'
        f'<a href="{safe_url}" style="color:#1565c0;text-decoration:none;">{safe_url}</a></div>'
    )


def _rtl_action_email(
    *,
    greeting_name: str,
    paragraphs: tuple[str, ...],
    button_label: str,
    action_url: str,
    footer: str,
) -> str:
    name = html.escape((greeting_name or "").strip() or "משתמש")
    inner = (
        f'<p style="margin:0 0 16px;font-size:18px;font-weight:600;">שלום {name},</p>'
        f"{_paragraphs_html(paragraphs)}{_action_button(button_label, action_url)}"
        f"{_link_box(action_url)}"
        f'<p style="margin:0;font-size:13px;color:#888;">{html.escape(footer)}</p>'
    )
    return (
        '<!DOCTYPE html><html dir="rtl" lang="he"><head><meta charset="utf-8"/>'
        f"<style>{_EMAIL_STYLES}</style></head>"
        '<body style="margin:0;direction:rtl;background:#f4f6f8;">'
        '<table role="presentation" width="100%" dir="rtl" style="background:#f4f6f8;">'
        '<tr><td style="padding:24px 16px;"><table role="presentation" width="100%" dir="rtl" '
        'style="max-width:520px;margin:0 auto;background:#fff;border:1px solid #e0e4e8;">'
        '<tr><td dir="rtl" style="padding:28px 32px;font-family:Arial,sans-serif;'
        f'font-size:16px;line-height:1.65;color:#1a1a1a;text-align:right;">{inner}'
        "</td></tr></table></td></tr></table></body></html>"
    )


def verification_email_html(*, app_name: str, full_name: str, verify_url: str) -> str:
    safe_app = html.escape(app_name)
    return _rtl_action_email(
        greeting_name=full_name,
        paragraphs=(
            f"תודה שנרשמת ל־<strong>{safe_app}</strong>.",
            "לאימות כתובת האימייל שלך, לחץ על הכפתור:",
        ),
        button_label="אימות אימייל",
        action_url=verify_url,
        footer="אם לא ביקשת הרשמה, ניתן להתעלם מהודעה זו.",
    )


def password_reset_email_html(*, app_name: str, full_name: str, reset_url: str) -> str:
    safe_app = html.escape(app_name)
    return _rtl_action_email(
        greeting_name=full_name,
        paragraphs=(
            f"קיבלנו בקשה לאיפוס הסיסמה ב־<strong>{safe_app}</strong>.",
            "להגדרת סיסמה חדשה, לחץ על הכפתור:",
        ),
        button_label="איפוס סיסמה",
        action_url=reset_url,
        footer="אם לא ביקשת איפוס, ניתן להתעלם מהודעה זו. הקישור תקף לזמן מוגבל.",
    )


def _pre_block(text: str) -> str:
    safe = html.escape(text or "")
    return (
        f'<pre style="direction:ltr;text-align:left;white-space:pre-wrap;word-break:break-word;'
        f'font-size:12px;background:#f5f8fc;border:1px solid #d0dce8;border-radius:4px;'
        f'padding:12px 14px;margin:0 0 16px;">{safe}</pre>'
    )


def gemini_parse_error_email_html(
    *,
    app_name: str,
    exam_id: int,
    session_id: int,
    teacher_label: str,
    errors: list[str],
    prompt: str,
    raw_text: str,
) -> str:
    safe_app = html.escape(app_name)
    safe_teacher = html.escape(teacher_label)
    err_lines = "".join(
        f'<li style="margin:0 0 6px;">{html.escape(e)}</li>' for e in errors
    )
    return f"""<!DOCTYPE html>
<html dir="ltr" lang="en">
<head><meta charset="utf-8"/><title>Gemini parse error</title></head>
<body style="margin:0;padding:24px;font-family:'Segoe UI',Arial,sans-serif;font-size:14px;color:#1a1a1a;">
  <h2 style="margin:0 0 12px;font-size:18px;">{safe_app} — Gemini parse error</h2>
  <p style="margin:0 0 8px;"><strong>Exam:</strong> {exam_id} &nbsp;|&nbsp; <strong>Session:</strong> {session_id}</p>
  <p style="margin:0 0 16px;"><strong>Teacher:</strong> {safe_teacher}</p>
  <h3 style="margin:0 0 8px;font-size:15px;">Parse errors</h3>
  <ul style="margin:0 0 20px;padding-left:20px;">{err_lines}</ul>
  <h3 style="margin:0 0 8px;font-size:15px;">Last prompt sent to Gemini</h3>
  {_pre_block(prompt)}
  <h3 style="margin:0 0 8px;font-size:15px;">Gemini response (unparseable)</h3>
  {_pre_block(raw_text)}
</body>
</html>"""
