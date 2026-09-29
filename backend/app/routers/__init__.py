from app.routers.classes import router as classes_router
from app.routers.modules import router as modules_router
from app.routers.lessons import router as lessons_router
from app.routers.tracking import router as tracking_router
from app.routers.dashboard import router as dashboard_router
from app.routers.import_data import router as import_router
from app.routers.teams import router as teams_router
from app.routers.applications import router as applications_router

__all__ = [
    "classes_router",
    "modules_router",
    "lessons_router",
    "tracking_router",
    "dashboard_router",
    "import_router",
    "teams_router",
    "applications_router",
]

