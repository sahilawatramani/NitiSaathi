"""feedback enhancements for reflection loops

Revision ID: 20260326_0002
Revises: 20260325_0001
Create Date: 2026-03-26
"""

from alembic import op
import sqlalchemy as sa


revision = "20260326_0002"
down_revision = "20260325_0001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("user_feedback", sa.Column("source_event_id", sa.Integer(), nullable=True))
    op.add_column("user_feedback", sa.Column("predicted_category", sa.String(), nullable=True))
    op.add_column("user_feedback", sa.Column("reason_type", sa.String(), nullable=True))
    op.add_column(
        "user_feedback",
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
    )
    op.create_index("ix_user_feedback_source_event_id", "user_feedback", ["source_event_id"], unique=False)
    op.create_foreign_key(
        "fk_user_feedback_source_event",
        "user_feedback",
        "realtime_transaction_events",
        ["source_event_id"],
        ["id"],
    )


def downgrade() -> None:
    op.drop_constraint("fk_user_feedback_source_event", "user_feedback", type_="foreignkey")
    op.drop_index("ix_user_feedback_source_event_id", table_name="user_feedback")
    op.drop_column("user_feedback", "created_at")
    op.drop_column("user_feedback", "reason_type")
    op.drop_column("user_feedback", "predicted_category")
    op.drop_column("user_feedback", "source_event_id")
