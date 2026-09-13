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
                created_at TEXT NOT NULL
            )
        """)
        conn.execute("CREATE INDEX IF NOT EXISTS idx_nudges_user ON nudges(user_id)")
    conn.close()


init_db()


def save_nudge(nudge: NudgeOut) -> None:
    conn = _get_connection()
    with conn:
        conn.execute(
            """
            INSERT OR REPLACE INTO nudges (id, user_id, trigger_id, message, status, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (
                nudge.id,
                str(nudge.user_id),
                nudge.trigger_id,
                nudge.message,
                nudge.status,
                nudge.created_at.isoformat() if isinstance(nudge.created_at, datetime) else str(nudge.created_at),
            ),
        )
    conn.close()


def save_nudges_batch(nudges: List[NudgeOut]) -> None:
    for n in nudges:
        save_nudge(n)


def get_nudges_by_user(user_id: str, limit: int = 50) -> List[NudgeOut]:
    conn = _get_connection()
    cursor = conn.cursor()
    cursor.execute(
        """
        SELECT id, user_id, trigger_id, message, status, created_at
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
            )
        )
    return result


def get_all_nudges(limit: int = 100) -> List[NudgeOut]:
    conn = _get_connection()
    cursor = conn.cursor()
    cursor.execute(
        """
        SELECT id, user_id, trigger_id, message, status, created_at
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
            )
        )
    return result
