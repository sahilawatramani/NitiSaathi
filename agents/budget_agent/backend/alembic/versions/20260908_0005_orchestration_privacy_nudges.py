"""Durable orchestration checkpoints, consents and nudge lifecycle tables."""
from alembic import op
import sqlalchemy as sa

revision = "20260908_0005"
down_revision = "20260908_0004"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table("nudge_logs", sa.Column("id", sa.Integer(), primary_key=True), sa.Column("external_nudge_id", sa.String(), nullable=False), sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False), sa.Column("nudge_type", sa.String(), nullable=False), sa.Column("message", sa.Text(), nullable=False), sa.Column("state_before", sa.Text(), nullable=False), sa.Column("feedback", sa.String()), sa.Column("outcome_status", sa.String(), nullable=False, server_default="pending"), sa.Column("outcome_details", sa.Text()), sa.Column("outcome_check_at", sa.DateTime(), nullable=False), sa.Column("created_at", sa.DateTime(), nullable=False), sa.Column("checked_at", sa.DateTime()))
    op.create_index("ix_nudge_logs_user_id", "nudge_logs", ["user_id"])
    op.create_index("ix_nudge_logs_external_nudge_id", "nudge_logs", ["external_nudge_id"], unique=True)
    op.create_table("user_consents", sa.Column("id", sa.Integer(), primary_key=True), sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False), sa.Column("purpose", sa.String(), nullable=False), sa.Column("granted", sa.Boolean(), nullable=False, server_default=sa.false()), sa.Column("language", sa.String(), nullable=False, server_default="en"), sa.Column("policy_version", sa.String(), nullable=False, server_default="v1"), sa.Column("updated_at", sa.DateTime(), nullable=False), sa.UniqueConstraint("user_id", "purpose", name="uq_user_consent_purpose"))
    op.create_table("orchestration_checkpoints", sa.Column("id", sa.Integer(), primary_key=True), sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False), sa.Column("thread_id", sa.String(), nullable=False), sa.Column("state_json", sa.Text(), nullable=False), sa.Column("expires_at", sa.DateTime(), nullable=False), sa.Column("updated_at", sa.DateTime(), nullable=False), sa.UniqueConstraint("user_id", "thread_id", name="uq_orchestration_thread"))


def downgrade() -> None:
    op.drop_table("orchestration_checkpoints")
    op.drop_table("user_consents")
    op.drop_table("nudge_logs")
