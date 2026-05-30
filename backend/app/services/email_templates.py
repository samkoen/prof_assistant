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


def verification_email_html(*, app_name: str, full_name: str, verify_url: str) -> str:
    safe_name = html.escape((full_name or "").strip() or "משתמש")
    safe_app = html.escape(app_name)
    safe_url = html.escape(verify_url)
    return f"""<!DOCTYPE html>
<html dir="rtl" lang="he" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <style type="text/css">{_EMAIL_STYLES}</style>
</head>
<body style="margin:0;padding:0;direction:rtl;text-align:right;background:#f4f6f8;">
  <table class="wrapper" role="presentation" width="100%" cellpadding="0" cellspacing="0"
    dir="rtl" style="direction:rtl;text-align:right;background:#f4f6f8;">
    <tr>
      <td align="right" style="direction:rtl;text-align:right;padding:24px 16px;">
        <table class="card" role="presentation" width="100%" cellpadding="0" cellspacing="0"
          dir="rtl" style="max-width:520px;margin:0 auto;background:#fff;border-radius:8px;
          border:1px solid #e0e4e8;direction:rtl;">
          <tr>
            <td class="content" dir="rtl" align="right"
              style="padding:28px 32px;font-family:'Segoe UI',Arial,sans-serif;
              font-size:16px;line-height:1.65;color:#1a1a1a;direction:rtl;text-align:right;">
              <p class="greeting" style="margin:0 0 16px;font-size:18px;font-weight:600;
                text-align:right;direction:rtl;">שלום {safe_name},</p>
              <p class="para" style="margin:0 0 14px;text-align:right;direction:rtl;">
                תודה שנרשמת ל־<strong>{safe_app}</strong>.
              </p>
              <p class="para" style="margin:0 0 14px;text-align:right;direction:rtl;">
                לאימות כתובת האימייל שלך, לחץ על הכפתור:
              </p>
              <table class="btn-wrap" role="presentation" cellpadding="0" cellspacing="0"
                dir="rtl" style="margin:24px 0;text-align:right;direction:rtl;">
                <tr>
                  <td align="right" style="text-align:right;direction:rtl;">
                    <a href="{safe_url}" class="btn"
                      style="display:inline-block;padding:12px 28px;background:#1565c0;
                      color:#ffffff;text-decoration:none;border-radius:6px;
                      font-weight:600;font-size:16px;">אימות אימייל</a>
                  </td>
                </tr>
              </table>
              <p class="link-label" style="margin:20px 0 8px;font-size:14px;color:#555;
                text-align:right;direction:rtl;">
                אם הכפתור לא עובד, העתק את הקישור לדפדפן:
              </p>
              <div class="link-box" dir="ltr"
                style="direction:ltr;text-align:left;word-break:break-all;font-size:13px;
                color:#1565c0;background:#f5f8fc;border:1px solid #d0dce8;border-radius:4px;
                padding:12px 14px;margin:0 0 20px;">
                <a href="{safe_url}" style="color:#1565c0;text-decoration:none;">{safe_url}</a>
              </div>
              <p class="footer" style="margin:0;font-size:13px;color:#888;
                text-align:right;direction:rtl;">
                אם לא ביקשת הרשמה, ניתן להתעלם מהודעה זו.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""
