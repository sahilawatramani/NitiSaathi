"""
Persistence service for Nudge Agent.
Stores and retrieves evaluated and generated nudges using SQLite.
"""
import os
import sqlite3
from datetime import datetime
from typing import List, Optional
from ..models.schemas import NudgeOut

DB_DIR = os.path.normpath(os.path.join(os.path.dirname(__file__), "..", "data"))
os.makedirs(DB_DIR, exist_ok=True)
DB_PATH = os.path.join(DB_DIR, "nudges.db")


def _get_connection():
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = _get_connection()
    with conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS nudges (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                trigger_id TEXT NOT NULL,
                message TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'pending',
                created_at TEXT NOT NULL,
                outcome_check_at TEXT,
                outcome_status TEXT DEFAULT 'pending',
                outcome_details TEXT
            )
        """)
        # Migration helpers for existing databases
        for col_def in [
            ("outcome_check_at", "TEXT"),
            ("outcome_status", "TEXT DEFAULT 'pending'"),
            ("outcome_details", "TEXT")
        ]:
            try:
                conn.execute(f"ALTER TABLE nudges ADD COLUMN {col_def[0]} {col_def[1]}")
            except sqlite3.OperationalError:
                pass
        conn.execute("CREATE INDEX IF NOT EXISTS idx_nudges_user ON nudges(user_id)")
        conn.execute("CREATE INDEX IF NOT EXISTS idx_nudges_outcome ON nudges(outcome_status, outcome_check_at)")
    conn.close()


init_db()


def save_nudge(nudge: NudgeOut) -> None:
    conn = _get_connection()
    outcome_check_str = nudge.outcome_check_at.isoformat() if isinstance(nudge.outcome_check_at, datetime) else str(nudge.outcome_check_at) if nudge.outcome_check_at else None
    with conn:
        conn.execute(
            """
            INSERT OR REPLACE INTO nudges (id, user_id, trigger_id, message, status, created_at, outcome_check_at, outcome_status, outcome_details)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                nudge.id,
                str(nudge.user_id),
                nudge.trigger_id,
                nudge.message,
                nudge.status,
                nudge.created_at.isoformat() if isinstance(nudge.created_at, datetime) else str(nudge.created_at),
                outcome_check_str,
                nudge.outcome_status or "pending",
                nudge.outcome_details,
            ),
        )
    conn.close()


def save_nudges_batch(nudges: List[NudgeOut]) -> None:
    for n in nudges:
        save_nudge(n)


def update_nudge_outcome(nudge_id: str, outcome_status: str, outcome_details: str) -> None:
    conn = _get_connection()
    with conn:
        conn.execute(
            """
            UPDATE nudges
            SET outcome_status = ?, outcome_details = ?, status = 'evaluated'
            WHERE id = ?
            """,
            (outcome_status, outcome_details, nudge_id),
        )
    conn.close()


def get_pending_outcome_nudges(limit: int = 100) -> List[NudgeOut]:
    conn = _get_connection()
    cursor = conn.cursor()
    cursor.execute(
        """
        SELECT id, user_id, trigger_id, message, status, created_at, outcome_check_at, outcome_status, outcome_details
        FROM nudges
        WHERE outcome_status = 'pending'
        ORDER BY created_at ASC
        LIMIT ?
        """,
        (limit,),
    )
    rows = cursor.fetchall()
    conn.close()

    result = []
    for row in rows:
        result.append(
            NudgeOut(
                id=row["id"],
                user_id=row["user_id"],
                trigger_id=row["trigger_id"],
                message=row["message"],
                status=row["status"],
                created_at=datetime.fromisoformat(row["created_at"]) if "T" in row["created_at"] else datetime.utcnow(),
                outcome_check_at=datetime.fromisoformat(row["outcome_check_at"]) if row["outcome_check_at"] and "T" in row["outcome_check_at"] else None,
                outcome_status=row["outcome_status"],
                outcome_details=row["outcome_details"],
            )
        )
    return result


def get_nudges_by_user(user_id: str, limit: int = 50) -> List[NudgeOut]:
    conn = _get_connection()
    cursor = conn.cursor()
    cursor.execute(
        """
        SELECT id, user_id, trigger_id, message, status, created_at, outcome_check_at, outcome_status, outcome_details
        FROM nudges
        WHERE user_id = ?
        ORDER BY created_at DESC
        LIMIT ?
        """,
        (str(user_id), limit),
    )
    rows = cursor.fetchall()
    conn.close()

    result = []
    for row in rows:
        result.append(
            NudgeOut(
                id=row["id"],
                user_id=row["user_id"],
                trigger_id=row["trigger_id"],
                message=row["message"],
                status=row["status"],
                created_at=datetime.fromisoformat(row["created_at"]) if "T" in row["created_at"] else datetime.utcnow(),
                outcome_check_at=datetime.fromisoformat(row["outcome_check_at"]) if row["outcome_check_at"] and "T" in row["outcome_check_at"] else None,
                outcome_status=row["outcome_status"],
                outcome_details=row["outcome_details"],
            )
        )
    return result


def get_all_nudges(limit: int = 100) -> List[NudgeOut]:
    conn = _get_connection()
    cursor = conn.cursor()
    cursor.execute(
        """
        SELECT id, user_id, trigger_id, message, status, created_at, outcome_check_at, outcome_status, outcome_details
        FROM nudges
        ORDER BY created_at DESC
        LIMIT ?
        """,
        (limit,),
    )
    rows = cursor.fetchall()
    conn.close()

    result = []
    for row in rows:
        result.append(
            NudgeOut(
                id=row["id"],
                user_id=row["user_id"],
                trigger_id=row["trigger_id"],
                message=row["message"],
                status=row["status"],
                created_at=datetime.fromisoformat(row["created_at"]) if "T" in row["created_at"] else datetime.utcnow(),
                outcome_check_at=datetime.fromisoformat(row["outcome_check_at"]) if row["outcome_check_at"] and "T" in row["outcome_check_at"] else None,
                outcome_status=row["outcome_status"],
                outcome_details=row["outcome_details"],
            )
        )
    return result


def get_outcome_analytics_summary() -> dict:
    conn = _get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM nudges")
    total = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM nudges WHERE outcome_status IN ('positive', 'neutral', 'negative')")
    evaluated = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM nudges WHERE outcome_status = 'positive'")
    positive = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM nudges WHERE outcome_status = 'neutral'")
    neutral = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM nudges WHERE outcome_status = 'negative'")
    negative = cursor.fetchone()[0]
    conn.close()

    efficacy_rate = round(positive / evaluated * 100, 1) if evaluated > 0 else 0.0

    return {
        "total_nudges_recorded": total,
        "total_outcomes_evaluated": evaluated,
        "positive_outcomes": positive,
        "neutral_outcomes": neutral,
        "negative_outcomes": negative,
        "efficacy_rate_pct": efficacy_rate,
        "measured_benefit": "Evaluates PMSBY preservation, buffer maintenance, and goal progression."
    }

