from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.database import get_db
from app.routers.auth import get_current_admin
from app.models.class_model import Class
from app.models.module import Module
from app.models.lesson import Lesson
from app.schemas import ModuleCreate, ModuleUpdate, ModuleResponse

router = APIRouter(tags=["modules"])


@router.get("/classes/{class_id}/modules", response_model=list[ModuleResponse])
async def list_modules(class_id: str, db: AsyncSession = Depends(get_db)):
    # Sınıf var mı kontrol et
    cls = await db.scalar(select(Class).where(Class.id == class_id))
    if not cls:
        raise HTTPException(status_code=404, detail="Sınıf bulunamadı")

    result = await db.execute(
        select(Module).where(Module.class_id == class_id).order_by(Module.order)
    )
    modules = result.scalars().all()

    response = []
    for m in modules:
        lesson_count = await db.scalar(select(func.count()).where(Lesson.module_id == m.id))
        response.append(ModuleResponse(
            id=m.id, class_id=m.class_id, name=m.name,
            description=m.description, order=m.order,
            created_at=m.created_at, updated_at=m.updated_at,
            lesson_count=lesson_count or 0,
        ))
    return response


@router.post("/classes/{class_id}/modules", response_model=ModuleResponse, status_code=status.HTTP_201_CREATED)
async def create_module(
    class_id: str,
    data: ModuleCreate,
    db: AsyncSession = Depends(get_db),
    admin: dict = Depends(get_current_admin),
):
    cls = await db.scalar(select(Class).where(Class.id == class_id))
    if not cls:
        raise HTTPException(status_code=404, detail="Sınıf bulunamadı")

    module = Module(
        class_id=class_id,
        name=data.name,
        description=data.description,
        order=data.order,
    )
    db.add(module)
    await db.flush()
    return ModuleResponse(
        id=module.id, class_id=module.class_id, name=module.name,
        description=module.description, order=module.order,
        created_at=module.created_at, updated_at=module.updated_at,
        lesson_count=0,
    )


@router.get("/modules/{module_id}", response_model=ModuleResponse)
async def get_module(module_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Module).where(Module.id == module_id))
    m = result.scalar_one_or_none()
    if not m:
        raise HTTPException(status_code=404, detail="Modül bulunamadı")
    lesson_count = await db.scalar(select(func.count()).where(Lesson.module_id == m.id))
    return ModuleResponse(
        id=m.id, class_id=m.class_id, name=m.name,
        description=m.description, order=m.order,
        created_at=m.created_at, updated_at=m.updated_at,
        lesson_count=lesson_count or 0,
    )


@router.put("/modules/{module_id}", response_model=ModuleResponse)
async def update_module(
    module_id: str,
    data: ModuleUpdate,
    db: AsyncSession = Depends(get_db),
    admin: dict = Depends(get_current_admin),
):
    result = await db.execute(select(Module).where(Module.id == module_id))
    m = result.scalar_one_or_none()
    if not m:
        raise HTTPException(status_code=404, detail="Modül bulunamadı")
    if data.name is not None:
        m.name = data.name
    if data.description is not None:
        m.description = data.description
    if data.order is not None:
        m.order = data.order
    lesson_count = await db.scalar(select(func.count()).where(Lesson.module_id == m.id))
    return ModuleResponse(
        id=m.id, class_id=m.class_id, name=m.name,
        description=m.description, order=m.order,
        created_at=m.created_at, updated_at=m.updated_at,
        lesson_count=lesson_count or 0,
    )


@router.delete("/modules/{module_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_module(
    module_id: str,
    db: AsyncSession = Depends(get_db),
    admin: dict = Depends(get_current_admin),
):
    result = await db.execute(select(Module).where(Module.id == module_id))
    m = result.scalar_one_or_none()
    if not m:
        raise HTTPException(status_code=404, detail="Modül bulunamadı")
    await db.delete(m)
