"""
Suppression service to handle user feedback and nudge suppression.
Stores feedback history in-memory with SQLite persistence.
"""
from typing import Dict, List, Tuple, Optional
from .nudge_storage_service import save_feedback_log, load_all_feedback_history

# In-memory feedback store: (user_id, trigger_id) -> list of feedback ratings
_suppression_store: Dict[Tuple[str, str], List[str]] = {}


def _init_suppression_store() -> None:
    global _suppression_store
    try:
        loaded = load_all_feedback_history()
        _suppression_store.update(loaded)
    except Exception:
        pass


_init_suppression_store()


def record_feedback(user_id: str, trigger_id: str, rating: str, nudge_id: Optional[str] = None, notes: Optional[str] = None) -> None:
    """Record user feedback for a specific trigger with database persistence."""
    key = (str(user_id), str(trigger_id))
    if key not in _suppression_store:
        _suppression_store[key] = []
    _suppression_store[key].append(rating)

    try:
        save_feedback_log(str(user_id), str(trigger_id), rating, nudge_id=nudge_id, notes=notes)
    except Exception:
        pass


def is_suppressed(user_id: str, trigger_id: str) -> bool:
    """
    Check if a trigger is suppressed for a user.
    Suppressed if:
    - Any 'harmful' rating exists in the feedback history.
    - 3+ consecutive 'not_useful' ratings exist in the feedback history.
    """
    key = (str(user_id), str(trigger_id))
    history = _suppression_store.get(key, [])
    
    # Check for any 'harmful' rating
    if "harmful" in history:
        return True
        
    # Check for 3+ consecutive 'not_useful' ratings
    consecutive_not_useful = 0
    for rating in history:
        if rating == "not_useful":
            consecutive_not_useful += 1
            if consecutive_not_useful >= 3:
                return True
        else:
            consecutive_not_useful = 0
            
    return False


def clear_suppression_history() -> None:
    """Clear all feedback history (helper for testing)"""
    _suppression_store.clear()
