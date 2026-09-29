from datetime import datetime
from pydantic import BaseModel, Field


class ClassBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: str | None = None


class ClassCreate(ClassBase):
    pass


class ClassUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=255)
    description: str | None = None


class ClassResponse(ClassBase):
    id: str
    created_at: datetime
    updated_at: datetime
    module_count: int = 0

    model_config = {"from_attributes": True}
