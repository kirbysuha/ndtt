"""
Süre hesaplama servisi.
Apps Script'teki calculateSubmissionTime, calculateReviewTime,
calculateLimitedCorrectionTime, formatElapsed fonksiyonlarının Python karşılığı.

Fark: Apps Script'te bu değerler her dakika veritabanına yazılıyordu.
Burada her API isteğinde anlık hesaplanıyor → daha doğru ve verimli.
"""
from datetime import datetime, timezone, date
from zoneinfo import ZoneInfo

TZ = ZoneInfo("Europe/Istanbul")


def now_local() -> datetime:
    """Şu anki zamanı Istanbul timezone ile döndür."""
    return datetime.now(tz=TZ)


def calculate_submission_time(lesson_date: date | None, now: datetime | None = None) -> str:
    """
    H Sütunu: Notun gönderilmesi için kalan süre.
    Ders tarihinden itibaren 3 gün içinde gönderilmeli.
    
    Apps Script:
        if diffDays < 0: return ""
        if diffDays === 0: return "3 gün kaldı"
        if diffDays === 1: return "2 gün kaldı"
        if diffDays === 2: return "1 gün kaldı"
        if diffDays === 3: return "son gün"
        return (diffDays - 3) + " gün gecikti"
    """
    if not lesson_date:
        return ""

    if now is None:
        now = now_local()

    today = now.date() if hasattr(now, "date") else now
    if isinstance(today, datetime):
        today = today.date()

    diff_days = (today - lesson_date).days

    if diff_days < 0:
        return ""
    if diff_days == 0:
        return "3 gün kaldı"
    if diff_days == 1:
        return "2 gün kaldı"
    if diff_days == 2:
        return "1 gün kaldı"
    if diff_days == 3:
        return "son gün"

    return f"{diff_days - 3} gün gecikti"


def calculate_review_time(start_time: datetime | None, now: datetime | None = None, limit_hours: int = 24) -> str:
    """
    I Sütunu: Denetim süresi (24 saat countdown).
    
    Apps Script:
        if (elapsedHours < limitHours) return remainingHours + " saat kaldı"
        return "Süre bitti"
    """
    if not start_time:
        return "-"

    if now is None:
        now = now_local()

    # Timezone-aware karşılaştırma
    if start_time.tzinfo is None:
        start_time = start_time.replace(tzinfo=TZ)
    if now.tzinfo is None:
        now = now.replace(tzinfo=TZ)

    elapsed_ms = (now - start_time).total_seconds() * 1000
    if elapsed_ms < 0:
        return f"{limit_hours} saat kaldı"

    elapsed_hours = elapsed_ms / (1000 * 60 * 60)
    if elapsed_hours < limit_hours:
        remaining_hours = int(limit_hours - elapsed_hours) + (1 if (limit_hours - elapsed_hours) % 1 > 0 else 0)
        remaining_hours = max(1, remaining_hours)
        return f"{remaining_hours} saat kaldı"

    return "Süre bitti"


def calculate_limited_correction_time(start_time: datetime | None, now: datetime | None = None, allowed_hours: int = 24) -> str:
    """
    K ve M Sütunları: 1. ve 2. Red düzeltilme süreleri.
    İlk 24 saat: geri sayım. 24 saatten sonra: gecikme saati (max 24 saat göster).
    
    Apps Script:
        if (elapsedHours < allowedHours) return "X saat kaldı"
        var lateHours = Math.min(Math.floor(elapsedHours - allowedHours), allowedHours)
        return lateHours + " saat gecikti"
    """
    if not start_time:
        return "-"

    if now is None:
        now = now_local()

    if start_time.tzinfo is None:
        start_time = start_time.replace(tzinfo=TZ)
    if now.tzinfo is None:
        now = now.replace(tzinfo=TZ)

    elapsed_ms = (now - start_time).total_seconds() * 1000
    if elapsed_ms < 0:
        return f"{allowed_hours} saat kaldı"

    elapsed_hours = elapsed_ms / (1000 * 60 * 60)
    if elapsed_hours < allowed_hours:
        import math
        return f"{math.ceil(allowed_hours - elapsed_hours)} saat kaldı"

    late_hours = min(int(elapsed_hours - allowed_hours), allowed_hours)
    if late_hours <= 0:
        return "Süre bitti"

    return f"{late_hours} saat gecikti"


def format_elapsed(start_time: datetime | None, now: datetime | None = None) -> str:
    """
    N Sütunu: Notun yüklenme süresi (toplam geçen süre).
    
    Apps Script:
        return days + " gün " + hours + " saat " + minutes + " dakika"
    """
    if not start_time:
        return "-"

    if now is None:
        now = now_local()

    if start_time.tzinfo is None:
        start_time = start_time.replace(tzinfo=TZ)
    if now.tzinfo is None:
        now = now.replace(tzinfo=TZ)

    total_minutes = int((now - start_time).total_seconds() / 60)
    if total_minutes < 0:
        total_minutes = 0

    days = total_minutes // 1440
    total_minutes %= 1440
    hours = total_minutes // 60
    minutes = total_minutes % 60

    return f"{days} gün {hours} saat {minutes} dakika"


def get_submission_status_color(value: str) -> str:
    """Frontend için renk kodu belirle."""
    if not value or value == "":
        return "gray"
    if "gecikti" in value:
        return "red"
    if "son gün" in value:
        return "orange"
    if "kaldı" in value:
        return "green"
    return "gray"


def get_review_status_color(value: str) -> str:
    """Denetim süresi için renk kodu."""
    if value == "Süre bitti":
        return "red"
    if "kaldı" in value:
        return "green"
    return "gray"


def get_correction_status_color(value: str) -> str:
    """Red düzeltme süresi için renk kodu."""
    if "gecikti" in value:
        return "red"
    if "Süre bitti" in value:
        return "red"
    if "kaldı" in value:
        return "green"
    return "gray"
