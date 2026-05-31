"""add ON DELETE CASCADE to import_logs.account_id fkey

Revision ID: 002
Revises: 001
Create Date: 2026-05-31
"""

from alembic import op

revision = "002"
down_revision = "001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.drop_constraint("import_logs_account_id_fkey", "import_logs", type_="foreignkey")
    op.create_foreign_key(
        "import_logs_account_id_fkey",
        "import_logs", "accounts",
        ["account_id"], ["id"],
        ondelete="CASCADE",
    )


def downgrade() -> None:
    op.drop_constraint("import_logs_account_id_fkey", "import_logs", type_="foreignkey")
    op.create_foreign_key(
        "import_logs_account_id_fkey",
        "import_logs", "accounts",
        ["account_id"], ["id"],
    )
