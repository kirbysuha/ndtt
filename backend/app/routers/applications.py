from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.routers.auth import get_current_admin
from app.models.module import Module
from app.models.lesson import Lesson
from app.models.note_application import NoteApplication, ApplicationStatus
from app.schemas.application import (
    ApplicationCreate,
    ApplicationStatusUpdate,
    ApplicationResponse,
    PublicNoteItem,
)
from app.utils.sort_utils import natural_sort_key

router = APIRouter(tags=["applications"])


# ─── Public (Öğrenci) Endpoint'leri ──────────────────────────────────────────
@router.get("/public/modules/{module_id}/notes", response_model=list[PublicNoteItem])
async def get_public_module_notes(module_id: str, db: AsyncSession = Depends(get_db)):
    """Öğrencilerin göreceği not durum listesi."""
    module = await db.scalar(select(Module).where(Module.id == module_id))
    if not module:
        raise HTTPException(status_code=404, detail="Modül bulunamadı")

    result = await db.execute(
        select(Lesson)
        .where(Lesson.module_id == module_id)
        .options(selectinload(Lesson.note_tracking))
    )
    lessons = list(result.scalars().all())
    lessons.sort(key=lambda l: (l.subject_name.lower(), natural_sort_key(l.order_label)))

    items = []
    for l in lessons:
        status_val = l.note_tracking.status.value if l.note_tracking else "Not henüz ulaşmadı"
        items.append(
            PublicNoteItem(
                lesson_id=l.id,
                subject_name=l.subject_name,
                order_label=l.order_label,
                topic=l.topic,
                lesson_date=str(l.lesson_date) if l.lesson_date else None,
                status=status_val,
                audio_status=l.audio_status,
            )
        )
    return items


@router.post("/public/applications", response_model=ApplicationResponse, status_code=status.HTTP_201_CREATED)
async def create_student_application(data: ApplicationCreate, db: AsyncSession = Depends(get_db)):
    """Öğrencinin not başvurusunda bulunması."""
    module = await db.scalar(select(Module).where(Module.id == data.module_id))
    if not module:
        raise HTTPException(status_code=404, detail="Modül bulunamadı")

    app = NoteApplication(
        module_id=data.module_id,
        lesson_id=data.lesson_id,
        student_name=data.student_name,
        student_number=data.student_number,
        student_email=data.student_email,
        message=data.message,
        status=ApplicationStatus.PENDING,
    )
    db.add(app)
    await db.flush()

    lesson_name = None
    if data.lesson_id:
        l = await db.scalar(select(Lesson).where(Lesson.id == data.lesson_id))
        if l:
            lesson_name = f"{l.subject_name} {l.order_label or ''}".strip()

    return ApplicationResponse(
        id=app.id,
        module_id=app.module_id,
        lesson_id=app.lesson_id,
        student_name=app.student_name,
        student_number=app.student_number,
        student_email=app.student_email,
        message=app.message,
        status=app.status,
        admin_note=app.admin_note,
        created_at=app.created_at,
        updated_at=app.updated_at,
        module_name=module.name,
        lesson_name=lesson_name,
    )


# ─── Admin Endpoint'leri ──────────────────────────────────────────────────────
@router.get("/applications", response_model=list[ApplicationResponse])
async def list_applications(
    module_id: str | None = None,
    db: AsyncSession = Depends(get_db),
    admin: dict = Depends(get_current_admin),
):
    """Tüm not başvurularını listele."""
    query = (
        select(NoteApplication)
        .options(selectinload(NoteApplication.module), selectinload(NoteApplication.lesson))
        .order_by(NoteApplication.created_at.desc())
    )
    if module_id:
        query = query.where(NoteApplication.module_id == module_id)

    result = await db.execute(query)
    apps = result.scalars().all()

    response = []
    for a in apps:
        l_name = f"{a.lesson.subject_name} {a.lesson.order_label or ''}".strip() if a.lesson else None
        response.append(
            ApplicationResponse(
                id=a.id,
                module_id=a.module_id,
                lesson_id=a.lesson_id,
                student_name=a.student_name,
                student_number=a.student_number,
                student_email=a.student_email,
                message=a.message,
                status=a.status,
                admin_note=a.admin_note,
                created_at=a.created_at,
                updated_at=a.updated_at,
                module_name=a.module.name if a.module else None,
                lesson_name=l_name,
            )
        )
    return response


@router.put("/applications/{app_id}/status", response_model=ApplicationResponse)
async def update_application_status(
    app_id: str,
    data: ApplicationStatusUpdate,
    db: AsyncSession = Depends(get_db),
    admin: dict = Depends(get_current_admin),
):
    """Başvurunun onay/ret durumunu güncelle."""
    result = await db.execute(
        select(NoteApplication)
        .where(NoteApplication.id == app_id)
        .options(selectinload(NoteApplication.module), selectinload(NoteApplication.lesson))
    )
    app = result.scalar_one_or_none()
    if not app:
        raise HTTPException(status_code=404, detail="Başvuru bulunamadı")

    app.status = data.status
    if data.admin_note is not None:
        app.admin_note = data.admin_note

    l_name = f"{app.lesson.subject_name} {app.lesson.order_label or ''}".strip() if app.lesson else None
    return ApplicationResponse(
        id=app.id,
        module_id=app.module_id,
        lesson_id=app.lesson_id,
        student_name=app.student_name,
        student_number=app.student_number,
        student_email=app.student_email,
        message=app.message,
        status=app.status,
        admin_note=app.admin_note,
        created_at=app.created_at,
        updated_at=app.updated_at,
        module_name=app.module.name if app.module else None,
        lesson_name=l_name,
    )


@router.delete("/applications/{app_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_application(
    app_id: str,
    db: AsyncSession = Depends(get_db),
    admin: dict = Depends(get_current_admin),
):
    app = await db.scalar(select(NoteApplication).where(NoteApplication.id == app_id))
    if not app:
        raise HTTPException(status_code=404, detail="Başvuru bulunamadı")
    await db.delete(app)

