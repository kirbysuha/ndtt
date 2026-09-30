from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.database import create_tables
from app.routers import (
    classes_router,
    modules_router,
    lessons_router,
    tracking_router,
    dashboard_router,
    import_router,
    teams_router,
    applications_router,
    auth_router,
)

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Uygulama başlarken tabloları oluştur."""
    await create_tables()
    yield


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Not Durum Takip Tablosu - Yönetim API'si",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API Router'ları
API_PREFIX = "/api"
app.include_router(classes_router, prefix=API_PREFIX)
app.include_router(modules_router, prefix=API_PREFIX)
app.include_router(lessons_router, prefix=API_PREFIX)
app.include_router(tracking_router, prefix=API_PREFIX)
app.include_router(dashboard_router, prefix=API_PREFIX)
app.include_router(import_router, prefix=API_PREFIX)
app.include_router(teams_router, prefix=API_PREFIX)
app.include_router(applications_router, prefix=API_PREFIX)
app.include_router(auth_router, prefix=API_PREFIX)


@app.get("/")
async def root():
    return {
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "docs": "/docs",
        "health": "/health",
    }


@app.get("/health")
async def health():
    return {"status": "ok"}
