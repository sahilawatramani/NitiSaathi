"""Nitisaathi Budget Agent — new tables for Phase 1

Adds: user_profiles (gig extensions), user_goals, user_categories,
      user_weekly_features, temporal_memory_events, recurring_debits.

Revision ID: 20260830_0003
Revises: 20260326_0002
Create Date: 2026-08-30
"""

from alembic import op
import sqlalchemy as sa

revision = "20260830_0003"
down_revision = "20260326_0002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ── user_profiles ────────────────────────────────────────────────────────
    # Table may already exist in dev DBs via AUTO_CREATE_TABLES.
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    existing_tables = inspector.get_table_names()

    if "user_profiles" not in existing_tables:
        op.create_table(
            "user_profiles",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
            sa.Column("age", sa.Integer(), nullable=False, server_default="30"),
            sa.Column("monthly_income", sa.Float(), nullable=False, server_default="0"),
            sa.Column("monthly_expenses", sa.Float(), nullable=False, server_default="0"),
            sa.Column("monthly_emi", sa.Float(), nullable=False, server_default="0"),
            sa.Column("current_savings", sa.Float(), nullable=False, server_default="0"),
            sa.Column("has_health_insurance", sa.Boolean(), nullable=False, server_default="0"),
            sa.Column("target_retirement_age", sa.Integer(), nullable=False, server_default="60"),
            sa.Column("risk_tolerance", sa.String(), nullable=False, server_default="'moderate'"),
            sa.Column("is_couple", sa.Boolean(), nullable=False, server_default="0"),
            sa.Column("partner_age", sa.Integer(), nullable=True),
            sa.Column("partner_income", sa.Float(), nullable=True),
            sa.Column("financial_persona", sa.String(), nullable=False, server_default="'moderate'"),
            sa.Column("current_savings_streak", sa.Integer(), nullable=False, server_default="0"),
            sa.Column("highest_savings_streak", sa.Integer(), nullable=False, server_default="0"),
            sa.PrimaryKeyConstraint("id"),
            sa.UniqueConstraint("user_id"),
        )
        op.create_index("ix_user_profiles_id", "user_profiles", ["id"])
        op.create_index("ix_user_profiles_user_id", "user_profiles", ["user_id"])
    else:
        # Additive column backfill for pre-existing table
        existing_cols = {c["name"] for c in inspector.get_columns("user_profiles")}
        if "financial_persona" not in existing_cols:
            op.add_column("user_profiles", sa.Column("financial_persona", sa.String(), nullable=False, server_default="'moderate'"))
        if "current_savings_streak" not in existing_cols:
            op.add_column("user_profiles", sa.Column("current_savings_streak", sa.Integer(), nullable=False, server_default="0"))
        if "highest_savings_streak" not in existing_cols:
            op.add_column("user_profiles", sa.Column("highest_savings_streak", sa.Integer(), nullable=False, server_default="0"))

    # ── transactions — direction column ──────────────────────────────────────
    if "transactions" in existing_tables:
        tx_cols = {c["name"] for c in inspector.get_columns("transactions")}
        if "direction" not in tx_cols:
            op.add_column("transactions", sa.Column("direction", sa.String(), nullable=False, server_default="'debit'"))

    # ── user_goals ───────────────────────────────────────────────────────────
    if "user_goals" not in existing_tables:
        op.create_table(
            "user_goals",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
            sa.Column("name", sa.String(), nullable=False),
            sa.Column("target_amount", sa.Float(), nullable=False),
            sa.Column("saved_amount", sa.Float(), nullable=False, server_default="0"),
            sa.Column("category", sa.String(), nullable=True),
            sa.Column("target_date", sa.Date(), nullable=True),
            sa.Column("is_active", sa.Boolean(), nullable=False, server_default="1"),
            sa.Column("created_at", sa.DateTime(), nullable=False),
            sa.Column("updated_at", sa.DateTime(), nullable=False),
            sa.PrimaryKeyConstraint("id"),
        )
        op.create_index("ix_user_goals_id", "user_goals", ["id"])
        op.create_index("ix_user_goals_user_id", "user_goals", ["user_id"])

    # ── user_categories ──────────────────────────────────────────────────────
    if "user_categories" not in existing_tables:
        op.create_table(
            "user_categories",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
            sa.Column("name", sa.String(), nullable=False),
            sa.Column("direction", sa.String(), nullable=False, server_default="'debit'"),
            sa.Column("icon", sa.String(), nullable=True),
            sa.Column("color", sa.String(), nullable=True),
            sa.Column("created_at", sa.DateTime(), nullable=False),
            sa.PrimaryKeyConstraint("id"),
            sa.UniqueConstraint("user_id", "name", name="uq_user_category_name"),
        )
        op.create_index("ix_user_categories_id", "user_categories", ["id"])
        op.create_index("ix_user_categories_user_id", "user_categories", ["user_id"])

    # ── user_weekly_features ─────────────────────────────────────────────────
    if "user_weekly_features" not in existing_tables:
        op.create_table(
            "user_weekly_features",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
            sa.Column("week_start", sa.Date(), nullable=False),
            sa.Column("total_income", sa.Float(), nullable=False, server_default="0"),
            sa.Column("total_expense", sa.Float(), nullable=False, server_default="0"),
            sa.Column("closing_balance", sa.Float(), nullable=False, server_default="0"),
            sa.Column("net_cashflow", sa.Float(), nullable=False, server_default="0"),
            sa.Column("exp_rent", sa.Float(), nullable=False, server_default="0"),
            sa.Column("exp_fuel", sa.Float(), nullable=False, server_default="0"),
            sa.Column("exp_recharge", sa.Float(), nullable=False, server_default="0"),
            sa.Column("exp_food", sa.Float(), nullable=False, server_default="0"),
            sa.Column("exp_discretionary", sa.Float(), nullable=False, server_default="0"),
            sa.Column("exp_family_support", sa.Float(), nullable=False, server_default="0"),
            sa.Column("exp_insurance_premium", sa.Float(), nullable=False, server_default="0"),
            sa.Column("exp_loan_emi", sa.Float(), nullable=False, server_default="0"),
            sa.Column("income_wma_4w", sa.Float(), nullable=True),
            sa.Column("predicted_next_week_income", sa.Float(), nullable=True),
            sa.Column("income_volatility_pct", sa.Float(), nullable=True),
            sa.Column("savings_rate_recommendation", sa.Float(), nullable=True),
            sa.Column("savings_rate_actual", sa.Float(), nullable=True),
            sa.Column("low_balance_flag", sa.Boolean(), nullable=False, server_default="0"),
            sa.Column("days_to_next_pmsby_debit", sa.Float(), nullable=True),
            sa.Column("pmsby_debit_due_soon", sa.Boolean(), nullable=False, server_default="0"),
            sa.Column("nudge_trigger_low_balance_before_debit", sa.Boolean(), nullable=False, server_default="0"),
            sa.Column("has_active_emi", sa.Boolean(), nullable=False, server_default="0"),
            sa.Column("monthly_emi_amount", sa.Float(), nullable=False, server_default="0"),
            sa.Column("emi_burden_pct", sa.Float(), nullable=False, server_default="0"),
            sa.Column("financial_persona", sa.String(), nullable=True),
            sa.Column("safe_to_spend_daily", sa.Float(), nullable=True),
            sa.Column("discretionary_pct", sa.Float(), nullable=True),
            sa.Column("had_informal_borrowing", sa.Boolean(), nullable=False, server_default="0"),
            sa.Column("created_at", sa.DateTime(), nullable=False),
            sa.PrimaryKeyConstraint("id"),
            sa.UniqueConstraint("user_id", "week_start", name="uq_user_week"),
        )
        op.create_index("ix_user_weekly_features_id", "user_weekly_features", ["id"])
        op.create_index("ix_user_weekly_features_user_id", "user_weekly_features", ["user_id"])
        op.create_index("ix_user_weekly_features_week_start", "user_weekly_features", ["week_start"])

    # ── temporal_memory_events ───────────────────────────────────────────────
    if "temporal_memory_events" not in existing_tables:
        op.create_table(
            "temporal_memory_events",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
            sa.Column("event_type", sa.String(), nullable=False),
            sa.Column("description", sa.Text(), nullable=True),
            sa.Column("impact_score", sa.Float(), nullable=False, server_default="1.0"),
            sa.Column("amount", sa.Float(), nullable=True),
            sa.Column("timestamp", sa.DateTime(), nullable=False),
            sa.PrimaryKeyConstraint("id"),
        )
        op.create_index("ix_temporal_memory_events_id", "temporal_memory_events", ["id"])
        op.create_index("ix_temporal_memory_events_user_id", "temporal_memory_events", ["user_id"])
        op.create_index("ix_temporal_memory_events_event_type", "temporal_memory_events", ["event_type"])
        op.create_index("ix_temporal_memory_events_timestamp", "temporal_memory_events", ["timestamp"])

    # ── recurring_debits ─────────────────────────────────────────────────────
    if "recurring_debits" not in existing_tables:
        op.create_table(
            "recurring_debits",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
            sa.Column("name", sa.String(), nullable=False),
            sa.Column("amount", sa.Float(), nullable=False),
            sa.Column("category", sa.String(), nullable=False),
            sa.Column("frequency", sa.String(), nullable=False, server_default="'monthly'"),
            sa.Column("due_day_of_month", sa.Integer(), nullable=True),
            sa.Column("next_due_date", sa.Date(), nullable=True),
            sa.Column("is_active", sa.Boolean(), nullable=False, server_default="1"),
            sa.Column("auto_detected", sa.Boolean(), nullable=False, server_default="0"),
            sa.Column("created_at", sa.DateTime(), nullable=False),
            sa.PrimaryKeyConstraint("id"),
            sa.UniqueConstraint("user_id", "name", name="uq_user_recurring_name"),
        )
        op.create_index("ix_recurring_debits_id", "recurring_debits", ["id"])
        op.create_index("ix_recurring_debits_user_id", "recurring_debits", ["user_id"])


def downgrade() -> None:
    op.drop_table("recurring_debits")
    op.drop_table("temporal_memory_events")
    op.drop_table("user_weekly_features")
    op.drop_table("user_categories")
    op.drop_table("user_goals")
