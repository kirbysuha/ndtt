from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = "postgresql+asyncpg://ndtt_user:ndtt_pass@localhost:5432/ndtt_db"
    DATABASE_URL_SYNC: str = "postgresql+psycopg2://ndtt_user:ndtt_pass@localhost:5432/ndtt_db"

    # App
    APP_NAME: str = "NDTT - Not Durum Takip Tablosu"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True

    # CORS
    ALLOWED_ORIGINS: list[str] = ["http://localhost:3000", "http://127.0.0.1:3000"]

    # JWT (gelecekte auth için)
    SECRET_KEY: str = "change-me-in-production-please-use-a-strong-secret"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 saat

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
