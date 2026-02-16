"""add_ai_screening_fields

Revision ID: 700000000000
Revises: 566da9e99a90
Create Date: 2026-02-14 17:15:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '700000000000'
down_revision: Union[str, Sequence[str], None] = '566da9e99a90'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('job', sa.Column('nice_to_have_requirements', sa.Text(), nullable=True))
    op.add_column('application', sa.Column('resume_path', sa.String(), nullable=True))
    op.add_column('application', sa.Column('ai_score', sa.Integer(), nullable=True))
    op.add_column('application', sa.Column('ai_analysis', sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column('application', 'ai_analysis')
    op.drop_column('application', 'ai_score')
    op.drop_column('application', 'resume_path')
    op.drop_column('job', 'nice_to_have_requirements')
