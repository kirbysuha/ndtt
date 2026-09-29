# NDTT — Not Durum Takip Tablosu

Google Sheets + Apps Script sisteminin tam yeniden yazımı. FastAPI + Next.js + PostgreSQL üzerinde çalışan, VPS'e deploy edilebilir modern bir web yönetim paneli.

## Proje Yapısı

```
ndtt/
├── backend/                 # FastAPI
│   ├── app/
│   │   ├── models/          # SQLAlchemy ORM modelleri
│   │   │   ├── class_model.py
│   │   │   ├── module.py
│   │   │   ├── lesson.py
│   │   │   ├── note_tracking.py   # 8 durum enum
│   │   │   └── status_history.py  # Geçmiş log
│   │   ├── schemas/         # Pydantic request/response
│   │   ├── routers/         # FastAPI endpoint'leri
│   │   │   ├── classes.py   # CRUD
│   │   │   ├── modules.py   # CRUD
│   │   │   ├── lessons.py   # CRUD + bulk
│   │   │   ├── tracking.py  # Durum değişimi + tablo
│   │   │   ├── dashboard.py # İstatistikler
│   │   │   └── import_data.py # Excel import
│   │   ├── services/
│   │   │   ├── timer_service.py    # Süre hesaplama (Apps Script karşılığı)
│   │   │   ├── tracking_service.py # Durum iş mantığı (onEdit karşılığı)
│   │   │   └── import_service.py  # Excel parse + import
│   │   ├── config.py
│   │   ├── database.py
│   │   └── main.py
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/                # Next.js 16 + Tailwind
│   ├── app/
│   │   ├── page.tsx              # Dashboard
│   │   ├── classes/page.tsx      # Sınıf listesi
│   │   ├── classes/[classId]/page.tsx          # Modül listesi
│   │   ├── classes/[classId]/modules/[moduleId]/page.tsx  # Takip tablosu ⭐
│   │   └── import/page.tsx       # Excel import
│   ├── components/
│   │   ├── Sidebar.tsx
│   │   ├── StatusBadge.tsx       # Renk kodlu durum etiketi
│   │   ├── TimerCell.tsx         # Geri sayım hücresi
│   │   └── TrackingTable.tsx     # Ana tablo (dropdown ile durum değişimi)
│   ├── lib/api.ts               # axios API client
│   ├── types/index.ts           # TypeScript tipleri
│   └── Dockerfile
└── docker-compose.yml
```

## Kurulum (Geliştirme)

### Backend

```bash
cd backend

# .env dosyasını oluştur
cp .env.example .env
# DATABASE_URL'i düzenle

# Bağımlılıkları kur
pip install -r requirements.txt

# PostgreSQL'i başlat (Docker ile)
docker run -d --name ndtt_pg \
  -e POSTGRES_USER=ndtt_user \
  -e POSTGRES_PASSWORD=ndtt_pass \
  -e POSTGRES_DB=ndtt_db \
  -p 5432:5432 postgres:16-alpine

# API'yi çalıştır (tablolar otomatik oluşur)
uvicorn app.main:app --reload --port 8000
```

API: http://localhost:8000  
Swagger Docs: http://localhost:8000/docs

### Frontend

```bash
cd frontend

# .env.local zaten hazır
npm install
npm run dev
```

UI: http://localhost:3000

## Docker ile Tüm Sistemi Başlatmak

```bash
# Proje kökünde
docker-compose up --build
```

## Excel Import

1. **Sınıf oluştur**: `/classes` sayfasından
2. **Modül oluştur**: Sınıf detayından
3. **Import et**: `/import` sayfasına git, modülü seç, xlsx dosyasını yükle

## Apps Script'ten Farklar

| Apps Script | Bu sistem |
|-------------|-----------|
| Tek sayfa, 120 satır limiti | Sınırsız ders |
| Sayaçlar her dakika yazılır | Anlık hesaplanır (API isteğinde) |
| PropertiesService (global state) | PostgreSQL (per-lesson timestamps) |
| Google Sheets bağımlı | Tamamen bağımsız |
| Hardcoded tek modül | Çoklu sınıf/modül |

## API Endpoint'leri

```
GET  /api/classes
POST /api/classes
GET  /api/classes/{id}
PUT  /api/classes/{id}
DELETE /api/classes/{id}

GET  /api/classes/{classId}/modules
POST /api/classes/{classId}/modules
GET  /api/modules/{id}
PUT  /api/modules/{id}
DELETE /api/modules/{id}

GET  /api/modules/{moduleId}/lessons
POST /api/modules/{moduleId}/lessons
POST /api/modules/{moduleId}/lessons/bulk
GET  /api/lessons/{id}
PUT  /api/lessons/{id}
DELETE /api/lessons/{id}

GET  /api/modules/{moduleId}/tracking    ← Ana tablo (süreler anlık hesaplanır)
PUT  /api/tracking/{id}/status           ← Durum değiştir (onEdit karşılığı)
GET  /api/tracking/{id}/history          ← Durum geçmişi

GET  /api/dashboard/stats
GET  /api/dashboard/module-stats/{moduleId}

POST /api/import/excel/{moduleId}        ← Excel import
```

## VPS Deploy

Sunucu yapılandırması için:
1. `docker-compose.yml` içindeki `ALLOWED_ORIGINS` ve `SECRET_KEY` değerlerini güncelle
2. `docker-compose up -d` ile başlat
3. Nginx reverse proxy kur (80/443 → 3000/8000)
