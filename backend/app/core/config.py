from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # App
    APP_NAME: str = "AI Upgrade Intelligence Platform"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True

    # Database
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/ai_upgrade"

    # JWT
    SECRET_KEY: str = "change-this-in-production-use-a-strong-random-key"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours

    # Gemini AI
    GEMINI_API_KEY: Optional[str] = None
    GEMINI_MODEL: str = "gemini-2.0-flash"

    # CORS
    CORS_ORIGINS: str = "http://localhost:3000,http://localhost:3001"

    # Scoring thresholds (configurable)
    PV_WEIGHT: float = 0.30
    BATTERY_WEIGHT: float = 0.30
    PANEL_WEIGHT: float = 0.20
    GL_WEIGHT: float = 0.20

    LEGACY_PANEL_WATTAGE_MAX: int = 400
    BATTERY_SIZE_THRESHOLD_KWH: float = 10.0
    CONSUMPTION_GROWTH_THRESHOLD: float = 0.20
    HIGH_IMPORT_THRESHOLD_KWH: float = 500.0

    GL_URGENCY_6MO: int = 100
    GL_URGENCY_12MO: int = 80
    GL_URGENCY_24MO: int = 60
    GL_URGENCY_36MO: int = 40

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
