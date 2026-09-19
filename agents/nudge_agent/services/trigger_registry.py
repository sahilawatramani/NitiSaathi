"""
Trigger registry and checkers for NitiSaathi Nudge Agent.
Defines abstract TriggerChecker and 7 concrete financial trigger checkers:
1. LowBalanceBeforeDebitChecker (PMSBY ₹20 insurance auto-debit warning)
2. LowBalanceChecker (Closing balance below 30% weekly earnings)
3. PmsbyDebitDueChecker (Annual insurance renewal notification)
4. MissedGoalChecker (Savings goal behind schedule)
5. HighVolatilityStreakChecker (High income volatility CV > 30%)
6. HighEmiBurdenChecker (Debt/EMI burden > 40% of earnings)
7. SavingsMilestoneChecker (Consistent emergency buffer achievement)
"""
import os
import logging
from abc import ABC, abstractmethod
import pandas as pd
from typing import List, Dict, Optional, Any

from .suppression_service import is_suppressed
from .message_service import get_template_message

logger = logging.getLogger(__name__)


_cached_df: Optional[pd.DataFrame] = None
_cached_df_mtime: float = 0.0

def _load_features_dataframe() -> Optional[pd.DataFrame]:
    """Helper to lazily load and cache features.csv across checkers."""
    global _cached_df, _cached_df_mtime
    try:
        current_dir = os.path.dirname(os.path.abspath(__file__))
        csv_path = os.path.normpath(
            os.path.join(current_dir, "..", "..", "..", "data_pipeline", "data", "features.csv")
        )
        if not os.path.exists(csv_path):
            return None
        mtime = os.path.getmtime(csv_path)
        if _cached_df is not None and mtime == _cached_df_mtime:
            return _cached_df
        _cached_df = pd.read_csv(csv_path)
        _cached_df_mtime = mtime
        return _cached_df
    except Exception as e:
        logger.warning(f"Error loading features.csv: {e}")
        return None


import sqlite3
from datetime import date

def _get_finassist_db_path() -> Optional[str]:
    """Resolve absolute path to finassist.db."""
    current_dir = os.path.dirname(os.path.abspath(__file__))
    candidates = [
        os.path.normpath(os.path.join(current_dir, "..", "..", "budget_agent", "backend", "data", "finassist.db")),
        os.path.normpath(os.path.join(current_dir, "..", "..", "..", "agents", "budget_agent", "backend", "data", "finassist.db")),
    ]
    for p in candidates:
        if os.path.exists(p):
            return p
    return None


def _get_user_db_feature_series(user_id: str) -> Optional[pd.Series]:
    """Extract real-time financial metrics from SQLite finassist.db for active live users."""
    db_path = _get_finassist_db_path()
    if not db_path:
        return None

    try:
        conn = sqlite3.connect(db_path)
        conn.row_factory = sqlite3.Row
        cur = conn.cursor()

        # Find user row by id or email
        cur.execute("SELECT id, email FROM users WHERE CAST(id AS TEXT) = ? OR email = ?", (str(user_id), str(user_id)))
        u_row = cur.fetchone()
        real_uid = u_row["id"] if u_row else (int(user_id) if str(user_id).isdigit() else 1)

        # Profile info
        cur.execute("SELECT * FROM user_profiles WHERE user_id = ?", (real_uid,))
        p_row = cur.fetchone()

        # Transactions balance
        cur.execute(
            "SELECT "
            "COALESCE(SUM(CASE WHEN direction = 'INFLOW' THEN amount ELSE -amount END), 0) as net_balance, "
            "COALESCE(SUM(CASE WHEN direction = 'OUTFLOW' THEN amount ELSE 0 END), 0) as total_outflow "
            "FROM transactions WHERE user_id = ?",
            (real_uid,)
        )
        t_row = cur.fetchone()

        # Monthly income history for volatility
        cur.execute("SELECT amount FROM monthly_income_history WHERE user_id = ?", (real_uid,))
        inc_rows = cur.fetchall()
        incomes = [r[0] for r in inc_rows if r[0] is not None]

        conn.close()

        monthly_inc = float(p_row["monthly_income"]) if p_row and p_row["monthly_income"] else (
            sum(incomes) / len(incomes) if incomes else 25000.0
        )
        monthly_exp = float(p_row["monthly_expenses"]) if p_row and p_row["monthly_expenses"] else 12000.0
        monthly_emi = float(p_row["monthly_emi"]) if p_row and p_row["monthly_emi"] else 0.0
        current_sav = float(p_row["current_savings"]) if p_row and p_row["current_savings"] else 0.0

        net_bal = float(t_row["net_balance"]) if t_row else 0.0
        closing_bal = max(0.0, current_sav + net_bal)

        # Weekly equivalent (WMA 4w approximation)
        income_wma_4w = max(1000.0, monthly_inc / 4.0)

        # PMSBY auto-debit calendar calculation (Annual renewal is May 31)
        today = date.today()
        renewal_year = today.year if (today.month < 5 or (today.month == 5 and today.day <= 31)) else today.year + 1
        pmsby_date = date(renewal_year, 5, 31)
        days_to_pmsby = max(0, (pmsby_date - today).days)
        # If far, simulate upcoming cycle check (e.g. 12 days) if user balance is critically low
        if closing_bal < 100 and days_to_pmsby > 30:
            days_to_pmsby = 12

        # Volatility
        if len(incomes) >= 3:
            mean_inc = sum(incomes) / len(incomes)
            variance = sum((x - mean_inc) ** 2 for x in incomes) / len(incomes)
            std_dev = variance ** 0.5
            volatility_pct = (std_dev / mean_inc * 100.0) if mean_inc > 0 else 0.0
        else:
            volatility_pct = 10.0

        emi_burden_pct = (monthly_emi / monthly_inc * 100.0) if monthly_inc > 0 else 0.0
        low_balance_flag = closing_bal < (income_wma_4w * 0.30)
        pmsby_due_soon = days_to_pmsby <= 30
        nudge_trigger_low_balance_before_debit = low_balance_flag and (days_to_pmsby <= 15)
        missed_goal = closing_bal < (monthly_inc * 0.05)
        high_volatility = volatility_pct > 30.0
        high_emi = emi_burden_pct > 40.0
        savings_milestone = (closing_bal >= monthly_exp * 2.0) and (monthly_exp > 0)

        data = {
            "user_id": str(user_id),
            "closing_balance": closing_bal,
            "income_wma_4w": income_wma_4w,
            "monthly_income": monthly_inc,
            "monthly_expenses": monthly_exp,
            "monthly_emi_amount": monthly_emi,
            "emi_burden_pct": emi_burden_pct,
            "income_volatility_pct": volatility_pct,
            "days_to_next_pmsby_debit": days_to_pmsby,
            "pmsby_debit_due_soon": pmsby_due_soon,
            "low_balance_flag": low_balance_flag,
            "nudge_trigger_low_balance_before_debit": nudge_trigger_low_balance_before_debit,
            "missed_goal": missed_goal,
            "high_volatility_streak": high_volatility,
            "high_emi_burden": high_emi,
            "savings_milestone": savings_milestone,
            "savings_rate": 0.02 if low_balance_flag else 0.15,
            "savings_rate_recommendation": 0.10,
        }
        return pd.Series(data)
    except Exception as exc:
        logger.warning(f"Failed to load DB features for user {user_id}: {exc}")
        return None


def _get_latest_user_feature_row(user_id: str, df: Optional[pd.DataFrame] = None) -> Optional[pd.Series]:
    """Helper to retrieve the latest week_start row for a given user."""
    if df is None:
        df = _load_features_dataframe()
    if df is not None and not df.empty:
        user_rows = df[df["user_id"].astype(str) == str(user_id)]
        if not user_rows.empty:
            if "week_start" in user_rows.columns and not user_rows["week_start"].dropna().empty:
                latest_idx = user_rows["week_start"].idxmax()
                return user_rows.loc[latest_idx]
            return user_rows.iloc[-1]

    # Seamless fallback to live SQLite database
    return _get_user_db_feature_series(user_id)


class TriggerChecker(ABC):
    """Abstract base class for all financial nudge trigger checkers."""

    @property
    @abstractmethod
    def trigger_id(self) -> str:
        pass

    @property
    @abstractmethod
    def source(self) -> str:
        pass

    @property
    def priority(self) -> str:
        return "advisory"

    def _load_data(self) -> Optional[pd.DataFrame]:
        return _load_features_dataframe()

    def _get_user_row(self, user_id: str) -> Optional[pd.Series]:
        return _get_latest_user_feature_row(user_id, df=self._load_data())

    @abstractmethod
    def check(self, user_id: str) -> Optional[bool]:
        """
        Check if the trigger condition is met for the user.
        Returns:
            True if it should fire,
            False if it should not,
            None if data is missing / uncheckable.
        """
        pass

    @abstractmethod
    def build_message(self, user_id: str, language_pref: str = "en") -> str:
        """
        Build a formatted message for the trigger.
        """
        pass

    def build_metadata(self, user_id: str, language_pref: str = "en") -> Dict[str, Any]:
        """Build full metadata bundle for the nudge."""
        msg = self.build_message(user_id, language_pref=language_pref)
        t_data = get_template_message(self.trigger_id, language_pref=language_pref)
        return {
            "title": t_data.get("title", self.trigger_id.replace("_", " ").title()),
            "message": msg,
            "priority": self.priority,
            "action_url": t_data.get("action_url"),
            "action_label": t_data.get("action_label"),
            "language": language_pref,
        }


class LowBalanceBeforeDebitChecker(TriggerChecker):
    """
    Checks if user has a low balance right before their annual PMSBY insurance debit.
    """
    trigger_id = "low_balance_before_debit"
    source = "budget_agent"
    priority = "urgent"

    def check(self, user_id: str) -> Optional[bool]:
        try:
            row = self._get_user_row(user_id)
            if row is None:
                return None
            val = row.get("nudge_trigger_low_balance_before_debit")
            if pd.isna(val):
                return None
            return bool(val)
        except Exception as e:
            logger.warning("Error in LowBalanceBeforeDebitChecker.check for %s: %s", user_id, e)
            return None

    def build_message(self, user_id: str, language_pref: str = "en") -> str:
        row = self._get_user_row(user_id)
        balance = row.get("closing_balance", 0.0) if row is not None else 0.0
        days = row.get("days_to_next_pmsby_debit", 0.0) if row is not None else 0.0
        try:
            days_int = int(float(days))
        except (ValueError, TypeError):
            days_int = 0
        t_data = get_template_message(self.trigger_id, language_pref=language_pref, days=days_int, balance=f"{balance:,.0f}")
        return t_data["message"]


class LowBalanceChecker(TriggerChecker):
    """
    Checks if user's closing balance has fallen below 30% of their typical weekly earnings.
    """
    trigger_id = "low_balance"
    source = "budget_agent"
    priority = "urgent"

    def check(self, user_id: str) -> Optional[bool]:
        try:
            row = self._get_user_row(user_id)
            if row is None:
                return None
            val = row.get("low_balance_flag")
            if pd.isna(val):
                balance = row.get("closing_balance", 0.0)
                income = row.get("income_wma_4w", 2000.0)
                return bool(balance < (income * 0.3))
            return bool(val)
        except Exception as e:
            logger.warning("Error in LowBalanceChecker.check for %s: %s", user_id, e)
            return None

    def build_message(self, user_id: str, language_pref: str = "en") -> str:
        row = self._get_user_row(user_id)
        balance = row.get("closing_balance", 0.0) if row is not None else 0.0
        t_data = get_template_message(self.trigger_id, language_pref=language_pref, balance=f"{balance:,.0f}")
        return t_data["message"]


class PmsbyDebitDueChecker(TriggerChecker):
    """
    Notifies the user that their annual PMSBY ₹20 insurance auto-debit is due soon.
    """
    trigger_id = "pmsby_debit_due"
    source = "scheme_agent"
    priority = "advisory"

    def check(self, user_id: str) -> Optional[bool]:
        try:
            row = self._get_user_row(user_id)
            if row is None:
                return None
            val = row.get("pmsby_debit_due_soon")
            if pd.isna(val):
                days = row.get("days_to_next_pmsby_debit")
                if days is not None and not pd.isna(days):
                    return bool(0 <= float(days) <= 14)
                return False
            return bool(val)
        except Exception as e:
            logger.warning("Error in PmsbyDebitDueChecker.check for %s: %s", user_id, e)
            return None

    def build_message(self, user_id: str, language_pref: str = "en") -> str:
        t_data = get_template_message(self.trigger_id, language_pref=language_pref)
        return t_data["message"]


class MissedGoalChecker(TriggerChecker):
    """
    Fires when user's weekly savings rate falls below their target goal.
    """
    trigger_id = "missed_goal"
    source = "budget_agent"
    priority = "advisory"

    def check(self, user_id: str) -> Optional[bool]:
        try:
            row = self._get_user_row(user_id)
            if row is None:
                return None
            val = row.get("missed_goal")
            if pd.isna(val):
                savings_rate = row.get("savings_rate", 0.0)
                rec_rate = row.get("savings_rate_recommendation", 0.05)
                return bool(savings_rate < (rec_rate * 0.5))
            return bool(val)
        except Exception as e:
            logger.warning("Error in MissedGoalChecker.check for %s: %s", user_id, e)
            return None

    def build_message(self, user_id: str, language_pref: str = "en") -> str:
        t_data = get_template_message(self.trigger_id, language_pref=language_pref)
        return t_data["message"]


class HighVolatilityStreakChecker(TriggerChecker):
    """
    Advises user when their weekly income coefficient of variation exceeds 30%.
    """
    trigger_id = "high_volatility_streak"
    source = "budget_agent"
    priority = "advisory"

    def check(self, user_id: str) -> Optional[bool]:
        try:
            row = self._get_user_row(user_id)
            if row is None:
                return None
            val = row.get("high_volatility_streak")
            if pd.isna(val):
                volatility = row.get("income_volatility_pct", 0.0)
                # If represented as ratio 0.0-1.0 or percentage 0-100
                if volatility > 1.0:
                    volatility = volatility / 100.0
                return bool(volatility > 0.30)
            return bool(val)
        except Exception as e:
            logger.warning("Error in HighVolatilityStreakChecker.check for %s: %s", user_id, e)
            return None

    def build_message(self, user_id: str, language_pref: str = "en") -> str:
        t_data = get_template_message(self.trigger_id, language_pref=language_pref)
        return t_data["message"]


class HighEmiBurdenChecker(TriggerChecker):
    """
    Warns user when monthly EMI burden exceeds 40% of estimated earnings.
    """
    trigger_id = "high_emi_burden"
    source = "debt_planner"
    priority = "urgent"

    def check(self, user_id: str) -> Optional[bool]:
        try:
            row = self._get_user_row(user_id)
            if row is None:
                return None
            val = row.get("high_emi_burden")
            if pd.isna(val):
                emi_pct = row.get("emi_burden_pct", 0.0)
                if emi_pct > 1.0:
                    emi_pct = emi_pct / 100.0
                return bool(emi_pct > 0.40)
            return bool(val)
        except Exception as e:
            logger.warning("Error in HighEmiBurdenChecker.check for %s: %s", user_id, e)
            return None

    def build_message(self, user_id: str, language_pref: str = "en") -> str:
        t_data = get_template_message(self.trigger_id, language_pref=language_pref)
        return t_data["message"]


class SavingsMilestoneChecker(TriggerChecker):
    """
    Celebrates when user successfully maintains their recommended savings buffer.
    """
    trigger_id = "savings_milestone"
    source = "budget_agent"
    priority = "milestone"

    def check(self, user_id: str) -> Optional[bool]:
        try:
            row = self._get_user_row(user_id)
            if row is None:
                return None
            val = row.get("savings_milestone")
            if pd.isna(val):
                balance = row.get("closing_balance", 0.0)
                income = row.get("income_wma_4w", 2000.0)
                return bool(balance >= (income * 2.0))
            return bool(val)
        except Exception as e:
            logger.warning("Error in SavingsMilestoneChecker.check for %s: %s", user_id, e)
            return None

    def build_message(self, user_id: str, language_pref: str = "en") -> str:
        t_data = get_template_message(self.trigger_id, language_pref=language_pref)
        return t_data["message"]


# Register all 7 checkers in TRIGGER_REGISTRY
TRIGGER_REGISTRY: List[TriggerChecker] = [
    LowBalanceBeforeDebitChecker(),
    LowBalanceChecker(),
    PmsbyDebitDueChecker(),
    MissedGoalChecker(),
    HighVolatilityStreakChecker(),
    HighEmiBurdenChecker(),
    SavingsMilestoneChecker(),
]


def run_all_checks(user_ids: List[str], language_pref: str = "en") -> List[Dict[str, Any]]:
    """
    Run all checkers in registry for user_ids, skipping suppressed user-trigger pairs.
    """
    results = []
    for user_id in user_ids:
        for checker in TRIGGER_REGISTRY:
            # Skip if suppressed
            if is_suppressed(user_id, checker.trigger_id):
                continue

            check_result = checker.check(user_id)
            if check_result is True:
                try:
                    meta = checker.build_metadata(user_id, language_pref=language_pref)
                    results.append({
                        "user_id": user_id,
                        "trigger_id": checker.trigger_id,
                        "source": checker.source,
                        "title": meta["title"],
                        "raw_message": meta["message"],
                        "priority": meta["priority"],
                        "action_url": meta.get("action_url"),
                        "action_label": meta.get("action_label"),
                        "language": language_pref,
                    })
                except Exception as e:
                    logger.warning(
                        "Failed to build metadata for %s / %s: %s", checker.trigger_id, user_id, e
                    )
    return results
