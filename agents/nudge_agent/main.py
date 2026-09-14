"""
FastAPI application entrypoint for the Nudge Agent.
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routers import nudge_router
from .services.scheduler_service import nudge_scheduler


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Start autonomous proactive background scheduler
    await nudge_scheduler.start()
    yield
    # Graceful shutdown
    await nudge_scheduler.stop()


app = FastAPI(
    title="Nudge Agent API",
    description="Proactive financial nudging and outcome evaluation service for gig workers",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Include nudge router
app.include_router(nudge_router.router)


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Nudge Agent API",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/nudges/health"
    }


@app.get("/nudges/health")
async def health():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "agent": "Nudge Agent",
        "version": "1.0.0"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8004)
