"""Add consented Scheme/Literacy profile fields.

Revision ID: 20260908_0004
Revises: 20260830_0003
"""
from alembic import op
import sqlalchemy as sa

revision = "20260908_0004"
down_revision = "20260830_0003"
branch_labels = None
depends_on = None


def upgrade() -> None:
    inspector = sa.inspect(op.get_bind())
    columns = {c["name"] for c in inspector.get_columns("user_profiles")}
    additions = {
        "epfo_esic_status": sa.Column("epfo_esic_status", sa.Boolean(), nullable=False, server_default=sa.false()),
        "income_tax_payer": sa.Column("income_tax_payer", sa.Boolean(), nullable=False, server_default=sa.false()),
        "e_shram_registered": sa.Column("e_shram_registered", sa.Boolean(), nullable=False, server_default=sa.false()),
        "days_active_with_aggregator": sa.Column("days_active_with_aggregator", sa.Integer(), nullable=True),
        "state": sa.Column("state", sa.String(), nullable=True),
        "savings_bank_account": sa.Column("savings_bank_account", sa.Boolean(), nullable=False, server_default=sa.true()),
        "aadhaar_linked": sa.Column("aadhaar_linked", sa.Boolean(), nullable=False, server_default=sa.true()),
        "language_pref": sa.Column("language_pref", sa.String(), nullable=False, server_default="en"),
        "literacy_level": sa.Column("literacy_level", sa.String(), nullable=False, server_default="medium"),
    }
    for name, column in additions.items():
        if name not in columns:
            op.add_column("user_profiles", column)


def downgrade() -> None:
    for name in ("literacy_level", "language_pref", "aadhaar_linked", "savings_bank_account", "state", "days_active_with_aggregator", "e_shram_registered", "income_tax_payer", "epfo_esic_status"):
        op.drop_column("user_profiles", name)
