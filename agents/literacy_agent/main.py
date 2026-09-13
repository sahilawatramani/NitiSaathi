"""main.py — Standalone FastAPI entrypoint for the Literacy Agent.

Run with:
    cd agents/literacy_agent
    uvicorn main:app --reload --port 8100

Swagger docs at: http://localhost:8100/docs
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

try:
    from router import router as literacy_router
except ImportError:
    from .router import router as literacy_router

app = FastAPI(
    title="NitiSaathi — Literacy Agent",
    description=(
        "Standalone service that rewrites financial outputs to match the "
        "user's literacy level (low / medium / high). "
        "English-only for now."
    ),
    version="0.1.0",
)

# ── CORS (permissive for local dev) ────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Register router ───────────────────────────────────────────────────────
app.include_router(literacy_router)


@app.get("/")
async def root():
    return {
        "service": "NitiSaathi Literacy Agent",
        "version": "0.1.0",
        "docs": "/docs",
        "health": "/health",
    }


@app.get("/health")
async def health():
    return {"status": "ok", "agent": "literacy_agent"}
