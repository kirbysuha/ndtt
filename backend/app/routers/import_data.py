from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models.module import Module
from app.services.import_service import import_excel_to_module
from app.services.pdf_import_service import parse_schedule_pdf, import_pdf_to_module

router = APIRouter(prefix="/import", tags=["import"])


@router.post("/excel/{module_id}")
async def import_excel(
    module_id: str,
    file: UploadFile = File(...),
    overwrite: bool = Form(default=False),
    db: AsyncSession = Depends(get_db),
):
    """
    Excel dosyasını belirtilen modüle import et.
    
    - **module_id**: Hedef modül ID'si
    - **file**: xlsx dosyası (mevcut Not Durum Takip Tablosu formatında)
    - **overwrite**: True ise mevcut veriler güncellenir, False ise atlanır
    """
    # Modül var mı kontrol et
    m = await db.scalar(select(Module).where(Module.id == module_id))
    if not m:
        raise HTTPException(status_code=404, detail="Modül bulunamadı")

    # Sadece xlsx kabul et
    if not file.filename or not file.filename.endswith((".xlsx", ".xls")):
        raise HTTPException(status_code=400, detail="Sadece .xlsx dosyası kabul edilir")

    content = await file.read()

    try:
        result = await import_excel_to_module(db, module_id, content, overwrite=overwrite)
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Excel işlenirken hata: {str(e)}")

    return {
        "message": "Import tamamlandı",
        "module_id": module_id,
        "filename": file.filename,
        **result,
    }


@router.post("/pdf/preview")
async def preview_pdf_schedule(
    file: UploadFile = File(...),
):
    """
    Haftalık ders programı PDF'sini ayrıştırıp önizleme döndürür (veritabanına yazmaz).
    """
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Sadece .pdf dosyası kabul edilir")

    content = await file.read()
    try:
        lessons = parse_schedule_pdf(content)
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"PDF işlenirken hata oluştu: {str(e)}")

    sunum_count = sum(1 for l in lessons if not "UYGULAMA" in l["subject_name"])
    uygulama_count = sum(1 for l in lessons if "UYGULAMA" in l["subject_name"])

    return {
        "total": len(lessons),
        "sunum_count": sunum_count,
        "uygulama_count": uygulama_count,
        "filename": file.filename,
        "lessons": lessons,
    }


@router.post("/pdf/{module_id}")
async def import_pdf_schedule(
    module_id: str,
    file: UploadFile = File(...),
    overwrite: bool = Form(default=False),
    db: AsyncSession = Depends(get_db),
):
    """
    Haftalık ders programı PDF'sini belirtilen modüle içe aktarır.
    """
    m = await db.scalar(select(Module).where(Module.id == module_id))
    if not m:
        raise HTTPException(status_code=404, detail="Modül bulunamadı")

    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Sadece .pdf dosyası kabul edilir")

    content = await file.read()
    try:
        result = await import_pdf_to_module(db, module_id, content, overwrite=overwrite)
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"PDF aktarılırken hata: {str(e)}")

    return {
        "message": "PDF ders programı başarıyla aktarıldı",
        "module_id": module_id,
        "filename": file.filename,
        **result,
    }

