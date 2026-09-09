from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.models.database import get_db
from app.models.schemas import Transaction, User
from app.services.auth_service import get_current_user
from app.orchestration.graph import NitisaathiOrchestrator
from app.services.nudge_lifecycle_service import record_and_deliver

router = APIRouter()

class ChatRequest(BaseModel):
    message: str
    session_id: str | None = None
    chat_history: list[dict[str, str]] = Field(default_factory=list)

class ChatResponse(BaseModel):
    response: str
    intent: str | None = None
    active_agents: list[str] = Field(default_factory=list)
    confidence: float | None = None
    trust_metadata: dict = Field(default_factory=dict)
    nudge_queue: list[dict] = Field(default_factory=list)

@router.post("/", response_model=ChatResponse)
async def chat(request: ChatRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Run the full relevance-gated, multi-agent LangGraph workflow."""
    result = await NitisaathiOrchestrator(db).run(
        user_id=current_user.id,
        message=request.message,
        chat_history=request.chat_history,
        session_id=request.session_id,
    )

    # The nudge service decides *what* to send; the gateway owns delivery to
    # the existing in-app notification channel used by the frontend.
    record_and_deliver(db, current_user.id, result.get("nudge_queue", []), result.get("finassist_data", {}))

    synthesis = result.get("synthesis_result", {})
    return ChatResponse(
        response=result.get("final_user_response", "I could not process that request."),
        intent=result.get("current_intent"),
        active_agents=result.get("active_agents", []),
        confidence=synthesis.get("overall_confidence"),
        trust_metadata=synthesis.get("trust_metadata", {}),
        nudge_queue=result.get("nudge_queue", []),
    )
