"""initial schema

Revision ID: 20260325_0001
Revises: 
Create Date: 2026-03-25
"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "20260325_0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("email", sa.String(), nullable=False),
        sa.Column("hashed_password", sa.String(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_users_id", "users", ["id"], unique=False)
    op.create_index("ix_users_email", "users", ["email"], unique=True)

    op.create_table(
        "transactions",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=True),
        sa.Column("date", sa.DateTime(), nullable=True),
        sa.Column("amount", sa.Float(), nullable=False),
        sa.Column("merchant", sa.String(), nullable=True),
        sa.Column("description", sa.String(), nullable=True),
        sa.Column("category", sa.String(), nullable=True),
        sa.Column("confidence_score", sa.Float(), nullable=True),
        sa.Column("is_tax_deductible", sa.Boolean(), nullable=True),
        sa.Column("tax_category", sa.String(), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_transactions_id", "transactions", ["id"], unique=False)
    op.create_index("ix_transactions_merchant", "transactions", ["merchant"], unique=False)
    op.create_index("ix_transactions_category", "transactions", ["category"], unique=False)

    op.create_table(
        "user_feedback",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("transaction_id", sa.Integer(), nullable=True),
        sa.Column("corrected_category", sa.String(), nullable=True),
        sa.Column("corrected_tax_status", sa.Boolean(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_user_feedback_id", "user_feedback", ["id"], unique=False)
    op.create_index("ix_user_feedback_transaction_id", "user_feedback", ["transaction_id"], unique=False)

    op.create_table(
        "realtime_transaction_events",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("provider", sa.String(), nullable=False),
        sa.Column("external_txn_id", sa.String(), nullable=False),
        sa.Column("amount", sa.Float(), nullable=False),
        sa.Column("merchant", sa.String(), nullable=False),
        sa.Column("description", sa.String(), nullable=True),
        sa.Column("txn_date", sa.DateTime(), nullable=False),
        sa.Column("status", sa.String(), nullable=False),
        sa.Column("suggested_categories", sa.Text(), nullable=False),
        sa.Column("selected_category", sa.String(), nullable=True),
        sa.Column("confidence_score", sa.Float(), nullable=True),
        sa.Column("reminder_count", sa.Integer(), nullable=False),
        sa.Column("last_notified_at", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", "provider", "external_txn_id", name="uq_realtime_user_provider_external"),
    )
    op.create_index("ix_realtime_transaction_events_id", "realtime_transaction_events", ["id"], unique=False)
    op.create_index("ix_realtime_transaction_events_user_id", "realtime_transaction_events", ["user_id"], unique=False)
    op.create_index("ix_realtime_transaction_events_provider", "realtime_transaction_events", ["provider"], unique=False)
    op.create_index("ix_realtime_transaction_events_external_txn_id", "realtime_transaction_events", ["external_txn_id"], unique=False)
    op.create_index("ix_realtime_transaction_events_status", "realtime_transaction_events", ["status"], unique=False)

    op.create_table(
        "user_notifications",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("notification_type", sa.String(), nullable=False),
        sa.Column("title", sa.String(), nullable=False),
        sa.Column("message", sa.Text(), nullable=False),
        sa.Column("payload", sa.Text(), nullable=True),
        sa.Column("is_read", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_user_notifications_id", "user_notifications", ["id"], unique=False)
    op.create_index("ix_user_notifications_user_id", "user_notifications", ["user_id"], unique=False)
    op.create_index("ix_user_notifications_notification_type", "user_notifications", ["notification_type"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_user_notifications_notification_type", table_name="user_notifications")
    op.drop_index("ix_user_notifications_user_id", table_name="user_notifications")
    op.drop_index("ix_user_notifications_id", table_name="user_notifications")
    op.drop_table("user_notifications")

    op.drop_index("ix_realtime_transaction_events_status", table_name="realtime_transaction_events")
    op.drop_index("ix_realtime_transaction_events_external_txn_id", table_name="realtime_transaction_events")
    op.drop_index("ix_realtime_transaction_events_provider", table_name="realtime_transaction_events")
    op.drop_index("ix_realtime_transaction_events_user_id", table_name="realtime_transaction_events")
    op.drop_index("ix_realtime_transaction_events_id", table_name="realtime_transaction_events")
    op.drop_table("realtime_transaction_events")

    op.drop_index("ix_user_feedback_transaction_id", table_name="user_feedback")
    op.drop_index("ix_user_feedback_id", table_name="user_feedback")
    op.drop_table("user_feedback")

    op.drop_index("ix_transactions_category", table_name="transactions")
    op.drop_index("ix_transactions_merchant", table_name="transactions")
    op.drop_index("ix_transactions_id", table_name="transactions")
    op.drop_table("transactions")

    op.drop_index("ix_users_email", table_name="users")
    op.drop_index("ix_users_id", table_name="users")
    op.drop_table("users")
