from datetime import datetime, date
from pydantic import BaseModel, Field


class LessonBase(BaseModel):
    subject_name: str = Field(..., min_length=1, max_length=255)
    order_label: str | None = None
    topic: str | None = None
    lesson_date: date | None = None
    assigned_team: str | None = None
    audio_status: str | None = None


class LessonCreate(LessonBase):
    pass


class LessonUpdate(BaseModel):
    subject_name: str | None = Field(None, min_length=1, max_length=255)
    order_label: str | None = None
    topic: str | None = None
    lesson_date: date | None = None
    assigned_team: str | None = None
    audio_status: str | None = None


class LessonBulkCreate(BaseModel):
    lessons: list[LessonCreate]


class LessonResponse(LessonBase):
    id: str
    module_id: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
