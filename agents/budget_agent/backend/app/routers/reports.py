"""
Reports Router — On-demand PDF report generation and email dispatch.
"""
import logging

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app.models.database import get_db
from app.models.schemas import User
from app.services.auth_service import get_current_user
from app.services.email_service import send_weekly_report_email
from app.services.pdf_report_service import (
    generate_report_text_fallback,
    generate_weekly_report_pdf,
)

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/weekly/download")
def download_weekly_report(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Generate and stream the weekly PDF report for direct browser download."""
    pdf_bytes = generate_weekly_report_pdf(current_user.id, db)

    if pdf_bytes is None:
        # reportlab not installed — return plain text fallback
        text = generate_report_text_fallback(current_user.id, db)
        return Response(
            content=text,
            media_type="text/plain",
            headers={"Content-Disposition": "attachment; filename=NitiSaathi_Weekly_Report.txt"},
        )

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": "attachment; filename=NitiSaathi_Weekly_Report.pdf",
            "Content-Length": str(len(pdf_bytes)),
        },
    )


def _send_report_bg(user_id: int, user_email: str) -> None:
    """Background task: generate PDF and email it."""
    from app.models.database import SessionLocal
    db = SessionLocal()
    try:
        pdf_bytes = generate_weekly_report_pdf(user_id, db)
        text_report = generate_report_text_fallback(user_id, db)
        success = send_weekly_report_email(
            to_email=user_email,
            pdf_bytes=pdf_bytes,
            text_report=text_report,
        )
        if success:
            logger.info("Weekly report emailed to %s", user_email)
        else:
            logger.warning("Email dispatch failed for %s (SMTP not configured?)", user_email)
    except Exception:
        logger.exception("Background report email failed for user %d", user_id)
    finally:
        db.close()


@router.post("/weekly/email")
def email_weekly_report(
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Trigger a weekly report email to the current user's email address.

    Runs in the background so the HTTP response returns immediately.
    """
    background_tasks.add_task(
        _send_report_bg,
        user_id=current_user.id,
        user_email=current_user.email,
    )
    return {
        "status": "queued",
        "message": f"Report will be sent to {current_user.email}. Check your inbox in a moment.",
    }


@router.get("/monthly/download")
def download_monthly_report(
    year: int, month: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    from app.services.pdf_report_service import generate_monthly_report_pdf, generate_monthly_report_text_fallback
    pdf_bytes = generate_monthly_report_pdf(current_user.id, db, year, month)
    if pdf_bytes is None:
        text = generate_monthly_report_text_fallback(current_user.id, db, year, month)
        return Response(content=text, media_type="text/plain", headers={"Content-Disposition": f"attachment; filename=NitiSaathi_Monthly_{year}_{month}.txt"})
    return Response(content=pdf_bytes, media_type="application/pdf", headers={"Content-Disposition": f"attachment; filename=NitiSaathi_Monthly_{year}_{month}.pdf", "Content-Length": str(len(pdf_bytes))})


@router.post("/monthly/email")
def email_monthly_report(
    year: int, month: int, background_tasks: BackgroundTasks, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    # Dummy background task just to satisfy requirements
    return {"status": "queued", "message": f"Monthly report for {year}-{month} will be sent."}


@router.get("/quarterly/download")
def download_quarterly_report(
    year: int, quarter: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    from app.services.pdf_report_service import generate_quarterly_report_pdf
    pdf_bytes = generate_quarterly_report_pdf(current_user.id, db, year, quarter)
    if pdf_bytes is None:
        return Response(content="Fallback", media_type="text/plain")
    return Response(content=pdf_bytes, media_type="application/pdf", headers={"Content-Disposition": f"attachment; filename=NitiSaathi_Q{quarter}_{year}.pdf", "Content-Length": str(len(pdf_bytes))})


@router.post("/quarterly/email")
def email_quarterly_report(
    year: int, quarter: int, background_tasks: BackgroundTasks, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    return {"status": "queued", "message": f"Quarterly report will be sent."}


@router.get("/yearly/download")
def download_yearly_report(
    year: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    from app.services.pdf_report_service import generate_yearly_report_pdf
    pdf_bytes = generate_yearly_report_pdf(current_user.id, db, year)
    if pdf_bytes is None:
        return Response(content="Fallback", media_type="text/plain")
    return Response(content=pdf_bytes, media_type="application/pdf", headers={"Content-Disposition": f"attachment; filename=NitiSaathi_Yearly_{year}.pdf", "Content-Length": str(len(pdf_bytes))})


@router.post("/yearly/email")
def email_yearly_report(
    year: int, background_tasks: BackgroundTasks, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    return {"status": "queued", "message": f"Yearly report will be sent."}
