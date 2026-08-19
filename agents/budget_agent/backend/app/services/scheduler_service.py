from apscheduler.schedulers.background import BackgroundScheduler

from app.services.notification_service import (
    send_daily_pending_classification_reminders,
    send_monthly_reports,
)

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

    scheduler.start()


def stop_scheduler() -> None:
    if scheduler.running:
        scheduler.shutdown(wait=False)
