"""
Modül Haftalık Ders Programı PDF Ayrıştırıcı ve İçe Aktarma Servisi.
PyMuPDF (fitz) ile PDF tablolarını tarar, yalnızca Sunum ve Uygulama derslerini ayıklar.
PDÖ, Seçmeli dersler vb. hariç tutulur. 1.Y / 2.Y uygulama dersleri birleştirilir.
"""
import re
from datetime import datetime, date
import fitz
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.lesson import Lesson
from app.models.note_tracking import NoteTracking, NoteStatus
from app.services.timer_service import now_local

SUBJECT_MAPPING = {
    "anatomi": "ANATOMİ",
    "fizyoloji": "FİZYOLOJİ",
    "histoloji": "HİSTOLOJİ VE EMBRİYOLOJİ",
    "embriyoloji": "HİSTOLOJİ VE EMBRİYOLOJİ",
    "histoloji‐embriyoloji": "HİSTOLOJİ VE EMBRİYOLOJİ",
    "histoloji-embriyoloji": "HİSTOLOJİ VE EMBRİYOLOJİ",
    "biyokimya": "TIBBİ BİYOKİMYA",
    "tıbbi biyokimya": "TIBBİ BİYOKİMYA",
    "biyofizik": "BİYOFİZİK",
    "toplum sağlığı": "TOPLUM SAĞLIĞI",
    "tib": "TİB",
    "tıb": "TİB",
    "tıp tarihi ve etik": "TİB",
    "tıp tarihi": "TİB",
}

EXCLUDED_KEYWORDS = [
    "seçmeli", "pdö", "bç", "bağımsız", "geri bildirim",
    "ingilizce", "atatürk", "öğrenci grup", "olgu sunumu",
    "mb/pdö", "kariyer", "ne öğrendik", "iletişim becerisi",
]

def clean_spaces(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip()

def normalize_subject(name: str, is_uygulama: bool) -> str:
    n_lower = name.lower()
    canonical = None
    for k, v in SUBJECT_MAPPING.items():
        if k in n_lower:
            canonical = v
            break
    if not canonical:
        canonical = name.strip().upper()
    if is_uygulama and not canonical.endswith("UYGULAMA"):
        canonical = f"{canonical} UYGULAMA"
    return canonical

def parse_schedule_pdf(file_content: bytes) -> list[dict]:
    doc = fitz.open(stream=file_content, filetype="pdf")
    raw_lessons = []

    for page_idx, page in enumerate(doc):
        tabs = page.find_tables()
        for tab in tabs.tables:
            grid = tab.extract()
            if not grid or len(grid) < 2:
                continue

            header = grid[0]
            col_dates = {}
            for c_idx, cell_val in enumerate(header):
                if not cell_val:
                    continue
                m = re.search(r"(\d{2})\.(\d{2})\.(\d{4})", str(cell_val))
                if m:
                    col_dates[c_idx] = date(int(m.group(3)), int(m.group(2)), int(m.group(1)))

            if not col_dates:
                continue

            for row in grid[1:]:
                for c_idx, cell_val in enumerate(row):
                    if not cell_val or c_idx not in col_dates:
                        continue
                    cell_text = str(cell_val).strip()
                    if not cell_text:
                        continue

                    low = cell_text.lower()
                    if any(ex in low for ex in EXCLUDED_KEYWORDS) and not any(
                        inc in low for inc in ["sunum", "uygulama"]
                    ):
                        continue

                    lesson_date = col_dates[c_idx]
                    normalized_cell = re.sub(r"(?i)ANATOMİ\s*\n\s*Sunum", "ANATOMİ Sunum", cell_text)
                    parts = re.split(
                        r"(?=(?:^|\n)(?:Sunum\b|Uygulama\b|ANATOMİ\s+Sunum))",
                        normalized_cell,
                        flags=re.IGNORECASE,
                    )

                    for part in parts:
                        p_str = part.strip()
                        if len(p_str) < 5:
                            continue
                        p_low = p_str.lower()
                        if any(ex in p_low for ex in EXCLUDED_KEYWORDS):
                            continue
                        if not ("sunum" in p_low or "uygulama" in p_low):
                            continue

                        raw_lessons.append({
                            "raw_text": p_str,
                            "date": lesson_date,
                            "page": page_idx + 1,
                        })

    parsed_list = []
    for item in raw_lessons:
        lines = [clean_spaces(l) for l in item["raw_text"].split("\n") if clean_spaces(l)]
        if not lines:
            continue

        raw = " ".join(lines)
        is_uyg = bool(re.search(r"(?:uygulama|sunum\s*\+\s*uygulama)", raw, re.IGNORECASE))
        has_1y = bool(re.search(r"\b1\s*\.\s*[yY]\b", raw))
        has_2y = bool(re.search(r"\b2\s*\.\s*[yY]\b", raw))

        subject = ""
        order_num = None
        topic = ""

        m_anatomi_su = re.search(r"ANATOMİ\s+Sunum\s*\+\s*Uygulama\s*(\d+)", raw, re.IGNORECASE)
        if m_anatomi_su:
            subject = "ANATOMİ UYGULAMA"
            order_num = int(m_anatomi_su.group(1))
            topic = re.sub(r"ANATOMİ\s+Sunum\s*\+\s*Uygulama\s*\d+", "", raw, flags=re.IGNORECASE).strip()
        else:
            m_gen = re.search(r"(?:Sunum|Uygulama)\s+([A-Za-zÇĞİÖŞÜçğıöşü\s‐-]+?)\s+(\d+)", raw, re.IGNORECASE)
            if m_gen:
                subj_candidate = m_gen.group(1).strip()
                order_num = int(m_gen.group(2))
                subject = normalize_subject(subj_candidate, is_uyg)
                idx_end = m_gen.end()
                topic = raw[idx_end:].strip()
            else:
                for line in lines:
                    m_line = re.search(r"([A-Za-zÇĞİÖŞÜçğıöşü\s‐-]+?)\s+(\d+)", line)
                    if m_line and any(k in m_line.group(1).lower() for k in SUBJECT_MAPPING):
                        subject = normalize_subject(m_line.group(1), is_uyg)
                        order_num = int(m_line.group(2))
                        break
                topic = " ".join([l for l in lines if not re.search(r"^(?:Sunum|Uygulama)", l, re.IGNORECASE)])

        if not subject or order_num is None:
            continue

        order_label = f"uyg-{order_num}" if is_uyg else f"s{order_num}"
        yari_info = " (1.Y ve 2.Y)" if (has_1y and has_2y) else (" (1.Y)" if has_1y else (" (2.Y)" if has_2y else ""))
        topic = re.sub(r"\b[12]\s*\.\s*[yY]\b", "", topic)
        topic = clean_spaces(topic)

        parsed_list.append({
            "subject_name": subject,
            "order_label": order_label,
            "order_num": order_num,
            "topic": topic,
            "lesson_date": item["date"],
            "is_uygulama": is_uyg,
            "yari_info": yari_info,
        })

    consolidated = {}
    for p in parsed_list:
        key = (p["subject_name"], p["order_label"])
        if key not in consolidated:
            consolidated[key] = {
                "subject_name": p["subject_name"],
                "order_label": p["order_label"],
                "topic": p["topic"],
                "lesson_date": p["lesson_date"],
                "dates": [p["lesson_date"]],
                "yari_list": [p["yari_info"]] if p["yari_info"] else [],
            }
        else:
            existing = consolidated[key]
            if p["lesson_date"] not in existing["dates"]:
                existing["dates"].append(p["lesson_date"])
            if p["yari_info"] and p["yari_info"] not in existing["yari_list"]:
                existing["yari_list"].append(p["yari_info"])
            if p["lesson_date"] < existing["lesson_date"]:
                existing["lesson_date"] = p["lesson_date"]

    result_lessons = []
    for item in consolidated.values():
        topic_final = item["topic"]
        if item["yari_list"]:
            if len(item["dates"]) > 1:
                dates_str = ", ".join(d.strftime("%d.%m.%Y") for d in sorted(item["dates"]))
                topic_final += f" [Uygulama: {dates_str}]"
            else:
                topic_final += "".join(item["yari_list"])

        result_lessons.append({
            "subject_name": item["subject_name"],
            "order_label": item["order_label"],
            "topic": topic_final.strip() or None,
            "lesson_date": item["lesson_date"],
            "assigned_team": None,
            "audio_status": "Ses yüklenmedi",
        })

    from app.utils.sort_utils import natural_sort_key
    result_lessons.sort(key=lambda x: (x["subject_name"], natural_sort_key(x["order_label"])))
    return result_lessons


async def import_pdf_to_module(
    db: AsyncSession,
    module_id: str,
    file_content: bytes,
    overwrite: bool = False,
) -> dict:
    parsed_lessons = parse_schedule_pdf(file_content)
    created_count = 0
    updated_count = 0
    skipped_count = 0

    for l_data in parsed_lessons:
        result = await db.execute(
            select(Lesson).where(
                Lesson.module_id == module_id,
                Lesson.subject_name == l_data["subject_name"],
                Lesson.order_label == l_data["order_label"],
            )
        )
        lesson = result.scalar_one_or_none()

        if lesson and not overwrite:
            skipped_count += 1
            continue

        if not lesson:
            lesson = Lesson(
                module_id=module_id,
                subject_name=l_data["subject_name"],
                order_label=l_data["order_label"],
                topic=l_data["topic"],
                lesson_date=l_data["lesson_date"],
                assigned_team=l_data["assigned_team"],
                audio_status=l_data["audio_status"],
            )
            db.add(lesson)
            await db.flush()
            created_count += 1
        else:
            lesson.topic = l_data["topic"]
            lesson.lesson_date = l_data["lesson_date"]
            if l_data["assigned_team"]:
                lesson.assigned_team = l_data["assigned_team"]
            updated_count += 1

        tracking_result = await db.execute(
            select(NoteTracking).where(NoteTracking.lesson_id == lesson.id)
        )
        tracking = tracking_result.scalar_one_or_none()
        if not tracking:
            tracking = NoteTracking(lesson_id=lesson.id, status=NoteStatus.NOT_REACHED)
            db.add(tracking)
            await db.flush()

    return {
        "total": len(parsed_lessons),
        "created": created_count,
        "updated": updated_count,
        "skipped": skipped_count,
    }

