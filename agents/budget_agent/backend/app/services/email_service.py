"""
Email Service — Sends financial reports via SMTP.

Configuration is via environment variables:
  SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, SMTP_FROM_EMAIL

Falls back gracefully when SMTP is not configured (logs a warning).
"""
from __future__ import annotations

import logging
import smtplib
from email.mime.application import MIMEApplication
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Optional

from app.config import (
    SMTP_HOST,
    SMTP_PORT,
    SMTP_USER,
    SMTP_PASSWORD,
    SMTP_FROM_EMAIL,
)

logger = logging.getLogger(__name__)


def _smtp_configured() -> bool:
    return bool(SMTP_HOST and SMTP_PORT and SMTP_USER and SMTP_PASSWORD)


def send_email(
    to_email: str,
    subject: str,
    body_text: str,
    body_html: Optional[str] = None,
    attachment_bytes: Optional[bytes] = None,
    attachment_filename: str = "report.pdf",
) -> bool:
    """Send an email with optional PDF attachment.

    Returns True on success, False on failure.
    """
    if not _smtp_configured():
        logger.warning(
            "SMTP not configured — email to %s suppressed. "
            "Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD in .env",
            to_email,
        )
        return False

    msg = MIMEMultipart("mixed")
    msg["From"] = SMTP_FROM_EMAIL or SMTP_USER
    msg["To"] = to_email
    msg["Subject"] = subject

    # Body
    alt = MIMEMultipart("alternative")
    alt.attach(MIMEText(body_text, "plain", "utf-8"))
    if body_html:
        alt.attach(MIMEText(body_html, "html", "utf-8"))
    msg.attach(alt)

    # Attachment
    if attachment_bytes:
        part = MIMEApplication(attachment_bytes, Name=attachment_filename)
        part["Content-Disposition"] = f'attachment; filename="{attachment_filename}"'
        msg.attach(part)

    try:
        port = int(SMTP_PORT)
        if port == 465:
            server = smtplib.SMTP_SSL(SMTP_HOST, port, timeout=30)
        else:
            server = smtplib.SMTP(SMTP_HOST, port, timeout=30)
            server.ehlo()
            server.starttls()
            server.ehlo()

        server.login(SMTP_USER, SMTP_PASSWORD)
        server.sendmail(msg["From"], [to_email], msg.as_string())
        server.quit()

        logger.info("Email sent to %s: %s", to_email, subject)
        return True

    except Exception:
        logger.exception("Failed to send email to %s", to_email)
        return False


def send_weekly_report_email(
    to_email: str,
    pdf_bytes: Optional[bytes],
    text_report: str,
) -> bool:
    """Send the weekly financial report email with PDF attachment."""
    subject = "📊 Your NitiSaathi Weekly Financial Report"

    body_html = f"""
    <html>
    <body style="font-family: 'Segoe UI', sans-serif; background: #f8fafc; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; 
                    box-shadow: 0 2px 8px rgba(0,0,0,0.08); overflow: hidden;">
            <div style="background: linear-gradient(135deg, #6366f1, #ec4899); padding: 24px; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 22px;">NitiSaathi</h1>
                <p style="color: rgba(255,255,255,0.85); margin: 4px 0 0; font-size: 13px;">
                    Weekly Financial Report
                </p>
            </div>
            <div style="padding: 24px;">
                <p style="color: #334155; font-size: 14px; line-height: 1.6;">
                    Hi there! 👋<br><br>
                    Your weekly financial report is ready. 
                    {'Find the detailed PDF attached.' if pdf_bytes else ''}
                </p>
                <div style="background: #f1f5f9; border-radius: 8px; padding: 16px; margin: 16px 0;
                            font-family: monospace; font-size: 12px; white-space: pre-wrap; color: #475569;">
{text_report}
                </div>
                <p style="color: #94a3b8; font-size: 11px; text-align: center; margin-top: 24px;">
                    Powered by NitiSaathi Budget Agent
                </p>
            </div>
        </div>
    </body>
    </html>
    """

    return send_email(
        to_email=to_email,
        subject=subject,
        body_text=text_report,
        body_html=body_html,
        attachment_bytes=pdf_bytes,
        attachment_filename="NitiSaathi_Weekly_Report.pdf",
    )
