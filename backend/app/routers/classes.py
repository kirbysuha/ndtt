from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.database import get_db
from app.routers.auth import get_current_admin
from app.models.class_model import Class
from app.models.module import Module
from app.schemas import ClassCreate, ClassUpdate, ClassResponse

router = APIRouter(prefix="/classes", tags=["classes"])


@router.get("", response_model=list[ClassResponse])
async def list_classes(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Class).order_by(Class.created_at.desc()))
    classes = result.scalars().all()

    response = []
    for c in classes:
        module_count = await db.scalar(
            select(func.count()).where(Module.class_id == c.id)
        )
        response.append(ClassResponse(
            id=c.id,
            name=c.name,
            description=c.description,
            created_at=c.created_at,
            updated_at=c.updated_at,
            module_count=module_count or 0,
        ))
    return response


@router.post("", response_model=ClassResponse, status_code=status.HTTP_201_CREATED)
async def create_class(
    data: ClassCreate,
    db: AsyncSession = Depends(get_db),
    admin: dict = Depends(get_current_admin),
):
    new_class = Class(name=data.name, description=data.description)
    db.add(new_class)
    await db.flush()
    return ClassResponse(
        id=new_class.id,
        name=new_class.name,
        description=new_class.description,
        created_at=new_class.created_at,
        updated_at=new_class.updated_at,
        module_count=0,
    )


@router.get("/{class_id}", response_model=ClassResponse)
async def get_class(class_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Class).where(Class.id == class_id))
    c = result.scalar_one_or_none()
    if not c:
        raise HTTPException(status_code=404, detail="Sınıf bulunamadı")
    module_count = await db.scalar(select(func.count()).where(Module.class_id == c.id))
    return ClassResponse(
        id=c.id, name=c.name, description=c.description,
        created_at=c.created_at, updated_at=c.updated_at,
        module_count=module_count or 0,
    )


@router.put("/{class_id}", response_model=ClassResponse)
async def update_class(
    class_id: str,
    data: ClassUpdate,
    db: AsyncSession = Depends(get_db),
    admin: dict = Depends(get_current_admin),
):
    result = await db.execute(select(Class).where(Class.id == class_id))
    c = result.scalar_one_or_none()
    if not c:
        raise HTTPException(status_code=404, detail="Sınıf bulunamadı")
    if data.name is not None:
        c.name = data.name
    if data.description is not None:
        c.description = data.description
    module_count = await db.scalar(select(func.count()).where(Module.class_id == c.id))
    return ClassResponse(
        id=c.id, name=c.name, description=c.description,
        created_at=c.created_at, updated_at=c.updated_at,
        module_count=module_count or 0,
    )


@router.delete("/{class_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_class(
    class_id: str,
    db: AsyncSession = Depends(get_db),
    admin: dict = Depends(get_current_admin),
):
    result = await db.execute(select(Class).where(Class.id == class_id))
    c = result.scalar_one_or_none()
    if not c:
        raise HTTPException(status_code=404, detail="Sınıf bulunamadı")
    await db.delete(c)
