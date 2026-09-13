import uuid
import logging
from contextlib import asynccontextmanager
from time import perf_counter

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import inspect, text
from app.routers import transactions, auth, analytics, chat, tax, realtime
from app.routers import goals as goals_router
from app.routers import categories as categories_router
from app.routers import insights as insights_router
from app.models.database import engine, Base
from app.config import (
    AUTO_CREATE_TABLES,
    CORS_ALLOWED_ORIGINS,
    CORS_ALLOW_CREDENTIALS,
    REQUIRE_HTTPS,
    SECURITY_HEADERS_ENABLED,
    TRUSTED_HOSTS,
)
from app.services.logging_service import setup_logging
from app.services.rag_service import rag_service
from app.services.scheduler_service import start_scheduler, stop_scheduler

setup_logging()
logger = logging.getLogger("finassist.api")


def _ensure_dev_schema_compatibility() -> None:
    """Apply lightweight additive schema fixes for local SQLite dev DBs."""
    inspector = inspect(engine)
    statements = []
    
    if "user_feedback" in inspector.get_table_names():
        existing = {col["name"] for col in inspector.get_columns("user_feedback")}
        if "source_event_id" not in existing:
            statements.append("ALTER TABLE user_feedback ADD COLUMN source_event_id INTEGER")
        if "predicted_category" not in existing:
            statements.append("ALTER TABLE user_feedback ADD COLUMN predicted_category VARCHAR")
        if "reason_type" not in existing:
            statements.append("ALTER TABLE user_feedback ADD COLUMN reason_type VARCHAR")
        if "created_at" not in existing:
            statements.append("ALTER TABLE user_feedback ADD COLUMN created_at DATETIME")

    if "transactions" in inspector.get_table_names():
        tx_existing = {col["name"] for col in inspector.get_columns("transactions")}
        if "user_id" not in tx_existing:
            statements.append("ALTER TABLE transactions ADD COLUMN user_id INTEGER REFERENCES users(id)")
        if "direction" not in tx_existing:
            statements.append("ALTER TABLE transactions ADD COLUMN direction VARCHAR NOT NULL DEFAULT 'debit'")

    if "user_profiles" in inspector.get_table_names():
        up_existing = {col["name"] for col in inspector.get_columns("user_profiles")}
        if "is_couple" not in up_existing:
            statements.append("ALTER TABLE user_profiles ADD COLUMN is_couple BOOLEAN NOT NULL DEFAULT 0")
            statements.append("ALTER TABLE user_profiles ADD COLUMN partner_age INTEGER")
            statements.append("ALTER TABLE user_profiles ADD COLUMN partner_income FLOAT")
        profile_columns = {
            "epfo_esic_status": "BOOLEAN NOT NULL DEFAULT 0",
            "income_tax_payer": "BOOLEAN NOT NULL DEFAULT 0",
            "e_shram_registered": "BOOLEAN NOT NULL DEFAULT 0",
            "days_active_with_aggregator": "INTEGER",
            "state": "VARCHAR",
            "savings_bank_account": "BOOLEAN NOT NULL DEFAULT 1",
            "aadhaar_linked": "BOOLEAN NOT NULL DEFAULT 1",
            "language_pref": "VARCHAR NOT NULL DEFAULT 'en'",
            "literacy_level": "VARCHAR NOT NULL DEFAULT 'medium'",
        }
        for column, declaration in profile_columns.items():
            if column not in up_existing:
                statements.append(f"ALTER TABLE user_profiles ADD COLUMN {column} {declaration}")

    if "consent_audit_logs" not in inspector.get_table_names():
        statements.append("CREATE TABLE consent_audit_logs (id INTEGER PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id), purpose VARCHAR NOT NULL, action VARCHAR NOT NULL, policy_version VARCHAR NOT NULL DEFAULT 'v1', created_at DATETIME NOT NULL)")

    if "nudge_suppressions" not in inspector.get_table_names():
        statements.append("CREATE TABLE nudge_suppressions (id INTEGER PRIMARY KEY, nudge_type VARCHAR NOT NULL UNIQUE, suppressed_at DATETIME NOT NULL, reason VARCHAR)")

    if not statements:
        return

    with engine.begin() as conn:
        for stmt in statements:
            conn.execute(text(stmt))

if AUTO_CREATE_TABLES:
    # Dev convenience; disable in production and rely on Alembic migrations.
    Base.metadata.create_all(bind=engine) # Hot-reload trigger
    _ensure_dev_schema_compatibility()


def _split_csv(value: str) -> list[str]:
    return [part.strip() for part in value.split(",") if part.strip()]


allowed_origins = _split_csv(CORS_ALLOWED_ORIGINS) or ["*"]
trusted_hosts = _split_csv(TRUSTED_HOSTS) or ["*"]
allow_credentials = CORS_ALLOW_CREDENTIALS and allowed_origins != ["*"]


@asynccontextmanager
async def lifespan(_: FastAPI):
    print("Initializing RAG Knowledge Base...")
    rag_service.initialize_knowledge_base()
    start_scheduler()
    yield
    stop_scheduler()

app = FastAPI(
    title="FinAssist API",
    description="Backend for the AI-powered personal financial assistant.",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=allow_credentials,
    allow_methods=["*"],
    allow_headers=["*"],
)

if trusted_hosts != ["*"]:
    app.add_middleware(TrustedHostMiddleware, allowed_hosts=trusted_hosts)

app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])
app.include_router(transactions.router, prefix="/api/transactions", tags=["Transactions"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["Analytics"])
app.include_router(chat.router, prefix="/api/chat", tags=["Chat"])
app.include_router(tax.router, prefix="/api/tax", tags=["Tax Intelligence"])
app.include_router(realtime.router, prefix="/api/realtime", tags=["Realtime"])
from app.routers import profile, portfolio
app.include_router(profile.router, prefix="/api/profile", tags=["Profile & Planning"])
app.include_router(portfolio.router, prefix="/api/portfolio", tags=["Portfolio"])
app.include_router(goals_router.router, prefix="/api/goals", tags=["Goals"])
app.include_router(categories_router.router, prefix="/api/categories", tags=["Categories"])
app.include_router(insights_router.router, prefix="/api/insights", tags=["Insights"])
from app.routers import reports as reports_router
app.include_router(reports_router.router, prefix="/api/reports", tags=["Reports"])
from app.routers import privacy as privacy_router
app.include_router(privacy_router.router, prefix="/api/privacy", tags=["Privacy & Consent"])
from app.routers import recurring_debits as debits_router
app.include_router(debits_router.router, prefix="/api/recurring-debits", tags=["Recurring Debits"])
from app.routers import nudge_feedback as nudge_feedback_router
app.include_router(nudge_feedback_router.router, prefix='/api/nudges', tags=['Nudges'])

@app.middleware("http")
async def request_id_middleware(request: Request, call_next):
    request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
    request.state.request_id = request_id

    start = perf_counter()
    method = request.method
    path = request.url.path

    try:
        response = await call_next(request)
    except Exception:
        duration_ms = round((perf_counter() - start) * 1000.0, 2)
        logger.exception(
            "Request failed",
            extra={
                "request_id": request_id,
                "method": method,
                "path": path,
                "duration_ms": duration_ms,
            },
        )
        raise

    duration_ms = round((perf_counter() - start) * 1000.0, 2)
    logger.info(
        "Request completed",
        extra={
            "request_id": request_id,
            "method": method,
            "path": path,
            "status_code": response.status_code,
            "duration_ms": duration_ms,
        },
    )
    response.headers["X-Request-ID"] = request_id

    if SECURITY_HEADERS_ENABLED:
        response.headers.setdefault("X-Content-Type-Options", "nosniff")
        response.headers.setdefault("X-Frame-Options", "DENY")
        response.headers.setdefault("Referrer-Policy", "strict-origin-when-cross-origin")
        response.headers.setdefault("Permissions-Policy", "camera=(), microphone=(), geolocation=()")
        response.headers.setdefault("Content-Security-Policy", "default-src 'none'; frame-ancestors 'none'")
        if REQUIRE_HTTPS:
            response.headers.setdefault("Strict-Transport-Security", "max-age=31536000; includeSubDomains")

    return response


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "detail": exc.detail,
            "request_id": getattr(request.state, "request_id", None),
        },
        headers=exc.headers,
    )


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, _: Exception):
    return JSONResponse(
        status_code=500,
        content={
            "detail": "Internal server error",
            "request_id": getattr(request.state, "request_id", None),
        },
    )

@app.get("/")
def read_root():
    return {"message": "Welcome to FinAssist API!"}

@app.get("/health")
@app.get("/api/health")
def health_check():
    return {
        "status": "ok",
        "service": "finassist-backend",
    }


@app.get("/health/ready")
def readiness_check():
    db_ok = True
    db_error = None
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
    except Exception as exc:  # pragma: no cover - defensive readiness check
        db_ok = False
        db_error = str(exc)

    payload = {
        "status": "ready" if db_ok else "not_ready",
        "checks": {
            "database": {
                "ok": db_ok,
                "error": db_error,
            },
            "rag_index": {
                "ok": True,
                "documents_indexed": int(getattr(rag_service.index, "ntotal", 0)),
            },
        },
    }

    if not db_ok:
        return JSONResponse(status_code=503, content=payload)
    return payload
