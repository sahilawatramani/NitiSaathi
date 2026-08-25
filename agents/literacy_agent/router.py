"""router.py — FastAPI router for the Literacy Agent.

Provides a standalone HTTP endpoint so the agent can be tested independently
before LangGraph integration.
"""

from fastapi import APIRouter

from agent import rewrite_output
from schemas import RewriteRequest, RewriteResponse

router = APIRouter(prefix="/literacy", tags=["Literacy Agent"])


@router.post("/rewrite", response_model=RewriteResponse)
async def rewrite_text(request: RewriteRequest) -> RewriteResponse:
    """Rewrite input text for the target literacy level.

    This endpoint is the standalone API surface of the Literacy Agent.
    In the full NitiSaathi system, the same logic runs as a LangGraph node
    (see node.py) and this endpoint is used only for development/testing.
    """

    result = rewrite_output(
        raw_text=request.text,
        literacy_level=request.literacy_level,
        has_financial_content=request.has_financial_content,
        has_scheme_content=request.has_scheme_content,
    )

    return RewriteResponse(
        original_text=result["original_text"],
        rewritten_text=result["rewritten_text"],
        literacy_level=result["literacy_level"],
        disclaimer_added=result["disclaimer_added"],
    )


@router.get("/health")
async def health_check():
    """Simple health check for the Literacy Agent service."""
    return {"status": "ok", "agent": "literacy_agent"}
