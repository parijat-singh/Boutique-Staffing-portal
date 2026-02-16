"""Change email unique constraint to composite (email, role)

Revision ID: 1000000000000
Revises: 900000000000
Create Date: 2026-02-15

"""
from alembic import op

# revision identifiers, used by Alembic.
revision = '1000000000000'
down_revision = '900000000000'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Drop the old unique constraint on email alone
    # The original migration created it as a unique index
    op.drop_index('ix_user_email', table_name='user')
    # Re-create email as a normal index (non-unique)
    op.create_index('ix_user_email', 'user', ['email'], unique=False)
    # Add composite unique constraint on (email, role)
    op.create_unique_constraint('uq_user_email_role', 'user', ['email', 'role'])


def downgrade() -> None:
    op.drop_constraint('uq_user_email_role', 'user', type_='unique')
    op.drop_index('ix_user_email', table_name='user')
    op.create_index('ix_user_email', 'user', ['email'], unique=True)
