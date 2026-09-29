import uuid
import enum
from datetime import datetime
from sqlalchemy import String, DateTime, ForeignKey, func, Text, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class ApplicationStatus(str, enum.Enum):
    PENDING = "Beklemede"
    APPROVED = "Onaylandı"
    REJECTED = "Reddedildi"


class NoteApplication(Base):
    __tablename__ = "note_applications"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    module_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("modules.id", ondelete="CASCADE"), nullable=False
    )
    lesson_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("lessons.id", ondelete="SET NULL"), nullable=True
    )
    student_name: Mapped[str] = mapped_column(String(255), nullable=False)
    student_number: Mapped[str | None] = mapped_column(String(50), nullable=True)
    student_email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    message: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[ApplicationStatus] = mapped_column(
        SAEnum(ApplicationStatus, name="application_status_enum", create_type=True),
        default=ApplicationStatus.PENDING,
        nullable=False,
    )
    admin_note: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    module: Mapped["Module"] = relationship("Module")  # noqa: F821
    lesson: Mapped["Lesson | None"] = relationship("Lesson")  # noqa: F821

    def __repr__(self) -> str:
        return f"<NoteApplication(id={self.id}, student={self.student_name}, status={self.status})>"
