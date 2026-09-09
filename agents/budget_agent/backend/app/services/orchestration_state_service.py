"""Database-backed persistence for resumable orchestration threads (7-day TTL)."""
from __future__ import annotations

import json
from datetime import timedelta
from typing import Any

from sqlalchemy.orm import Session

from app.models.schemas import OrchestrationCheckpoint
from app.utils.time import utcnow

CHECKPOINT_TTL_DAYS = 7


def load_history(db: Session, user_id: int, thread_id: str) -> list[dict[str, str]]:
    """
    Load chat history for a session.
    
    LangGraph native checkpointer stores full graph state including chat_history.
    The OrchestrationCheckpoint table provides fallback + readable audit trail.
    Both are maintained in parallel for resilience.
    """
    try:
        from app.orchestration.graph import _get_checkpointer
        checkpointer = _get_checkpointer()
        if checkpointer is not None:
            config = {"configurable": {"thread_id": thread_id}}
            checkpoint_tuple = checkpointer.get_tuple(config)
            if checkpoint_tuple is not None:
                if hasattr(checkpoint_tuple, 'values') and 'chat_history' in checkpoint_tuple.values:
                    return checkpoint_tuple.values['chat_history']
                elif hasattr(checkpoint_tuple, 'checkpoint') and 'channel_values' in checkpoint_tuple.checkpoint:
                    state = checkpoint_tuple.checkpoint['channel_values']
                    if 'chat_history' in state:
                        return state['chat_history']
    except Exception as e:
        import logging
        logging.getLogger(__name__).warning("Failed to load history from LangGraph checkpointer: %s", e)

    row = db.query(OrchestrationCheckpoint).filter_by(user_id=user_id, thread_id=thread_id).first()
    if not row or row.expires_at < utcnow():
        return []
    try:
        return json.loads(row.state_json).get("chat_history", [])
    except (TypeError, ValueError):
        return []


def save_state(db: Session, user_id: int, thread_id: str, state: dict[str, Any]) -> None:
    # Persist a serializable, data-minimized snapshot—not a live DB session.
    payload = {k: v for k, v in state.items() if k not in {"db", "recent_transactions"}}
    encoded = json.dumps(payload, default=str, ensure_ascii=False)
    row = db.query(OrchestrationCheckpoint).filter_by(user_id=user_id, thread_id=thread_id).first()
    if not row:
        row = OrchestrationCheckpoint(user_id=user_id, thread_id=thread_id, state_json=encoded, expires_at=utcnow() + timedelta(days=CHECKPOINT_TTL_DAYS))
        db.add(row)
    else:
        row.state_json = encoded
        row.expires_at = utcnow() + timedelta(days=CHECKPOINT_TTL_DAYS)
    db.commit()


def purge_expired(db: Session) -> int:
    return db.query(OrchestrationCheckpoint).filter(OrchestrationCheckpoint.expires_at < utcnow()).delete()
