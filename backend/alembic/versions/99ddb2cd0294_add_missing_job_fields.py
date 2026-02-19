"""Add missing job fields

Revision ID: 99ddb2cd0294
Revises: bb9a43853394
Create Date: 2026-02-18 11:36:52.633048

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '99ddb2cd0294'
down_revision: Union[str, Sequence[str], None] = 'bb9a43853394'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Using execute with IF NOT EXISTS to prevent DuplicateColumnError if column was added manually or by previous failed run
    op.execute("ALTER TABLE job ADD COLUMN IF NOT EXISTS job_type VARCHAR;")
    op.execute("ALTER TABLE job ADD COLUMN IF NOT EXISTS experience_level VARCHAR;")


def downgrade() -> None:
    """Downgrade schema."""
    op.execute("ALTER TABLE job DROP COLUMN IF EXISTS experience_level;")
    op.execute("ALTER TABLE job DROP COLUMN IF EXISTS job_type;")
