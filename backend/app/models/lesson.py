import uuid
from datetime import datetime, date
from sqlalchemy import String, DateTime, Date, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class Lesson(Base):
    __tablename__ = "lessons"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    module_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("modules.id", ondelete="CASCADE"), nullable=False
    )
    subject_name: Mapped[str] = mapped_column(String(255), nullable=False)  # Dersin Adı (FİZYOLOJİ, ANATOMİ...)
    order_label: Mapped[str | None] = mapped_column(String(50), nullable=True)   # s1, s2, s3...
    topic: Mapped[str | None] = mapped_column(String(500), nullable=True)        # Dersin Konusu
    lesson_date: Mapped[date | None] = mapped_column(Date, nullable=True)        # Ders Tarihi
    assigned_team: Mapped[str | None] = mapped_column(String(500), nullable=True)  # Hazırlayan Ekip
    audio_status: Mapped[str | None] = mapped_column(String(100), nullable=True)   # Ses Kaydı Durumu
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    module: Mapped["Module"] = relationship("Module", back_populates="lessons")  # noqa: F821
    note_tracking: Mapped["NoteTracking | None"] = relationship(  # noqa: F821
        "NoteTracking", back_populates="lesson", cascade="all, delete-orphan", uselist=False
    )

    def __repr__(self) -> str:
        return f"<Lesson(id={self.id}, subject={self.subject_name}, order={self.order_label})>"
