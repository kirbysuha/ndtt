from datetime import datetime
from pydantic import BaseModel
from app.models.note_tracking import NoteStatus


class StatusChangeRequest(BaseModel):
    status: NoteStatus
    changed_by: str | None = None


class StatusHistoryResponse(BaseModel):
    id: str
    old_status: NoteStatus | None
    new_status: NoteStatus
    changed_by: str | None
    changed_at: datetime

    model_config = {"from_attributes": True}


class TrackingResponse(BaseModel):
    """Ham NoteTracking verisi (timestamp'ler dahil)."""
    id: str
    lesson_id: str
    status: NoteStatus
    mail_start_time: datetime | None
    review_start_time: datetime | None
    first_reject_date: datetime | None
    second_reject_date: datetime | None
    final_upload_duration: str | None
    last_updated: datetime

    model_config = {"from_attributes": True}


class TrackingTableRow(BaseModel):
    """
    Hesaplanmış süreler dahil tam tablo satırı.
    Frontend'in tabloyu render etmek için ihtiyaç duyduğu tüm bilgileri içerir.
    Apps Script'teki updateCounters çıktısının karşılığı.
    """
    # Kimlik
    tracking_id: str
    lesson_id: str

    # Ders bilgileri (A-F sütunları)
    last_updated: datetime | None
    subject_name: str
    order_label: str | None
    topic: str | None
    lesson_date: datetime | None
    assigned_team: str | None

    # G sütunu - Notun Durumu
    status: NoteStatus

    # Hesaplanmış süreler (H, I, K, M, N sütunları)
    submission_time: str       # H - Gönderilmesi için kalan süre
    review_time: str           # I - Denetim süresi
    first_reject_correction: str   # K - 1. Red düzeltilme süresi
    second_reject_correction: str  # M - 2. Red düzeltilme süresi
    upload_duration: str       # N - Notun yüklenme süresi

    # Renk kodları (frontend için)
    submission_color: str
    review_color: str
    first_reject_color: str
    second_reject_color: str

    # Ekstra alanlar
    audio_status: str | None
    first_reject_date: datetime | None
    second_reject_date: datetime | None
