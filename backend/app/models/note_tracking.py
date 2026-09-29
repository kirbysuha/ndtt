import uuid
import enum
from datetime import datetime
from sqlalchemy import String, DateTime, ForeignKey, func, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class NoteStatus(str, enum.Enum):
    NOT_REACHED = "Not henüz ulaşmadı"
    IN_MAIL = "Not mailde"
    REVIEW = "Not denetimde"
    REVIEW_2 = "Not 2. Kez denetimde"
    ACCEPTED = "Not kabul edildi"
    REJECTED_1 = "Not 1. Kez reddedildi"
    REJECTED_2 = "Not 2. Kez reddedildi"
    UPLOADED = "Not yüklendi"


class NoteTracking(Base):
    __tablename__ = "note_tracking"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    lesson_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("lessons.id", ondelete="CASCADE"), nullable=False, unique=True
    )
    status: Mapped[NoteStatus] = mapped_column(
        SAEnum(NoteStatus, name="note_status_enum", create_type=True),
        default=NoteStatus.NOT_REACHED,
        nullable=False,
    )

    # Timestamp alanları (Apps Script'teki PropertiesService'in karşılığı)
    mail_start_time: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )  # "Not mailde" ilk geçiş zamanı

    review_start_time: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )  # Aktif denetim başlangıç zamanı (1. veya 2. denetim)

    first_reject_date: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )  # 1. Red tarihi

    second_reject_date: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )  # 2. Red tarihi

    final_upload_duration: Mapped[str | None] = mapped_column(
        String(100), nullable=True
    )  # Yüklenince dondurulan toplam süre (örn: "1 gün 11 saat 26 dakika")

    last_updated: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    # Relationships
    lesson: Mapped["Lesson"] = relationship("Lesson", back_populates="note_tracking")  # noqa: F821
    history: Mapped[list["StatusHistory"]] = relationship(  # noqa: F821
        "StatusHistory", back_populates="note_tracking", cascade="all, delete-orphan",
        order_by="StatusHistory.changed_at.desc()"
    )

    def __repr__(self) -> str:
        return f"<NoteTracking(id={self.id}, status={self.status})>"
