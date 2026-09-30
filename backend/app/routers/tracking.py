from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.lesson import Lesson
from app.models.note_tracking import NoteTracking, NoteStatus
from app.schemas import (
    TrackingResponse, TrackingTableRow, StatusChangeRequest, StatusHistoryResponse
)
from app.routers.auth import get_current_admin
from app.services.tracking_service import change_status, get_or_create_tracking
from app.services.timer_service import (
    now_local,
    calculate_submission_time,
    calculate_review_time,
    calculate_limited_correction_time,
    format_elapsed,
    get_submission_status_color,
    get_review_status_color,
    get_correction_status_color,
)

router = APIRouter(tags=["tracking"])


def build_table_row(lesson: Lesson, tracking: NoteTracking) -> TrackingTableRow:
    """
    Anlık süre hesaplamaları yaparak tam tablo satırı oluştur.
    Apps Script'teki updateCounters'ın karşılığı.
    """
    now = now_local()
    status = tracking.status

    # H — Gönderilme süresi
    if status in (NoteStatus.IN_MAIL, NoteStatus.UPLOADED, NoteStatus.ACCEPTED) or tracking.mail_start_time:
        submission_time = "-"
    else:
        submission_time = calculate_submission_time(lesson.lesson_date, now)
    submission_color = get_submission_status_color(submission_time)

    # I — Denetim süresi
    if status in (NoteStatus.REVIEW, NoteStatus.REVIEW_2):
        review_time = calculate_review_time(tracking.review_start_time, now, 24)
        review_color = get_review_status_color(review_time)
    else:
        review_time = "-"
        review_color = "gray"

    # K — 1. Red düzeltme süresi
    if status == NoteStatus.REJECTED_1:
        first_reject_correction = calculate_limited_correction_time(tracking.first_reject_date, now, 24)
        first_reject_color = get_correction_status_color(first_reject_correction)
    else:
        first_reject_correction = "-"
        first_reject_color = "gray"

    # M — 2. Red düzeltme süresi
    if status == NoteStatus.REJECTED_2:
        second_reject_correction = calculate_limited_correction_time(tracking.second_reject_date, now, 24)
        second_reject_color = get_correction_status_color(second_reject_correction)
    else:
        second_reject_correction = "-"
        second_reject_color = "gray"

    # N — Notun yüklenme süresi
    if status in (NoteStatus.UPLOADED, NoteStatus.ACCEPTED):
        upload_duration = tracking.final_upload_duration or "-"
    elif tracking.mail_start_time:
        upload_duration = format_elapsed(tracking.mail_start_time, now)
    else:
        upload_duration = "-"

    return TrackingTableRow(
        tracking_id=tracking.id, lesson_id=lesson.id,
        last_updated=tracking.last_updated,
        subject_name=lesson.subject_name, order_label=lesson.order_label,
        topic=lesson.topic, lesson_date=lesson.lesson_date,
        assigned_team=lesson.assigned_team, status=status,
        submission_time=submission_time, review_time=review_time,
        first_reject_correction=first_reject_correction,
        second_reject_correction=second_reject_correction,
        upload_duration=upload_duration,
        submission_color=submission_color, review_color=review_color,
        first_reject_color=first_reject_color, second_reject_color=second_reject_color,
        audio_status=lesson.audio_status,
        first_reject_date=tracking.first_reject_date,
        second_reject_date=tracking.second_reject_date,
    )


@router.get("/modules/{module_id}/tracking", response_model=list[TrackingTableRow])
async def get_module_tracking(module_id: str, db: AsyncSession = Depends(get_db)):
    """Modüldeki tüm derslerin not takip tablosunu döndür (süreler anlık hesaplanır)."""
    result = await db.execute(
        select(Lesson)
        .where(Lesson.module_id == module_id)
        .options(selectinload(Lesson.note_tracking))
        .order_by(Lesson.subject_name, Lesson.order_label)
    )
    lessons = list(result.scalars().all())
    from app.utils.sort_utils import natural_sort_key
    lessons.sort(key=lambda l: (l.subject_name.lower(), natural_sort_key(l.order_label)))

    rows = []
    for lesson in lessons:
        if not lesson.note_tracking:
            tracking = await get_or_create_tracking(db, lesson.id)
        else:
            tracking = lesson.note_tracking
        rows.append(build_table_row(lesson, tracking))
    return rows

@router.get("/tracking/recent", response_model=list[TrackingTableRow])
async def get_recent_tracking(
    days: int = 10,
    module_id: str | None = None,
    db: AsyncSession = Depends(get_db),
):
    """
    Son X günde işlenen (veya güncel) dersleri listeler.
    Ders tarihi son 'days' gün içinde olan kayıtları döndürür.
    """
    from datetime import timedelta
    today = now_local().date()
    start_date = today - timedelta(days=days)

    query = (
        select(Lesson)
        .where(Lesson.lesson_date >= start_date, Lesson.lesson_date <= today)
        .options(selectinload(Lesson.note_tracking))
    )
    if module_id:
        query = query.where(Lesson.module_id == module_id)

    query = query.order_by(Lesson.lesson_date.desc(), Lesson.subject_name.asc(), Lesson.order_label.asc())
    result = await db.execute(query)
    lessons = list(result.scalars().all())

    rows = []
    for lesson in lessons:
        if not lesson.note_tracking:
            tracking = await get_or_create_tracking(db, lesson.id)
        else:
            tracking = lesson.note_tracking
        rows.append(build_table_row(lesson, tracking))
    return rows




@router.put("/tracking/{tracking_id}/status", response_model=TrackingTableRow)
async def update_tracking_status(
    tracking_id: str,
    data: StatusChangeRequest,
    db: AsyncSession = Depends(get_db),
    admin: dict = Depends(get_current_admin),
):
    """Not durumunu güncelle. Apps Script'teki onEdit G sütunu işleminin karşılığı."""
    result = await db.execute(
        select(NoteTracking)
        .where(NoteTracking.id == tracking_id)
        .options(selectinload(NoteTracking.lesson))
    )
    tracking = result.scalar_one_or_none()
    if not tracking:
        raise HTTPException(status_code=404, detail="Takip kaydı bulunamadı")

    await change_status(db, tracking, data.status, data.changed_by)
    return build_table_row(tracking.lesson, tracking)


@router.get("/tracking/{tracking_id}", response_model=TrackingResponse)
async def get_tracking(tracking_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(NoteTracking).where(NoteTracking.id == tracking_id))
    tracking = result.scalar_one_or_none()
    if not tracking:
        raise HTTPException(status_code=404, detail="Takip kaydı bulunamadı")
    return tracking


@router.get("/tracking/{tracking_id}/history", response_model=list[StatusHistoryResponse])
async def get_tracking_history(tracking_id: str, db: AsyncSession = Depends(get_db)):
    """Durum değişim geçmişi."""
    result = await db.execute(
        select(NoteTracking)
        .where(NoteTracking.id == tracking_id)
        .options(selectinload(NoteTracking.history))
    )
    tracking = result.scalar_one_or_none()
    if not tracking:
        raise HTTPException(status_code=404, detail="Takip kaydı bulunamadı")
    return tracking.history

