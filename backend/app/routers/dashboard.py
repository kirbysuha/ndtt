from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.database import get_db
from app.models.class_model import Class
from app.models.module import Module
from app.models.lesson import Lesson
from app.models.note_tracking import NoteTracking, NoteStatus

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/stats")
async def get_dashboard_stats(db: AsyncSession = Depends(get_db)):
    """Genel istatistikler: sınıf, modül, ders ve not durumu özetleri."""
    total_classes = await db.scalar(select(func.count(Class.id)))
    total_modules = await db.scalar(select(func.count(Module.id)))
    total_lessons = await db.scalar(select(func.count(Lesson.id)))
    total_tracking = await db.scalar(select(func.count(NoteTracking.id)))

    # Durum bazlı sayılar
    status_counts = {}
    for status in NoteStatus:
        count = await db.scalar(
            select(func.count(NoteTracking.id)).where(NoteTracking.status == status)
        )
        status_counts[status.value] = count or 0

    # Geciken notlar (Not mailde ama gönderilme süresi geçmiş - lesson_date + 3 gün)
    from datetime import date, timedelta
    today = date.today()
    deadline_date = today - timedelta(days=3)

    late_notes = await db.scalar(
        select(func.count(NoteTracking.id))
        .join(Lesson, NoteTracking.lesson_id == Lesson.id)
        .where(
            NoteTracking.status == NoteStatus.NOT_REACHED,
            Lesson.lesson_date <= deadline_date,
            Lesson.lesson_date.is_not(None),
        )
    )

    return {
        "total_classes": total_classes or 0,
        "total_modules": total_modules or 0,
        "total_lessons": total_lessons or 0,
        "total_tracking": total_tracking or 0,
        "status_counts": status_counts,
        "late_notes": late_notes or 0,
    }


@router.get("/module-stats/{module_id}")
async def get_module_stats(module_id: str, db: AsyncSession = Depends(get_db)):
    """Bir modülün özet istatistikleri."""
    total = await db.scalar(
        select(func.count(Lesson.id)).where(Lesson.module_id == module_id)
    )

    status_counts = {}
    for status in NoteStatus:
        count = await db.scalar(
            select(func.count(NoteTracking.id))
            .join(Lesson, NoteTracking.lesson_id == Lesson.id)
            .where(Lesson.module_id == module_id, NoteTracking.status == status)
        )
        status_counts[status.value] = count or 0

    uploaded = status_counts.get(NoteStatus.UPLOADED.value, 0) + status_counts.get(NoteStatus.ACCEPTED.value, 0)
    pending = total - uploaded if total else 0

    return {
        "module_id": module_id,
        "total_lessons": total or 0,
        "uploaded": uploaded,
        "pending": pending,
        "completion_rate": round((uploaded / total * 100), 1) if total else 0,
        "status_counts": status_counts,
    }
