from apscheduler.schedulers.background import BackgroundScheduler

from app.services.notification_service import (
    send_daily_pending_classification_reminders,
    send_monthly_reports,
)
from app.services.persona_service import run_weekly_persona_update
from app.services.weekly_aggregation_service import run_full_aggregation
from app.models.database import SessionLocal

scheduler = BackgroundScheduler(timezone="UTC")


def start_scheduler() -> None:
    if scheduler.running:
        return

    # Run reminder checks every hour; each transaction is reminded at most once per day.
    scheduler.add_job(
        send_daily_pending_classification_reminders,
        trigger="interval",
        hours=1,
        id="daily_classification_reminders",
        replace_existing=True,
    )

    # Generate monthly report notifications on the first day of every month.
    scheduler.add_job(
        send_monthly_reports,
        trigger="cron",
        day=1,
        hour=2,
        minute=0,
        id="monthly_report_notifications",
        replace_existing=True,
    )

    # Weekly persona tracker update (runs Sunday night)
    def wrapped_persona_update():
        db = SessionLocal()
        try:
            run_weekly_persona_update(db)
        finally:
            db.close()
            
    scheduler.add_job(
        wrapped_persona_update,
        trigger="cron",
        day_of_week="sun",
        hour=23,
        minute=55,
        id="weekly_persona_tracker",
        replace_existing=True,
    )

    # Weekly transaction aggregation into UserWeeklyFeatures (runs Monday 1am)
    def wrapped_aggregation():
        db = SessionLocal()
        try:
            run_full_aggregation(db)
        finally:
            db.close()

    scheduler.add_job(
        wrapped_aggregation,
        trigger="cron",
        day_of_week="mon",
        hour=1,
        minute=0,
        id="weekly_features_aggregation",
        replace_existing=True,
    )

    scheduler.start()


def stop_scheduler() -> None:
    if scheduler.running:
        scheduler.shutdown(wait=False)
