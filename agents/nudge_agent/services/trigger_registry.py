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


def _load_features_dataframe() -> Optional[pd.DataFrame]:
    """Helper to lazily load features.csv across checkers."""
    try:
        current_dir = os.path.dirname(os.path.abspath(__file__))
        csv_path = os.path.normpath(
            os.path.join(current_dir, "..", "..", "..", "data_pipeline", "data", "features.csv")
        )
        if not os.path.exists(csv_path):
            return None
        return pd.read_csv(csv_path)
    except Exception as e:
        logger.warning(f"Error loading features.csv: {e}")
        return None


def _get_latest_user_feature_row(user_id: str, df: Optional[pd.DataFrame] = None) -> Optional[pd.Series]:
    """Helper to retrieve the latest week_start row for a given user."""
    if df is None:
        df = _load_features_dataframe()
    if df is None or df.empty:
        return None

    user_rows = df[df["user_id"].astype(str) == str(user_id)]
    if user_rows.empty:
        return None

    if "week_start" in user_rows.columns and not user_rows["week_start"].dropna().empty:
        latest_idx = user_rows["week_start"].idxmax()
        return user_rows.loc[latest_idx]
    return user_rows.iloc[-1]


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
