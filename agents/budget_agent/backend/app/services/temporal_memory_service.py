"""
Temporal Memory Service — Significance-weighted financial event memory
with exponential decay.

Key idea: every financial event has an initial significance (impact_score)
that decays over time with an exponential factor, but never drops below
a non-zero floor for high-impact events. This lets the system "remember"
that a user missed an EMI 6 weeks ago with diminished but non-zero weight,
while a minor income fluctuation from the same period effectively fades.

Formula:
    current_significance = max(
        impact_score * exp(-decay_rate * days_elapsed),
        floor
    )

where:
    decay_rate = 0.05 (tunable)
    floor = 0.1 * impact_score  for impact_score >= 5
            0.0                  for impact_score < 5
"""
from __future__ import annotations

import math
import logging
from datetime import datetime, timedelta, timezone
from typing import List, Optional

from sqlalchemy import desc
from sqlalchemy.orm import Session

from app.models.schemas import TemporalMemoryEvent
from app.utils.time import utcnow

logger = logging.getLogger(__name__)

DECAY_RATE = 0.05  # per-day decay constant
HIGH_IMPACT_THRESHOLD = 5.0  # impact_score >= this gets a non-zero floor


def compute_decayed_significance(event: TemporalMemoryEvent, as_of: Optional[datetime] = None) -> float:
    """Compute the current significance of an event after time-decay."""
    now = as_of or utcnow()
    # Handle timezone-aware vs naive comparison
    event_time = event.timestamp
    if event_time.tzinfo is None and now.tzinfo is not None:
        event_time = event_time.replace(tzinfo=timezone.utc)
    elif event_time.tzinfo is not None and now.tzinfo is None:
        now = now.replace(tzinfo=timezone.utc)

    days_elapsed = max((now - event_time).total_seconds() / 86400, 0)
    raw = event.impact_score * math.exp(-DECAY_RATE * days_elapsed)

    # Non-zero floor for high-impact events
    if event.impact_score >= HIGH_IMPACT_THRESHOLD:
        floor = 0.1 * event.impact_score
    else:
        floor = 0.0

    return round(max(raw, floor), 4)


def record_event(
    user_id: int,
    db: Session,
    event_type: str,
    description: str = "",
    impact_score: float = 1.0,
    amount: Optional[float] = None,
) -> TemporalMemoryEvent:
    """Record a new financial event in temporal memory."""
    event = TemporalMemoryEvent(
        user_id=user_id,
        event_type=event_type,
        description=description,
        impact_score=min(max(impact_score, 0.1), 10.0),  # clamp 0.1–10
        amount=amount,
    )
    db.add(event)
    db.commit()
    db.refresh(event)
    logger.info(
        "Temporal memory event recorded: type=%s, score=%.1f (user=%d)",
        event_type, impact_score, user_id,
    )
    return event


def get_active_memories(
    user_id: int,
    db: Session,
    max_age_days: int = 90,
    min_significance: float = 0.1,
) -> List[dict]:
    """Retrieve all still-significant memories for a user.

    Returns events with their current decayed significance, sorted
    by significance descending.
    """
    cutoff = utcnow() - timedelta(days=max_age_days)
    events = (
        db.query(TemporalMemoryEvent)
        .filter(
            TemporalMemoryEvent.user_id == user_id,
            TemporalMemoryEvent.timestamp >= cutoff,
        )
        .order_by(desc(TemporalMemoryEvent.timestamp))
        .all()
    )

    results = []
    for event in events:
        sig = compute_decayed_significance(event)
        if sig >= min_significance:
            results.append({
                "id": event.id,
                "event_type": event.event_type,
                "description": event.description,
                "original_impact": event.impact_score,
                "current_significance": sig,
                "amount": event.amount,
                "timestamp": str(event.timestamp),
                "days_ago": round((utcnow() - event.timestamp.replace(tzinfo=timezone.utc)).total_seconds() / 86400, 1),
            })

    results.sort(key=lambda x: x["current_significance"], reverse=True)
    return results


def get_memory_summary(user_id: int, db: Session, top_n: int = 5) -> dict:
    """Generate a summary of the user's financial memory landscape.

    Useful for injecting into LLM prompts or the causal chain reasoner.
    """
    memories = get_active_memories(user_id, db)
    if not memories:
        return {"total_active_memories": 0, "dominant_theme": None, "top_events": []}

    # Count event types
    type_counts: dict[str, int] = {}
    type_significance: dict[str, float] = {}
    for m in memories:
        t = m["event_type"]
        type_counts[t] = type_counts.get(t, 0) + 1
        type_significance[t] = type_significance.get(t, 0) + m["current_significance"]

    # Dominant theme is the event type with highest total significance
    dominant = max(type_significance, key=type_significance.get)

    return {
        "total_active_memories": len(memories),
        "dominant_theme": dominant,
        "event_type_counts": type_counts,
        "top_events": memories[:max(top_n, 0)],
    }
