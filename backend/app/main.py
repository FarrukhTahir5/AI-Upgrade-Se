from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.db.base import Base
from app.db.session import engine

# Import all models so they are registered with Base
from app.models import models  # noqa

# Import routers
from app.api.auth import router as auth_router
from app.api.customers import router as customers_router
from app.api.analysis import router as analysis_router
from app.api.messages import router as messages_router
from app.api.campaigns import router as campaigns_router
from app.api.imports import router as imports_router
from app.api.dashboard import router as dashboard_router

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS
origins = [o.strip() for o in settings.CORS_ORIGINS.split(",")]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers — MVP flat model, no separate systems/GL/energy/battery
app.include_router(auth_router, prefix="/api")
app.include_router(customers_router, prefix="/api")
app.include_router(analysis_router, prefix="/api")
app.include_router(messages_router, prefix="/api")
app.include_router(campaigns_router, prefix="/api")
app.include_router(imports_router, prefix="/api")
app.include_router(dashboard_router, prefix="/api")


@app.get("/")
def root():
    return {"message": f"{settings.APP_NAME} v{settings.APP_VERSION}", "docs": "/docs"}


@app.get("/health")
def health():
    return {"status": "ok"}
