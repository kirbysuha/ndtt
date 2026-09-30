from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.routers.auth import get_current_admin
from app.models.module import Module
from app.models.lesson import Lesson
from app.models.note_tracking import NoteTracking, NoteStatus
from app.schemas import LessonCreate, LessonUpdate, LessonResponse, LessonBulkCreate

router = APIRouter(tags=["lessons"])


@router.get("/modules/{module_id}/lessons", response_model=list[LessonResponse])
async def list_lessons(module_id: str, db: AsyncSession = Depends(get_db)):
    m = await db.scalar(select(Module).where(Module.id == module_id))
    if not m:
        raise HTTPException(status_code=404, detail="Modül bulunamadı")

    result = await db.execute(
        select(Lesson).where(Lesson.module_id == module_id)
    )
    lessons = list(result.scalars().all())
    from app.utils.sort_utils import natural_sort_key
    lessons.sort(key=lambda l: (l.subject_name.lower(), natural_sort_key(l.order_label)))
    return lessons


@router.post("/modules/{module_id}/lessons", response_model=LessonResponse, status_code=status.HTTP_201_CREATED)
async def create_lesson(
    module_id: str,
    data: LessonCreate,
    db: AsyncSession = Depends(get_db),
    admin: dict = Depends(get_current_admin),
):
    m = await db.scalar(select(Module).where(Module.id == module_id))
    if not m:
        raise HTTPException(status_code=404, detail="Modül bulunamadı")

    lesson = Lesson(
        module_id=module_id,
        subject_name=data.subject_name,
        order_label=data.order_label,
        topic=data.topic,
        lesson_date=data.lesson_date,
        assigned_team=data.assigned_team,
        audio_status=data.audio_status,
    )
    db.add(lesson)
    await db.flush()

    # Otomatik NoteTracking kaydı oluştur
    tracking = NoteTracking(lesson_id=lesson.id, status=NoteStatus.NOT_REACHED)
    db.add(tracking)

    return lesson


@router.post("/modules/{module_id}/lessons/bulk", status_code=status.HTTP_201_CREATED)
async def bulk_create_lessons(
    module_id: str,
    data: LessonBulkCreate,
    db: AsyncSession = Depends(get_db),
    admin: dict = Depends(get_current_admin),
):
    m = await db.scalar(select(Module).where(Module.id == module_id))
    if not m:
        raise HTTPException(status_code=404, detail="Modül bulunamadı")

    created = []
    for lesson_data in data.lessons:
        lesson = Lesson(
            module_id=module_id,
            subject_name=lesson_data.subject_name,
            order_label=lesson_data.order_label,
            topic=lesson_data.topic,
            lesson_date=lesson_data.lesson_date,
            assigned_team=lesson_data.assigned_team,
            audio_status=lesson_data.audio_status,
        )
        db.add(lesson)
        await db.flush()
        tracking = NoteTracking(lesson_id=lesson.id, status=NoteStatus.NOT_REACHED)
        db.add(tracking)
        created.append(lesson.id)

    return {"created": len(created), "lesson_ids": created}


@router.get("/lessons/{lesson_id}", response_model=LessonResponse)
async def get_lesson(lesson_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Lesson).where(Lesson.id == lesson_id))
    lesson = result.scalar_one_or_none()
    if not lesson:
        raise HTTPException(status_code=404, detail="Ders bulunamadı")
    return lesson


@router.put("/lessons/{lesson_id}", response_model=LessonResponse)
async def update_lesson(
    lesson_id: str,
    data: LessonUpdate,
    db: AsyncSession = Depends(get_db),
    admin: dict = Depends(get_current_admin),
):
    result = await db.execute(select(Lesson).where(Lesson.id == lesson_id))
    lesson = result.scalar_one_or_none()
    if not lesson:
        raise HTTPException(status_code=404, detail="Ders bulunamadı")

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(lesson, field, value)
    return lesson


@router.delete("/lessons/{lesson_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_lesson(
    lesson_id: str,
    db: AsyncSession = Depends(get_db),
    admin: dict = Depends(get_current_admin),
):
    result = await db.execute(select(Lesson).where(Lesson.id == lesson_id))
    lesson = result.scalar_one_or_none()
    if not lesson:
        raise HTTPException(status_code=404, detail="Ders bulunamadı")
    await db.delete(lesson)
