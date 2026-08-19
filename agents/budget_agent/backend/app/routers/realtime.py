from collections import Counter
import json
from datetime import datetime
import os
from typing import List, TypedDict

from fastapi import APIRouter, Depends, Header, HTTPException, Request, status
from sqlalchemy import func
from sqlalchemy.orm import Session

try:
    from langgraph.graph import END, StateGraph
    from langgraph.checkpoint.memory import InMemorySaver

    try:
        from langgraph.checkpoint.sqlite import SqliteSaver  # type: ignore[attr-defined]
    except Exception:  # pragma: no cover - optional dependency
        SqliteSaver = None

    LANGGRAPH_AVAILABLE = True
except Exception:  # pragma: no cover - fallback for environments without langgraph
    END = None
    InMemorySaver = None
    SqliteSaver = None
    StateGraph = None
    LANGGRAPH_AVAILABLE = False

from app.agents.expense_agent import classify_expense, suggest_expense_categories
from app.agents.tax_agent import analyze_tax_deductibility
from app.config import (
    AUTO_CLASSIFICATION_ENABLED,
    LANGGRAPH_CHECKPOINT_PATH,
    SMS_FORWARD_DEFAULT_USER_EMAIL,
    SMS_FORWARD_SECRET,
    WEBHOOK_SECRET,
)
from app.models.database import get_db
from app.models.schemas import RealtimeTransactionEvent, Transaction, User, UserFeedback, UserNotification
from app.schemas.realtime import (
    ClassifySelectionRequest,
    GatewayTransactionIn,
    NotificationResponse,
    PendingClassificationResponse,
    SmsForwardIn,
    SmsTransactionIn,
)
from app.services.auth_service import get_current_user
from app.services.notification_service import create_notification
from app.services.rate_limit_service import enforce_rate_limit
from app.services.sms_parser_service import build_sms_external_txn_id, parse_bank_sms
from app.utils.time import utcnow

router = APIRouter()


class AutoDecisionState(TypedDict):
    dominant_category: str | None
    agreement_ratio: float
    seen_count: int
    accepted_ratio: float
    accepted_samples: int
    accepted_streak: int
    predicted: str
    min_seen: int
    threshold: float
    auto_classified: bool


class IngestionDecisionState(TypedDict):
    db: Session
    user_id: int
    merchant: str
    amount: float
    txn_date: datetime
    suggestions: list[str]
    predicted: str
    dominant_category: str | None
    agreement_ratio: float
    seen_count: int
    accepted_ratio: float
    accepted_samples: int
    accepted_streak: int
    decision_thread_id: str
    min_seen: int
    threshold: float
    auto_classified: bool


def _decision_threshold_node(state: AutoDecisionState) -> AutoDecisionState:
    min_seen = 5
    threshold = 0.95
    if state["accepted_samples"] >= 10:
        threshold = 0.9
    if state["accepted_streak"] >= 5:
        min_seen = 3
        threshold = 0.85

    state["min_seen"] = min_seen
    state["threshold"] = threshold
    return state


def _decision_auto_node(state: AutoDecisionState) -> AutoDecisionState:
    state["auto_classified"] = (
        bool(state["dominant_category"])
        and state["seen_count"] >= state["min_seen"]
        and state["agreement_ratio"] >= state["threshold"]
        and state["accepted_samples"] >= state["min_seen"]
        and state["accepted_ratio"] >= state["threshold"]
        and state["dominant_category"] == state["predicted"]
    )
    return state


def _build_langgraph_checkpointer():
    if not LANGGRAPH_AVAILABLE:
        return None

    if SqliteSaver is not None and LANGGRAPH_CHECKPOINT_PATH:
        checkpoint_dir = os.path.dirname(LANGGRAPH_CHECKPOINT_PATH)
        if checkpoint_dir:
            os.makedirs(checkpoint_dir, exist_ok=True)
        import sqlite3
        conn = sqlite3.connect(LANGGRAPH_CHECKPOINT_PATH, check_same_thread=False)
        saver = SqliteSaver(conn)
        saver.setup()
        return saver

    return InMemorySaver()


_langgraph_checkpointer = _build_langgraph_checkpointer()


if LANGGRAPH_AVAILABLE:
    _decision_graph_builder = StateGraph(AutoDecisionState)
    _decision_graph_builder.add_node("compute_threshold", _decision_threshold_node)
    _decision_graph_builder.add_node("compute_auto", _decision_auto_node)
    _decision_graph_builder.set_entry_point("compute_threshold")
    _decision_graph_builder.add_edge("compute_threshold", "compute_auto")
    _decision_graph_builder.add_edge("compute_auto", END)
    _decision_graph = _decision_graph_builder.compile(checkpointer=_langgraph_checkpointer)

    _ingestion_graph_builder = StateGraph(IngestionDecisionState)

    def _ingestion_personalize_node(state: IngestionDecisionState) -> IngestionDecisionState:
        suggestions = _personalize_suggestions(
            db=state["db"],
            user_id=state["user_id"],
            merchant=state["merchant"],
            amount=state["amount"],
            txn_date=state["txn_date"],
            suggestions=state["suggestions"],
        )
        state["suggestions"] = suggestions
        state["predicted"] = suggestions[0] if suggestions else state["predicted"]
        return state

    def _ingestion_metrics_node(state: IngestionDecisionState) -> IngestionDecisionState:
        dominant_category, agreement_ratio, seen_count = _merchant_category_agreement(
            db=state["db"],
            user_id=state["user_id"],
            merchant=state["merchant"],
        )
        accepted_ratio, accepted_samples, accepted_streak = _merchant_prediction_acceptance(
            db=state["db"],
            user_id=state["user_id"],
            merchant=state["merchant"],
        )
        state["dominant_category"] = dominant_category
        state["agreement_ratio"] = agreement_ratio
        state["seen_count"] = seen_count
        state["accepted_ratio"] = accepted_ratio
        state["accepted_samples"] = accepted_samples
        state["accepted_streak"] = accepted_streak
        return state

    def _ingestion_threshold_node(state: IngestionDecisionState) -> IngestionDecisionState:
        auto_state = _decision_threshold_node(
            {
                "dominant_category": state["dominant_category"],
                "agreement_ratio": state["agreement_ratio"],
                "seen_count": state["seen_count"],
                "accepted_ratio": state["accepted_ratio"],
                "accepted_samples": state["accepted_samples"],
                "accepted_streak": state["accepted_streak"],
                "predicted": state["predicted"],
                "min_seen": state["min_seen"],
                "threshold": state["threshold"],
                "auto_classified": state["auto_classified"],
            }
        )
        state["min_seen"] = auto_state["min_seen"]
        state["threshold"] = auto_state["threshold"]
        return state

    def _ingestion_auto_node(state: IngestionDecisionState) -> IngestionDecisionState:
        auto_state = _run_auto_decision_graph(
            {
                "dominant_category": state["dominant_category"],
                "agreement_ratio": state["agreement_ratio"],
                "seen_count": state["seen_count"],
                "accepted_ratio": state["accepted_ratio"],
                "accepted_samples": state["accepted_samples"],
                "accepted_streak": state["accepted_streak"],
                "predicted": state["predicted"],
                "min_seen": state["min_seen"],
                "threshold": state["threshold"],
                "auto_classified": state["auto_classified"],
            },
            thread_id=state["decision_thread_id"],
        )
        state["min_seen"] = auto_state["min_seen"]
        state["threshold"] = auto_state["threshold"]
        state["auto_classified"] = auto_state["auto_classified"]
        return state

    _ingestion_graph_builder.add_node("personalize", _ingestion_personalize_node)
    _ingestion_graph_builder.add_node("metrics", _ingestion_metrics_node)
    _ingestion_graph_builder.add_node("threshold", _ingestion_threshold_node)
    _ingestion_graph_builder.add_node("auto", _ingestion_auto_node)
    _ingestion_graph_builder.set_entry_point("personalize")
    _ingestion_graph_builder.add_edge("personalize", "metrics")
    _ingestion_graph_builder.add_edge("metrics", "threshold")
    _ingestion_graph_builder.add_edge("threshold", "auto")
    _ingestion_graph_builder.add_edge("auto", END)
    # Ingestion graph carries live DB session in state, so it should not be checkpointed.
    _ingestion_graph = _ingestion_graph_builder.compile()
else:
    _decision_graph = None
    _ingestion_graph = None


def _run_auto_decision_graph(state: AutoDecisionState, thread_id: str | None = None) -> AutoDecisionState:
    if _decision_graph is not None:
        config = {"configurable": {"thread_id": thread_id}} if thread_id else None
        return _decision_graph.invoke(state, config=config)

    # Keep equivalent behavior when langgraph is unavailable.
    state = _decision_threshold_node(state)
    return _decision_auto_node(state)


def _run_ingestion_decision_graph(
    state: IngestionDecisionState,
    thread_id: str | None = None,
) -> IngestionDecisionState:
    if _ingestion_graph is not None:
        config = {"configurable": {"thread_id": thread_id}} if thread_id else None
        return _ingestion_graph.invoke(state, config=config)

    # Keep equivalent behavior when langgraph is unavailable.
    state["suggestions"] = _personalize_suggestions(
        db=state["db"],
        user_id=state["user_id"],
        merchant=state["merchant"],
        amount=state["amount"],
        txn_date=state["txn_date"],
        suggestions=state["suggestions"],
    )
    state["predicted"] = state["suggestions"][0] if state["suggestions"] else state["predicted"]

    dominant_category, agreement_ratio, seen_count = _merchant_category_agreement(
        db=state["db"],
        user_id=state["user_id"],
        merchant=state["merchant"],
    )
    accepted_ratio, accepted_samples, accepted_streak = _merchant_prediction_acceptance(
        db=state["db"],
        user_id=state["user_id"],
        merchant=state["merchant"],
    )
    state["dominant_category"] = dominant_category
    state["agreement_ratio"] = agreement_ratio
    state["seen_count"] = seen_count
    state["accepted_ratio"] = accepted_ratio
    state["accepted_samples"] = accepted_samples
    state["accepted_streak"] = accepted_streak

    auto_state = _run_auto_decision_graph(
        {
            "dominant_category": state["dominant_category"],
            "agreement_ratio": state["agreement_ratio"],
            "seen_count": state["seen_count"],
            "accepted_ratio": state["accepted_ratio"],
            "accepted_samples": state["accepted_samples"],
            "accepted_streak": state["accepted_streak"],
            "predicted": state["predicted"],
            "min_seen": state["min_seen"],
            "threshold": state["threshold"],
            "auto_classified": state["auto_classified"],
        },
        thread_id=state["decision_thread_id"],
    )
    state["min_seen"] = auto_state["min_seen"]
    state["threshold"] = auto_state["threshold"]
    state["auto_classified"] = auto_state["auto_classified"]
    return state


def _normalize_suggestions(suggestions: list[str]) -> list[str]:
    cleaned: list[str] = []
    for category in suggestions:
        value = (category or "").strip()
        if value and value not in cleaned:
            cleaned.append(value)

    if "Others" in cleaned:
        cleaned = [c for c in cleaned if c != "Others"] + ["Others"]

    return cleaned


def _amount_band(amount: float) -> str:
    if amount < 200:
        return "micro"
    if amount < 1000:
        return "small"
    if amount < 5000:
        return "medium"
    return "large"


def _hour_bucket(dt: datetime) -> str:
    hour = dt.hour
    if 5 <= hour < 12:
        return "morning"
    if 12 <= hour < 17:
        return "afternoon"
    if 17 <= hour < 22:
        return "evening"
    return "night"


def _preference_scores(
    db: Session,
    user_id: int,
    merchant: str,
    amount: float,
    txn_date: datetime,
) -> Counter:
    rows = (
        db.query(Transaction.category, Transaction.merchant, Transaction.amount, Transaction.date)
        .filter(Transaction.user_id == user_id, Transaction.category.isnot(None))
        .order_by(Transaction.date.desc())
        .limit(300)
        .all()
    )

    scores: Counter = Counter()
    merchant_key = (merchant or "").strip().lower()
    band = _amount_band(amount)
    bucket = _hour_bucket(txn_date)

    for category, row_merchant, row_amount, row_date in rows:
        if not category:
            continue

        row_merchant_key = (row_merchant or "").strip().lower()
        weight = 0
        if row_merchant_key and row_merchant_key == merchant_key:
            weight += 4

        if row_amount is not None and _amount_band(float(row_amount)) == band:
            weight += 2

        if row_date and _hour_bucket(row_date) == bucket:
            weight += 1

        if weight > 0:
            scores[category] += weight

    return scores


def _personalize_suggestions(
    db: Session,
    user_id: int,
    merchant: str,
    amount: float,
    txn_date: datetime,
    suggestions: list[str],
) -> list[str]:
    base = _normalize_suggestions(suggestions)
    scores = _preference_scores(
        db=db,
        user_id=user_id,
        merchant=merchant,
        amount=amount,
        txn_date=txn_date,
    )
    if not scores:
        return base

    non_others = [c for c in base if c != "Others"]

    # Keep base suggestion order as weak prior while favoring learned user preferences.
    base_prior = {category: (len(non_others) - idx) * 0.1 for idx, category in enumerate(non_others)}
    universe = set(non_others) | set(scores.keys())
    ranked = sorted(
        universe,
        key=lambda category: (scores.get(category, 0) + base_prior.get(category, 0.0)),
        reverse=True,
    )

    if "Others" in base:
        return ranked + ["Others"]
    return ranked


def _merchant_category_agreement(
    db: Session,
    user_id: int,
    merchant: str,
) -> tuple[str | None, float, int]:
    merchant_key = (merchant or "").strip().lower()
    if not merchant_key:
        return (None, 0.0, 0)

    rows = (
        db.query(Transaction.category)
        .filter(
            Transaction.user_id == user_id,
            Transaction.category.isnot(None),
            func.lower(Transaction.merchant) == merchant_key,
        )
        .order_by(Transaction.date.desc())
        .limit(100)
        .all()
    )
    categories = [row[0] for row in rows if row[0]]
    total = len(categories)
    if total == 0:
        return (None, 0.0, 0)

    counts = Counter(categories)
    dominant_category, dominant_count = counts.most_common(1)[0]
    agreement = dominant_count / total
    return (dominant_category, agreement, total)


def _merchant_prediction_acceptance(
    db: Session,
    user_id: int,
    merchant: str,
) -> tuple[float, int, int]:
    merchant_key = (merchant or "").strip().lower()
    if not merchant_key:
        return (0.0, 0, 0)

    events = (
        db.query(RealtimeTransactionEvent)
        .filter(
            RealtimeTransactionEvent.user_id == user_id,
            RealtimeTransactionEvent.status == "classified",
            RealtimeTransactionEvent.selected_category.isnot(None),
            func.lower(RealtimeTransactionEvent.merchant) == merchant_key,
        )
        .order_by(RealtimeTransactionEvent.created_at.desc())
        .limit(50)
        .all()
    )

    checks: list[bool] = []
    for event in events:
        if not event.suggested_categories:
            continue
        try:
            suggestions = json.loads(event.suggested_categories)
        except json.JSONDecodeError:
            continue
        if not suggestions:
            continue

        predicted = suggestions[0]
        checks.append(predicted == event.selected_category)

    total = len(checks)
    if total == 0:
        return (0.0, 0, 0)

    accepted = sum(1 for value in checks if value)
    accepted_ratio = accepted / total
    streak = 0
    for value in checks:
        if value:
            streak += 1
        else:
            break

    return (accepted_ratio, total, streak)


def _event_to_response(event: RealtimeTransactionEvent) -> PendingClassificationResponse:
    suggestions = []
    if event.suggested_categories:
        try:
            suggestions = json.loads(event.suggested_categories)
        except json.JSONDecodeError:
            suggestions = []

    return PendingClassificationResponse(
        id=event.id,
        provider=event.provider,
        external_txn_id=event.external_txn_id,
        amount=event.amount,
        merchant=event.merchant,
        description=event.description,
        txn_date=event.txn_date,
        status=event.status,
        suggested_categories=suggestions,
        selected_category=event.selected_category,
        confidence_score=event.confidence_score,
        reminder_count=event.reminder_count,
        created_at=event.created_at,
    )


def _create_pending_event(
    db: Session,
    user: User,
    provider: str,
    external_txn_id: str,
    amount: float,
    merchant: str,
    description: str | None,
    txn_date: datetime,
) -> dict:
    existing = (
        db.query(RealtimeTransactionEvent)
        .filter(
            RealtimeTransactionEvent.user_id == user.id,
            RealtimeTransactionEvent.provider == provider,
            RealtimeTransactionEvent.external_txn_id == external_txn_id,
        )
        .first()
    )
    if existing:
        return {"status": "duplicate", "event_id": existing.id, "event_status": existing.status}

    prediction = classify_expense(merchant, description or "", amount)
    suggestions = suggest_expense_categories(merchant, description or "", amount)
    predicted = (prediction.get("category") or "").strip() or "Miscellaneous"
    if predicted not in suggestions:
        suggestions = [predicted, *suggestions]
    decision_thread_id = f"ingest:{user.id}:{provider}:{external_txn_id}"
    decision = _run_ingestion_decision_graph(
        {
            "db": db,
            "user_id": user.id,
            "merchant": merchant,
            "amount": amount,
            "txn_date": txn_date,
            "suggestions": suggestions,
            "predicted": predicted,
            "dominant_category": None,
            "agreement_ratio": 0.0,
            "seen_count": 0,
            "accepted_ratio": 0.0,
            "accepted_samples": 0,
            "accepted_streak": 0,
            "decision_thread_id": decision_thread_id,
            "min_seen": 0,
            "threshold": 0.0,
            "auto_classified": False,
        },
        thread_id=decision_thread_id,
    )
    suggestions = decision["suggestions"]
    predicted = decision["predicted"]
    dominant_category = decision["dominant_category"]
    agreement_ratio = decision["agreement_ratio"]
    seen_count = decision["seen_count"]
    accepted_ratio = decision["accepted_ratio"]
    accepted_samples = decision["accepted_samples"]
    accepted_streak = decision["accepted_streak"]
    auto_classified = decision["auto_classified"] and AUTO_CLASSIFICATION_ENABLED

    event_status = "classified" if auto_classified else "pending"
    selected_category = dominant_category if auto_classified else None

    event = RealtimeTransactionEvent(
        user_id=user.id,
        provider=provider,
        external_txn_id=external_txn_id,
        amount=amount,
        merchant=merchant,
        description=description,
        txn_date=txn_date,
        status=event_status,
        suggested_categories=json.dumps(suggestions),
        selected_category=selected_category,
        confidence_score=prediction.get("confidence_score"),
    )
    db.add(event)
    db.flush()

    created_txn = None
    if auto_classified and dominant_category:
        tax_info = analyze_tax_deductibility(merchant, description or "", dominant_category)
        created_txn = Transaction(
            user_id=user.id,
            date=txn_date,
            amount=amount,
            merchant=merchant,
            description=description,
            category=dominant_category,
            confidence_score=prediction.get("confidence_score"),
            is_tax_deductible=tax_info.get("is_tax_deductible", False),
            tax_category=tax_info.get("tax_category", None),
        )
        db.add(created_txn)

    db.commit()
    db.refresh(event)
    if created_txn:
        db.refresh(created_txn)

    if auto_classified and dominant_category:
        create_notification(
            db=db,
            user_id=user.id,
            notification_type="classification_auto_applied",
            title="Auto-classified from your past feedback",
            message=(
                f"Saved {merchant} as '{dominant_category}' automatically "
                f"({agreement_ratio * 100:.0f}% agreement over {seen_count} similar transactions)."
            ),
            payload={
                "event_id": event.id,
                "transaction_id": created_txn.id if created_txn else None,
                "auto_classified": True,
                "category": dominant_category,
                "agreement_ratio": round(agreement_ratio, 3),
                "seen_count": seen_count,
                "accepted_ratio": round(accepted_ratio, 3),
                "accepted_samples": accepted_samples,
                "accepted_streak": accepted_streak,
                "decision_threshold": decision["threshold"],
                "decision_min_seen": decision["min_seen"],
                "auto_classification_enabled": AUTO_CLASSIFICATION_ENABLED,
                "suggested_categories": suggestions,
            },
        )
        return {
            "status": "auto_classified",
            "event_id": event.id,
            "transaction_id": created_txn.id if created_txn else None,
            "category": dominant_category,
            "agreement_ratio": agreement_ratio,
            "seen_count": seen_count,
            "accepted_ratio": accepted_ratio,
            "accepted_samples": accepted_samples,
            "accepted_streak": accepted_streak,
            "decision_threshold": decision["threshold"],
            "decision_min_seen": decision["min_seen"],
            "predicted_category": predicted,
        }

    create_notification(
        db=db,
        user_id=user.id,
        notification_type="classification_required",
        title="Classify your new transaction",
        message=(
            f"AI guessed '{predicted}' for {merchant} (Rs. {amount:.2f}). Is this correct?"
        ),
        payload={
            "event_id": event.id,
            "predicted_category": predicted,
            "suggested_categories": suggestions,
        },
    )

    return {
        "status": "pending_classification",
        "event_id": event.id,
        "suggested_categories": suggestions,
        "predicted_category": predicted,
    }


@router.post("/webhook/transaction")
def ingest_transaction_webhook(
    payload: GatewayTransactionIn,
    request: Request,
    db: Session = Depends(get_db),
    x_webhook_secret: str | None = Header(default=None),
):
    """
    Provider callback endpoint for realtime transaction ingestion.
    Use WEBHOOK_SECRET in header X-Webhook-Secret.
    """
    enforce_rate_limit(request, key_prefix="webhook_transaction", limit=120, window_seconds=60)

    if x_webhook_secret != WEBHOOK_SECRET:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid webhook secret")

    user = db.query(User).filter(User.email == payload.user_email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found for webhook payload")

    return _create_pending_event(
        db=db,
        user=user,
        provider=payload.provider,
        external_txn_id=payload.external_txn_id,
        amount=payload.amount,
        merchant=payload.merchant,
        description=payload.description,
        txn_date=payload.txn_date or utcnow(),
    )


@router.post("/sms/ingest")
def ingest_sms_transaction(
    payload: SmsTransactionIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Parse a bank SMS, auto-classify using the rule-based engine, and save
    directly as a Transaction so it appears in Analytics/Tax/Dashboard."""
    from app.agents.expense_agent import _rule_based_classify, CONFIDENCE_THRESHOLD

    parsed = parse_bank_sms(payload.sms_text)
    if not parsed.get("is_transaction"):
        return {
            "status": "ignored",
            "reason": parsed.get("reason", "Unable to parse SMS"),
        }

    if parsed.get("direction") != "debit":
        return {
            "status": "ignored",
            "reason": f"Non-debit transaction detected ({parsed.get('direction')})",
        }

    merchant = parsed["merchant"]
    amount = parsed["amount"]
    description = parsed.get("description", "")
    txn_date = parsed.get("txn_date") or utcnow()

    # --- Auto-classify expense using rule-based engine (instant, no LLM) ---
    rule_result = _rule_based_classify(merchant, description)
    if rule_result and rule_result["confidence_score"] >= CONFIDENCE_THRESHOLD:
        category = rule_result["category"]
        confidence = rule_result["confidence_score"]
    else:
        category = "Miscellaneous"
        confidence = 0.5

    # --- Auto-determine tax deductibility (instant, no LLM) ---
    TAX_RULES_MAP = {
        "Insurance": {"is_tax_deductible": True, "tax_category": "Section 80C / 80D"},
        "Healthcare": {"is_tax_deductible": True, "tax_category": "Section 80D"},
        "Education": {"is_tax_deductible": True, "tax_category": "Section 80C / 80E"},
        "Investment": {"is_tax_deductible": True, "tax_category": "Section 80C / 80CCD"},
        "Rent": {"is_tax_deductible": True, "tax_category": "Section 10(13A) / 80GG"},
        "EMI & Loans": {"is_tax_deductible": True, "tax_category": "Section 24(b) / 80E"},
    }
    tax_info = TAX_RULES_MAP.get(category, {"is_tax_deductible": False, "tax_category": None})

    # --- Save directly as a Transaction (merges with CSV data) ---
    db_txn = Transaction(
        user_id=current_user.id,
        date=txn_date,
        amount=amount,
        merchant=merchant,
        description=description,
        category=category,
        confidence_score=confidence,
        is_tax_deductible=tax_info["is_tax_deductible"],
        tax_category=tax_info.get("tax_category"),
    )
    db.add(db_txn)
    db.commit()
    db.refresh(db_txn)

    return {
        "status": "saved",
        "message": f"Transaction saved as '{category}' (confidence: {confidence:.0%})",
        "transaction": {
            "id": db_txn.id,
            "date": str(db_txn.date),
            "merchant": db_txn.merchant,
            "amount": db_txn.amount,
            "category": db_txn.category,
            "is_tax_deductible": db_txn.is_tax_deductible,
            "tax_category": db_txn.tax_category,
        },
        "parsed": {
            "amount": amount,
            "merchant": merchant,
            "txn_date": str(txn_date),
            "provider": payload.provider,
            "sender": payload.sender,
        },
    }


@router.post("/sms/forward")
def ingest_sms_forwarder(
    payload: SmsForwardIn,
    request: Request,
    db: Session = Depends(get_db),
    x_sms_forward_secret: str | None = Header(default=None),
):
    """
    Public endpoint for Android SMS forwarder apps.
    Authenticate using X-SMS-Forward-Secret.
    """
    enforce_rate_limit(request, key_prefix="sms_forward", limit=120, window_seconds=60)

    if not SMS_FORWARD_SECRET:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="SMS forwarder secret is not configured",
        )
    if x_sms_forward_secret != SMS_FORWARD_SECRET:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid SMS forward secret")

    user_email = payload.user_email or SMS_FORWARD_DEFAULT_USER_EMAIL
    if not user_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="user_email is required when default forward user is not configured",
        )

    user = db.query(User).filter(User.email == user_email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found for SMS forward payload")

    parsed = parse_bank_sms(payload.sms_text)
    if not parsed.get("is_transaction"):
        return {"status": "ignored", "reason": parsed.get("reason", "Unable to parse SMS")}
    if parsed.get("direction") != "debit":
        return {"status": "ignored", "reason": f"Non-debit transaction detected ({parsed.get('direction')})"}

    external_txn_id = payload.external_txn_id or build_sms_external_txn_id(
        sender=payload.sender,
        sms_text=payload.sms_text,
        received_at=payload.received_at,
    )

    response = _create_pending_event(
        db=db,
        user=user,
        provider=payload.provider,
        external_txn_id=external_txn_id,
        amount=parsed["amount"],
        merchant=parsed["merchant"],
        description=parsed.get("description"),
        txn_date=parsed.get("txn_date") or utcnow(),
    )
    response["parsed"] = {
        "amount": parsed["amount"],
        "merchant": parsed["merchant"],
        "txn_date": parsed.get("txn_date"),
        "provider": payload.provider,
        "sender": payload.sender,
        "user_email": user_email,
    }
    return response


@router.get("/pending", response_model=List[PendingClassificationResponse])
def get_pending_events(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    events = (
        db.query(RealtimeTransactionEvent)
        .filter(
            RealtimeTransactionEvent.user_id == current_user.id,
            RealtimeTransactionEvent.status == "pending",
        )
        .order_by(RealtimeTransactionEvent.created_at.desc())
        .all()
    )
    return [_event_to_response(event) for event in events]


@router.post("/pending/{event_id}/classify")
def classify_pending_event(
    event_id: int,
    request: ClassifySelectionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    event = (
        db.query(RealtimeTransactionEvent)
        .filter(
            RealtimeTransactionEvent.id == event_id,
            RealtimeTransactionEvent.user_id == current_user.id,
        )
        .first()
    )
    if not event:
        raise HTTPException(status_code=404, detail="Pending transaction not found")
    if event.status != "pending":
        raise HTTPException(status_code=400, detail="Transaction already classified")

    predicted_category = None
    if event.suggested_categories:
        try:
            event_suggestions = json.loads(event.suggested_categories)
            if event_suggestions:
                predicted_category = event_suggestions[0]
        except json.JSONDecodeError:
            predicted_category = None

    category = request.selected_category
    if category == "Others":
        custom = (request.custom_category or "").strip()
        if not custom:
            raise HTTPException(status_code=400, detail="custom_category is required when selecting Others")
        category = custom

    tax_info = analyze_tax_deductibility(event.merchant, event.description or "", category)

    db_txn = Transaction(
        user_id=current_user.id,
        date=event.txn_date,
        amount=event.amount,
        merchant=event.merchant,
        description=event.description,
        category=category,
        confidence_score=event.confidence_score,
        is_tax_deductible=tax_info.get("is_tax_deductible", False),
        tax_category=tax_info.get("tax_category", None),
    )
    db.add(db_txn)
    db.flush()

    event.status = "classified"
    event.selected_category = category
    event.updated_at = utcnow()

    if predicted_category and category != predicted_category:
        db.add(
            UserFeedback(
                transaction_id=db_txn.id,
                source_event_id=event.id,
                predicted_category=predicted_category,
                corrected_category=category,
                corrected_tax_status=tax_info.get("is_tax_deductible", False),
                reason_type="prediction_override",
            )
        )

    db.commit()
    db.refresh(db_txn)

    if predicted_category and category != predicted_category:
        create_notification(
            db=db,
            user_id=current_user.id,
            notification_type="classification_feedback_recorded",
            title="Thanks, updated your preferences",
            message=(
                f"You changed '{predicted_category}' to '{category}'. "
                "Future suggestions for similar merchants will improve."
            ),
            payload={
                "transaction_id": db_txn.id,
                "event_id": event.id,
                "predicted_category": predicted_category,
                "final_category": category,
            },
        )

    create_notification(
        db=db,
        user_id=current_user.id,
        notification_type="classification_completed",
        title="Transaction classified",
        message=f"Saved {event.merchant} under '{category}'.",
        payload={"transaction_id": db_txn.id, "event_id": event.id},
    )

    return {
        "status": "classified",
        "transaction_id": db_txn.id,
        "category": category,
        "predicted_category": predicted_category,
        "was_prediction_accepted": category == predicted_category if predicted_category else None,
        "is_tax_deductible": db_txn.is_tax_deductible,
        "tax_category": db_txn.tax_category,
    }


@router.post("/transactions/{transaction_id}/reclassify")
def reclassify_transaction(
    transaction_id: int,
    request: ClassifySelectionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    txn = (
        db.query(Transaction)
        .filter(Transaction.id == transaction_id, Transaction.user_id == current_user.id)
        .first()
    )
    if not txn:
        raise HTTPException(status_code=404, detail="Transaction not found")

    category = request.selected_category
    if category == "Others":
        custom = (request.custom_category or "").strip()
        if not custom:
            raise HTTPException(status_code=400, detail="custom_category is required when selecting Others")
        category = custom

    previous_category = txn.category
    if previous_category == category:
        return {
            "status": "unchanged",
            "transaction_id": txn.id,
            "category": txn.category,
            "is_tax_deductible": txn.is_tax_deductible,
            "tax_category": txn.tax_category,
        }

    tax_info = analyze_tax_deductibility(txn.merchant, txn.description or "", category)
    txn.category = category
    txn.is_tax_deductible = tax_info.get("is_tax_deductible", False)
    txn.tax_category = tax_info.get("tax_category", None)
    db.add(
        UserFeedback(
            transaction_id=txn.id,
            source_event_id=None,
            predicted_category=previous_category,
            corrected_category=category,
            corrected_tax_status=txn.is_tax_deductible,
            reason_type="manual_reclassify",
        )
    )
    db.commit()

    create_notification(
        db=db,
        user_id=current_user.id,
        notification_type="classification_updated",
        title="Transaction category updated",
        message=(
            f"Updated {txn.merchant} from '{previous_category or 'Uncategorized'}' "
            f"to '{category}'."
        ),
        payload={
            "transaction_id": txn.id,
            "previous_category": previous_category,
            "new_category": category,
        },
    )

    return {
        "status": "updated",
        "transaction_id": txn.id,
        "previous_category": previous_category,
        "category": txn.category,
        "is_tax_deductible": txn.is_tax_deductible,
        "tax_category": txn.tax_category,
    }


@router.get("/metrics/feedback")
def get_feedback_metrics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    events = (
        db.query(RealtimeTransactionEvent)
        .filter(RealtimeTransactionEvent.user_id == current_user.id)
        .order_by(RealtimeTransactionEvent.created_at.desc())
        .all()
    )

    classified_events = [event for event in events if event.status == "classified"]
    pending_events = [event for event in events if event.status == "pending"]

    accepted_predictions = 0
    compared_predictions = 0
    for event in classified_events:
        if not event.suggested_categories or not event.selected_category:
            continue
        try:
            suggestions = json.loads(event.suggested_categories)
        except json.JSONDecodeError:
            continue
        if not suggestions:
            continue
        compared_predictions += 1
        if suggestions[0] == event.selected_category:
            accepted_predictions += 1

    auto_classified_count = (
        db.query(UserNotification)
        .filter(
            UserNotification.user_id == current_user.id,
            UserNotification.notification_type == "classification_auto_applied",
        )
        .count()
    )

    user_feedback_rows = (
        db.query(UserFeedback)
        .join(Transaction, Transaction.id == UserFeedback.transaction_id)
        .filter(Transaction.user_id == current_user.id)
        .all()
    )
    feedback_count = len(user_feedback_rows)
    override_count = sum(1 for row in user_feedback_rows if row.reason_type == "prediction_override")
    reclassify_count = sum(1 for row in user_feedback_rows if row.reason_type == "manual_reclassify")

    acceptance_rate = (
        round((accepted_predictions / compared_predictions) * 100, 2)
        if compared_predictions
        else 0.0
    )
    override_rate = (
        round((override_count / compared_predictions) * 100, 2)
        if compared_predictions
        else 0.0
    )

    return {
        "auto_classification_enabled": AUTO_CLASSIFICATION_ENABLED,
        "totals": {
            "events": len(events),
            "pending": len(pending_events),
            "classified": len(classified_events),
            "auto_classified": auto_classified_count,
            "feedback_records": feedback_count,
            "prediction_overrides": override_count,
            "manual_reclassifications": reclassify_count,
        },
        "quality": {
            "accepted_predictions": accepted_predictions,
            "compared_predictions": compared_predictions,
            "acceptance_rate_pct": acceptance_rate,
            "override_rate_pct": override_rate,
        },
    }


@router.get("/notifications", response_model=List[NotificationResponse])
def get_notifications(
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    rows = (
        db.query(UserNotification)
        .filter(UserNotification.user_id == current_user.id)
        .order_by(UserNotification.created_at.desc())
        .limit(limit)
        .all()
    )
    return rows


@router.post("/notifications/{notification_id}/read")
def mark_notification_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    row = (
        db.query(UserNotification)
        .filter(
            UserNotification.id == notification_id,
            UserNotification.user_id == current_user.id,
        )
        .first()
    )
    if not row:
        raise HTTPException(status_code=404, detail="Notification not found")

    row.is_read = True
    db.commit()
    return {"status": "ok", "notification_id": row.id}
