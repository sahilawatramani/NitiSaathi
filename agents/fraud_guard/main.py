"""
FastAPI application for Fraud Guard
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routers import fraud_router

# Create FastAPI app
app = FastAPI(
    title="Fraud Guard API",
    description="Real-time UPI fraud detection engine for gig workers",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include router
app.include_router(fraud_router.router)


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Fraud Guard API",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/api/v1/fraud-guard/health"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)
