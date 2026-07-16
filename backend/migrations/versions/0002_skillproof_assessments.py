"""Add SkillProof assessments.

Revision ID: 0002_skillproof
Revises: 0001_initial
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0002_skillproof"
down_revision: str | None = "0001_initial"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "skill_assessments",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("user_id", sa.String(length=36), nullable=False),
        sa.Column("share_token", sa.String(length=36), nullable=False),
        sa.Column("role", sa.String(length=80), nullable=False),
        sa.Column("level", sa.String(length=30), nullable=False),
        sa.Column("job_description", sa.Text(), nullable=False),
        sa.Column("resume_skills", sa.JSON(), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False),
        sa.Column("challenge_id", sa.String(length=80), nullable=False),
        sa.Column("code_submission", sa.Text(), nullable=True),
        sa.Column("test_results", sa.JSON(), nullable=False),
        sa.Column("code_score", sa.Float(), nullable=True),
        sa.Column("test_score", sa.Float(), nullable=True),
        sa.Column("viva_answers", sa.JSON(), nullable=False),
        sa.Column("viva_score", sa.Float(), nullable=True),
        sa.Column("problem_solving_score", sa.Float(), nullable=True),
        sa.Column("overall_score", sa.Float(), nullable=True),
        sa.Column("skill_scores", sa.JSON(), nullable=False),
        sa.Column("evidence", sa.JSON(), nullable=False),
        sa.Column("improvements", sa.JSON(), nullable=False),
        sa.Column("evaluation_provider", sa.String(length=30), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_skill_assessments_share_token"),
        "skill_assessments",
        ["share_token"],
        unique=True,
    )
    op.create_index(
        op.f("ix_skill_assessments_status"), "skill_assessments", ["status"]
    )
    op.create_index(
        op.f("ix_skill_assessments_user_id"), "skill_assessments", ["user_id"]
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_skill_assessments_user_id"), table_name="skill_assessments")
    op.drop_index(op.f("ix_skill_assessments_status"), table_name="skill_assessments")
    op.drop_index(op.f("ix_skill_assessments_share_token"), table_name="skill_assessments")
    op.drop_table("skill_assessments")
