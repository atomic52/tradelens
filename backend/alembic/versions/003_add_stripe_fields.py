"""add stripe_customer_id and subscription_status to users

Revision ID: 003
Revises: 002
Create Date: 2026-06-02
"""

import sqlalchemy as sa
from alembic import op

revision = "003"
down_revision = "002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("user", sa.Column("stripe_customer_id", sa.String(255), nullable=True))
    op.add_column(
        "user",
        sa.Column("subscription_status", sa.String(20), nullable=False, server_default="free"),
    )


def downgrade() -> None:
    op.drop_column("user", "subscription_status")
    op.drop_column("user", "stripe_customer_id")
