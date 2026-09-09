from apscheduler.schedulers.background import BackgroundScheduler

from app.services.notification_service import (
    send_daily_pending_classification_reminders,
    send_monthly_reports,
)
from app.services.persona_service import run_weekly_persona_update
from app.services.weekly_aggregation_service import run_full_aggregation
from app.models.database import SessionLocal
from app.services.nudge_lifecycle_service import check_due_outcomes
from app.services.orchestration_state_service import purge_expired

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
    def wrapped_lifecycle_cleanup():
        db = SessionLocal()
        try:
            check_due_outcomes(db)
            purge_expired(db)
            db.commit()
        finally:
            db.close()
    scheduler.add_job(wrapped_lifecycle_cleanup, trigger="cron", hour=3, id="nudge_outcomes_and_checkpoint_retention", replace_existing=True)

    def wrapped_proactive_nudge_scan():
        """Scan all users with nudge consent and deliver proactive nudges."""
        import os
        import httpx
        from app.services.state_bridge_service import get_finassist_data
        from app.services.nudge_lifecycle_service import record_and_deliver
        from app.models.schemas import UserConsent
        
        db = SessionLocal()
        try:
            # Get all users with nudge consent granted
            consented_users = db.query(UserConsent).filter_by(purpose='nudges', granted=True).all()
            nudge_url = os.environ.get('NUDGE_AGENT_URL', 'http://localhost:8004')
            
            for consent in consented_users:
                try:
                    finassist = get_finassist_data(consent.user_id, db)
                    # Build evaluate request matching NudgeEvaluationIn schema
                    payload = {
                        'user_id': str(consent.user_id),
                        'closing_balance': finassist.get('closing_balance', 0),
                        'low_balance_flag': finassist.get('low_balance_flag', False),
                        'nudge_trigger_low_balance_before_debit': finassist.get('nudge_trigger_low_balance_before_debit', False),
                        'days_to_next_pmsby_debit': finassist.get('days_to_next_pmsby_debit'),
                        'pmsby_debit_due_soon': finassist.get('pmsby_debit_due_soon', False),
                        'missed_goal': False,
                        'high_volatility_streak': finassist.get('income_volatility_pct', 0) > 35,
                        'language_pref': 'hi'
                    }
                    resp = httpx.post(f'{nudge_url}/nudges/evaluate', json=payload, timeout=5)
                    if resp.status_code == 200:
                        nudges = resp.json().get('nudges', [])
                        record_and_deliver(db, consent.user_id, nudges, finassist)
                except Exception as e:
                    import logging
                    logging.getLogger(__name__).warning('Proactive nudge failed for user %d: %s', consent.user_id, e)
            db.commit()
        finally:
            db.close()

    scheduler.add_job(wrapped_proactive_nudge_scan, trigger='cron', hour=2, minute=30, id='proactive_nudge_scan', replace_existing=True)

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
