import uuid
from datetime import datetime
from sqlalchemy import String, DateTime, ForeignKey, func, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base
from app.models.note_tracking import NoteStatus


class StatusHistory(Base):
    __tablename__ = "status_history"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    note_tracking_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("note_tracking.id", ondelete="CASCADE"), nullable=False
    )
    old_status: Mapped[NoteStatus | None] = mapped_column(
        SAEnum(NoteStatus, name="note_status_enum", create_type=False), nullable=True
    )
    new_status: Mapped[NoteStatus] = mapped_column(
        SAEnum(NoteStatus, name="note_status_enum", create_type=False), nullable=False
    )
    changed_by: Mapped[str | None] = mapped_column(String(255), nullable=True)
    changed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    # Relationships
    note_tracking: Mapped["NoteTracking"] = relationship(  # noqa: F821
        "NoteTracking", back_populates="history"
    )

    def __repr__(self) -> str:
        return f"<StatusHistory(id={self.id}, {self.old_status} → {self.new_status})>"
