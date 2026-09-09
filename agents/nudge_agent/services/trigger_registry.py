"""
Trigger registry and checkers.
Defines abstract TriggerChecker and concrete LowBalanceBeforeDebitChecker.
"""
import os
import logging
from abc import ABC, abstractmethod
import pandas as pd
from typing import List, Dict, Optional, Any

from .suppression_service import is_suppressed

logger = logging.getLogger(__name__)

class TriggerChecker(ABC):
    """Abstract base class for all trigger checkers"""
    
    @property
    @abstractmethod
    def trigger_id(self) -> str:
        pass
        
    @property
    @abstractmethod
    def source(self) -> str:
        pass
        
    @abstractmethod
    def check(self, user_id: str) -> Optional[bool]:
        """
        Check if the trigger should fire for the given user.
        Returns:
            True if it should fire,
            False if it should not,
            None if data is missing or check cannot be performed (treated as skip silently).
        """
        pass
        
    @abstractmethod
    def build_message(self, user_id: str) -> str:
        """
        Build raw, plain-English message for the trigger.
        """
        pass


class LowBalanceBeforeDebitChecker(TriggerChecker):
    """
    Concrete checker for low balance before annual PMSBY insurance debit.
    """
    trigger_id = "low_balance_before_debit"
    source = "budget_agent"
    
    def __init__(self) -> None:
        self._df: Optional[pd.DataFrame] = None
        
    def _load_data(self) -> Optional[pd.DataFrame]:
        """Load features.csv lazily and cache it."""
        if self._df is None:
            try:
                # Find path relative to this file
                current_dir = os.path.dirname(os.path.abspath(__file__))
                # Navigate to data_pipeline/data/features.csv
                csv_path = os.path.normpath(
                    os.path.join(current_dir, "..", "..", "..", "data_pipeline", "data", "features.csv")
                )
                if not os.path.exists(csv_path):
                    logger.warning(f"features.csv not found at resolved path: {csv_path}")
                    return None
                self._df = pd.read_csv(csv_path)
            except Exception as e:
                logger.warning(f"Error loading features.csv: {e}")
                return None
        return self._df
        
    def _get_latest_user_row(self, user_id: str) -> Optional[pd.Series]:
        """Helper to get latest week_start row for a user."""
        df = self._load_data()
        if df is None or df.empty:
            return None
            
        user_rows = df[df["user_id"] == user_id]
        if user_rows.empty:
            return None
            
        # Find row with max week_start (most recent date)
        latest_idx = user_rows["week_start"].idxmax()
        return user_rows.loc[latest_idx]

    def check(self, user_id: str) -> Optional[bool]:
        """
        Checks value of nudge_trigger_low_balance_before_debit in features.csv.
        """
        try:
            row = self._get_latest_user_row(user_id)
            if row is None:
                return None
                
            val = row.get("nudge_trigger_low_balance_before_debit")
            if pd.isna(val):
                return None
            return bool(val)
        except Exception as e:
            logger.warning(f"Error in LowBalanceBeforeDebitChecker.check for {user_id}: {e}")
            return None

    def build_message(self, user_id: str) -> str:
        """
        Construct raw message using closing_balance and days_to_next_pmsby_debit.
        """
        row = self._get_latest_user_row(user_id)
        if row is None:
            raise ValueError(f"No data available to build message for user {user_id}")
            
        balance = row.get("closing_balance", 0.0)
        days = row.get("days_to_next_pmsby_debit", 0.0)
        
        # Format days as integer
        try:
            days_int = int(float(days))
        except (ValueError, TypeError):
            days_int = 0
            
        return f"Your balance is low (₹{balance:,.2f}) and your insurance payment is due in {days_int} days."


# List containing instances of all checkers.
# To register a new checker, simply append it to this list.
TRIGGER_REGISTRY: List[TriggerChecker] = [
    LowBalanceBeforeDebitChecker()
]

def run_all_checks(user_ids: List[str]) -> List[Dict[str, Any]]:
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
                    raw_msg = checker.build_message(user_id)
                    results.append({
                        "user_id": user_id,
                        "trigger_id": checker.trigger_id,
                        "source": checker.source,
                        "raw_message": raw_msg
                    })
                except Exception as e:
                    logger.warning(
                        f"Failed to build message for {checker.trigger_id} / {user_id}: {e}"
                    )
    return results
