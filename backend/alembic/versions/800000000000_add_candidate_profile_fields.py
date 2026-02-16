"""add_candidate_profile_fields

Revision ID: 800000000000
Revises: 700000000000
Create Date: 2026-02-14 17:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '800000000000'
down_revision: Union[str, Sequence[str], None] = '700000000000'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('user', sa.Column('first_name', sa.String(), nullable=True))
    op.add_column('user', sa.Column('middle_initial', sa.String(), nullable=True))
    op.add_column('user', sa.Column('last_name', sa.String(), nullable=True))
    op.add_column('user', sa.Column('phone_number', sa.String(), nullable=True))
    op.add_column('user', sa.Column('city', sa.String(), nullable=True))
    op.add_column('user', sa.Column('state', sa.String(), nullable=True))
    op.add_column('user', sa.Column('years_of_experience', sa.Integer(), nullable=True))
    op.add_column('user', sa.Column('work_permit_type', sa.String(), nullable=True))
    op.add_column('user', sa.Column('linkedin_url', sa.String(), nullable=True))


def downgrade() -> None:
    op.drop_column('user', 'linkedin_url')
    op.drop_column('user', 'work_permit_type')
    op.drop_column('user', 'years_of_experience')
    op.drop_column('user', 'state')
    op.drop_column('user', 'city')
    op.drop_column('user', 'phone_number')
    op.drop_column('user', 'last_name')
    op.drop_column('user', 'middle_initial')
    op.drop_column('user', 'first_name')
