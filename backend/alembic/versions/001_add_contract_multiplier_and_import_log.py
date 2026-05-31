"""initial schema with all tables

Revision ID: 001
Revises:
Create Date: 2026-05-29
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "user",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("email", sa.String(320), nullable=False, unique=True),
        sa.Column("hashed_password", sa.String(1024), nullable=False),
        sa.Column("is_active", sa.Boolean, nullable=False, server_default="true"),
        sa.Column("is_superuser", sa.Boolean, nullable=False, server_default="false"),
        sa.Column("is_verified", sa.Boolean, nullable=False, server_default="false"),
    )
    op.create_index("ix_user_email", "user", ["email"], unique=True)

    op.create_table(
        "accounts",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("user.id"), nullable=False),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("broker", sa.String(50), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        "trades",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("account_id", postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("accounts.id"), nullable=False),
        sa.Column("symbol", sa.String(100), nullable=False),
        sa.Column("asset_class", sa.String(20), nullable=False, server_default="equity"),
        sa.Column("direction", sa.String(5), nullable=False),
        sa.Column("opened_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("closed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("status", sa.String(10), nullable=False, server_default="open"),
        sa.Column("quantity", sa.Numeric(18, 8), nullable=False),
        sa.Column("avg_entry", sa.Numeric(18, 8), nullable=False),
        sa.Column("avg_exit", sa.Numeric(18, 8), nullable=True),
        sa.Column("realized_pnl", sa.Numeric(18, 8), nullable=True),
        sa.Column("fees", sa.Numeric(18, 8), nullable=False, server_default="0"),
        sa.Column("contract_multiplier", sa.Numeric(10, 4), nullable=False, server_default="1"),
        sa.Column("notes", sa.Text, nullable=True),
        sa.Column("tags", sa.String(500), nullable=True),
    )
    op.create_index("ix_trades_account_id", "trades", ["account_id"])
    op.create_index("ix_trades_closed_at", "trades", ["closed_at"])

    op.create_table(
        "executions",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("account_id", postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("accounts.id"), nullable=False),
        sa.Column("trade_id", postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("trades.id"), nullable=True),
        sa.Column("executed_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("symbol", sa.String(100), nullable=False),
        sa.Column("side", sa.String(4), nullable=False),
        sa.Column("quantity", sa.Numeric(18, 8), nullable=False),
        sa.Column("price", sa.Numeric(18, 8), nullable=False),
        sa.Column("fees", sa.Numeric(18, 8), nullable=False, server_default="0"),
        sa.Column("asset_class", sa.String(20), nullable=False, server_default="equity"),
    )
    op.create_index("ix_executions_account_id", "executions", ["account_id"])

    op.create_table(
        "import_logs",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("account_id", postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("accounts.id"), nullable=False),
        sa.Column("file_hash", sa.String(64), nullable=False),
        sa.Column("source_type", sa.String(30), nullable=False),
        sa.Column("imported_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_import_logs_account_hash", "import_logs",
                    ["account_id", "file_hash"])


def downgrade() -> None:
    op.drop_table("import_logs")
    op.drop_table("executions")
    op.drop_table("trades")
    op.drop_table("accounts")
    op.drop_index("ix_user_email", "user")
    op.drop_table("user")
