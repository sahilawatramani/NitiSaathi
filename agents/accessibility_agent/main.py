"""
FastAPI application entrypoint for the Accessibility Agent.

Run standalone:
    cd agents/accessibility_agent
    uvicorn main:app --reload --port 8005

Swagger Documentation:
    http://127.0.0.1:8005/docs
"""
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .routers import accessibility_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="NitiSaathi — Accessibility Agent",
    description=(
        "Specialist microservice providing multilingual translation via Google Cloud Translation API, "
        "gig-worker financial glossary word-to-word breakdown, speech/audio accessibility, "
        "currency verbalization, Hinglish transliteration, and UI accommodations."
    ),
    version=settings.VERSION,
    docs_url="/docs",
    redoc_url="/redoc"
)

# ── CORS Middleware ──────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Include Routers ──────────────────────────────────────────────────────────
app.include_router(accessibility_router.router)

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "docs": "/docs",
        "health": f"{settings.API_PREFIX}/health"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=settings.PORT)
