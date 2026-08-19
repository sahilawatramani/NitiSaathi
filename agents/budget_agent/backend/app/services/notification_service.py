import json
from datetime import timedelta

from sqlalchemy.orm import Session

from app.config import REPORT_LOOKBACK_DAYS
from app.models.database import SessionLocal
from app.models.schemas import RealtimeTransactionEvent, Transaction, User, UserNotification
from app.services.tax_service import generate_tax_report
from app.utils.time import utcnow


def create_notification(
    db: Session,
    user_id: int,
    notification_type: str,
    title: str,
    message: str,
    payload: dict | None = None,
) -> UserNotification:
    notification = UserNotification(
        user_id=user_id,
        notification_type=notification_type,
        title=title,
        message=message,
        payload=json.dumps(payload) if payload else None,
    )
    db.add(notification)
    db.commit()
    db.refresh(notification)
    return notification


def send_daily_pending_classification_reminders() -> None:
    db = SessionLocal()
    try:
        cutoff = utcnow() - timedelta(days=1)
        pending = (
            db.query(RealtimeTransactionEvent)
            .filter(RealtimeTransactionEvent.status == "pending")
            .all()
        )

        for event in pending:
            if event.last_notified_at and event.last_notified_at > cutoff:
                continue

            create_notification(
                db=db,
                user_id=event.user_id,
                notification_type="classification_reminder",
                title="Classify your pending transaction",
                message=(
                    f"Please categorize {event.merchant} (Rs. {event.amount:.2f}) "
                    "to keep your reports accurate."
                ),
                payload={"event_id": event.id, "provider": event.provider},
            )
            event.last_notified_at = utcnow()
            event.reminder_count += 1
            db.commit()
    finally:
        db.close()


def send_monthly_reports() -> None:
    db = SessionLocal()
    try:
        now = utcnow()
        month_key = now.strftime("%Y-%m")
        start_time = now - timedelta(days=REPORT_LOOKBACK_DAYS)

        users = db.query(User).all()
        for user in users:
            # Prevent duplicate monthly notifications for the same month.
            exists = (
                db.query(UserNotification)
                .filter(
                    UserNotification.user_id == user.id,
                    UserNotification.notification_type == "monthly_report",
                    UserNotification.payload.like(f'%"month":"{month_key}"%'),
                )
                .first()
            )
            if exists:
                continue

            txns = (
                db.query(Transaction)
                .filter(Transaction.user_id == user.id, Transaction.date >= start_time)
                .all()
            )
            if not txns:
                continue

            txn_dicts = [
                {
                    "date": str(t.date),
                    "amount": t.amount,
                    "merchant": t.merchant,
                    "category": t.category,
                    "description": t.description,
                    "is_tax_deductible": t.is_tax_deductible,
                    "tax_category": t.tax_category,
                }
                for t in txns
            ]
            report = generate_tax_report(txn_dicts, annual_income=0)
            total_spend = round(sum(t.amount for t in txns), 2)
            deductible = report["report_summary"]["total_deductions_claimed"]

            create_notification(
                db=db,
                user_id=user.id,
                notification_type="monthly_report",
                title="Your monthly FinAssist report is ready",
                message=(
                    f"You spent Rs. {total_spend:.2f} in the last {REPORT_LOOKBACK_DAYS} days. "
                    f"Potential deductions identified: Rs. {deductible:.2f}."
                ),
                payload={
                    "month": month_key,
                    "total_spend": total_spend,
                    "deductions": deductible,
                    "transaction_count": len(txns),
                },
            )
    finally:
        db.close()
