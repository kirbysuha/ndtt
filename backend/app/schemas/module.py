from datetime import datetime
from pydantic import BaseModel, Field


class ModuleBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: str | None = None
    order: int = 1


class ModuleCreate(ModuleBase):
    pass


class ModuleUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=255)
    description: str | None = None
    order: int | None = None


class ModuleResponse(ModuleBase):
    id: str
    class_id: str
    created_at: datetime
    updated_at: datetime
    lesson_count: int = 0

    model_config = {"from_attributes": True}
