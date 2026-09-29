"""
Not takip iş mantığı servisi.
Apps Script'teki onEdit fonksiyonunun Python karşılığı.
Her durum değişikliğinde doğru timestamp'leri ayarlar ve geçmişe yazar.
"""
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.note_tracking import NoteTracking, NoteStatus
from app.models.status_history import StatusHistory
from app.models.lesson import Lesson
from app.services.timer_service import now_local, format_elapsed


async def change_status(
    db: AsyncSession,
    tracking: NoteTracking,
    new_status: NoteStatus,
    changed_by: str | None = None,
) -> NoteTracking:
    """
    Durum değişikliğini işle. Apps Script'teki onEdit G sütunu bloğunun karşılığı.
    
    Her duruma göre:
    - İlgili timestamp alanlarını güncelle
    - Geçmiş kaydı yaz
    - final_upload_duration'ı dondur/aç
    """
    old_status = tracking.status
    now = now_local()

    # ── NOT HENÜZ ULAŞMADI (Sıfırlama) ──────────────────────────────────
    if new_status == NoteStatus.NOT_REACHED:
        tracking.mail_start_time = None
        tracking.review_start_time = None
        tracking.first_reject_date = None
        tracking.second_reject_date = None
        tracking.final_upload_duration = None

    # ── NOT MAİLDE ───────────────────────────────────────────────────────
    elif new_status == NoteStatus.IN_MAIL:
        tracking.final_upload_duration = None  # Dondurulan süreyi kaldır
        if not tracking.mail_start_time:
            tracking.mail_start_time = now

    # ── NOT DENETİMDE ────────────────────────────────────────────────────
    elif new_status == NoteStatus.REVIEW:
        if not tracking.mail_start_time:
            tracking.mail_start_time = now
        tracking.review_start_time = now  # Denetim sayacını sıfırla

    # ── 1. KEZ REDDEDİLDİ ────────────────────────────────────────────────
    elif new_status == NoteStatus.REJECTED_1:
        tracking.review_start_time = None  # Denetim sayacını durdur
        if not tracking.first_reject_date:
            tracking.first_reject_date = now

    # ── 2. KEZ DENETİMDE ─────────────────────────────────────────────────
    elif new_status == NoteStatus.REVIEW_2:
        tracking.review_start_time = now  # Denetim sayacını yenile
        # 1. denetim sayacı zaten silindi

    # ── 2. KEZ REDDEDİLDİ ────────────────────────────────────────────────
    elif new_status == NoteStatus.REJECTED_2:
        tracking.review_start_time = None  # Denetim sayacını durdur
        if not tracking.second_reject_date:
            tracking.second_reject_date = now

    # ── KABUL EDİLDİ / YÜKLENDİ ──────────────────────────────────────────
    elif new_status in (NoteStatus.ACCEPTED, NoteStatus.UPLOADED):
        tracking.review_start_time = None  # Denetim sayacını durdur
        # Toplam geçen süreyi dondur
        if tracking.mail_start_time:
            tracking.final_upload_duration = format_elapsed(tracking.mail_start_time, now)

    # Durumu güncelle
    tracking.status = new_status

    # Geçmişe yaz
    history_entry = StatusHistory(
        note_tracking_id=tracking.id,
        old_status=old_status,
        new_status=new_status,
        changed_by=changed_by,
        changed_at=now,
    )
    db.add(history_entry)

    return tracking


async def get_or_create_tracking(
    db: AsyncSession, lesson_id: str
) -> NoteTracking:
    """
    Bir ders için NoteTracking kaydını getir, yoksa oluştur.
    """
    result = await db.execute(
        select(NoteTracking).where(NoteTracking.lesson_id == lesson_id)
    )
    tracking = result.scalar_one_or_none()

    if not tracking:
        tracking = NoteTracking(
            lesson_id=lesson_id,
            status=NoteStatus.NOT_REACHED,
        )
        db.add(tracking)
        await db.flush()

    return tracking


async def bulk_create_tracking_for_module(
    db: AsyncSession, module_id: str
) -> int:
    """
    Bir modüldeki tüm dersler için NoteTracking kaydı oluştur (eğer yoksa).
    """
    # Modüldeki tüm dersleri bul
    lessons_result = await db.execute(
        select(Lesson).where(Lesson.module_id == module_id)
    )
    lessons = lessons_result.scalars().all()

    count = 0
    for lesson in lessons:
        existing = await db.execute(
            select(NoteTracking).where(NoteTracking.lesson_id == lesson.id)
        )
        if not existing.scalar_one_or_none():
            tracking = NoteTracking(
                lesson_id=lesson.id,
                status=NoteStatus.NOT_REACHED,
            )
            db.add(tracking)
            count += 1

    return count
