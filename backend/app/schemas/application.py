from datetime import datetime
from pydantic import BaseModel, Field
from app.models.note_application import ApplicationStatus


class ApplicationBase(BaseModel):
    module_id: str
    lesson_id: str | None = None
    student_name: str = Field(..., min_length=1, max_length=255)
    student_number: str | None = None
    student_email: str | None = None
    message: str | None = None


class ApplicationCreate(ApplicationBase):
    pass


class ApplicationStatusUpdate(BaseModel):
    status: ApplicationStatus
    admin_note: str | None = None


class ApplicationResponse(ApplicationBase):
    id: str
    status: ApplicationStatus
    admin_note: str | None
    created_at: datetime
    updated_at: datetime
    module_name: str | None = None
    lesson_name: str | None = None

    model_config = {"from_attributes": True}


class PublicNoteItem(BaseModel):
    lesson_id: str
    subject_name: str
    order_label: str | None
    topic: str | None
    lesson_date: str | None
    status: str
    audio_status: str | None
