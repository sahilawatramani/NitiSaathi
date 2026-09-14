"""
Tests for the Nudge Agent trigger registry, concrete checkers, and multilingual message formatting.
"""
import pytest
import pandas as pd
from unittest.mock import MagicMock

from ..services.trigger_registry import (
    LowBalanceBeforeDebitChecker,
    LowBalanceChecker,
    PmsbyDebitDueChecker,
    MissedGoalChecker,
    HighVolatilityStreakChecker,
    HighEmiBurdenChecker,
    SavingsMilestoneChecker,
    run_all_checks,
    TRIGGER_REGISTRY
)
from ..services.suppression_service import clear_suppression_history, record_feedback
from ..services.message_service import get_template_message


@pytest.fixture(autouse=True)
def clean_suppressions():
    clear_suppression_history()
    yield
    clear_suppression_history()


@pytest.fixture
def temp_csv_data(tmp_path):
    """Create a temporary features.csv with various trigger conditions."""
    temp_dir = tmp_path / "data_pipeline" / "data"
    temp_dir.mkdir(parents=True, exist_ok=True)
    csv_file = temp_dir / "features.csv"

    df = pd.DataFrame([
        {
            "user_id": "user_trigger",
            "week_start": "2026-06-08",
            "closing_balance": 150.50,
            "days_to_next_pmsby_debit": 5.0,
            "nudge_trigger_low_balance_before_debit": True,
            "low_balance_flag": True,
            "missed_goal": True,
            "high_volatility_streak": True,
            "high_emi_burden": True,
            "savings_milestone": False,
            "literacy_level": "low"
        },
        {
            "user_id": "user_milestone",
            "week_start": "2026-06-08",
            "closing_balance": 12000.00,
            "income_wma_4w": 4000.00,
            "days_to_next_pmsby_debit": 45.0,
            "nudge_trigger_low_balance_before_debit": False,
            "low_balance_flag": False,
            "missed_goal": False,
            "high_volatility_streak": False,
            "high_emi_burden": False,
            "savings_milestone": True,
            "literacy_level": "high"
        }
    ])
    df.to_csv(csv_file, index=False)
    return csv_file


def test_registered_checkers_count():
    """Verify that all 7 required trigger checkers are registered in TRIGGER_REGISTRY."""
    assert len(TRIGGER_REGISTRY) >= 7
    registered_ids = [c.trigger_id for c in TRIGGER_REGISTRY]
    assert "low_balance_before_debit" in registered_ids
    assert "low_balance" in registered_ids
    assert "pmsby_debit_due" in registered_ids
    assert "missed_goal" in registered_ids
    assert "high_volatility_streak" in registered_ids
    assert "high_emi_burden" in registered_ids
    assert "savings_milestone" in registered_ids


def test_multilingual_template_generation():
    """Verify that get_template_message returns proper translations for en, hi, mr."""
    # 1. English
    en_msg = get_template_message("low_balance_before_debit", language_pref="en", days=5, balance="150")
    assert "PMSBY" in en_msg["title"]
    assert "₹150" in en_msg["message"]
    assert "5 days" in en_msg["message"]

    # 2. Hindi
    hi_msg = get_template_message("low_balance_before_debit", language_pref="hi", days=5, balance="150")
    assert "ऑटो-डेबिट" in hi_msg["title"] or "बीमा" in hi_msg["message"]
    assert "₹150" in hi_msg["message"]

    # 3. Marathi
    mr_msg = get_template_message("low_balance_before_debit", language_pref="mr", days=5, balance="150")
    assert "ऑटो-डेबिट" in mr_msg["title"] or "विमा" in mr_msg["message"]
    assert "₹150" in mr_msg["message"]


def test_concrete_checkers_evaluation(temp_csv_data):
    """Test individual checker evaluation logic."""
    df = pd.read_csv(temp_csv_data)

    # 1. LowBalanceBeforeDebitChecker
    pmsby_checker = LowBalanceBeforeDebitChecker()
    pmsby_checker._load_data = MagicMock(return_value=df)
    assert pmsby_checker.check("user_trigger") is True
    assert pmsby_checker.check("user_milestone") is False

    # 2. SavingsMilestoneChecker
    milestone_checker = SavingsMilestoneChecker()
    milestone_checker._load_data = MagicMock(return_value=df)
    assert milestone_checker.check("user_milestone") is True
    assert milestone_checker.check("user_trigger") is False


def test_run_all_checks_and_suppression(temp_csv_data):
    """Test run_all_checks and feedback suppression behavior."""
    df = pd.read_csv(temp_csv_data)

    # Mock _load_data across checkers
    for c in TRIGGER_REGISTRY:
        if hasattr(c, "_load_data"):
            c._load_data = MagicMock(return_value=df)

    # 1. Run all checks
    results = run_all_checks(["user_trigger", "user_milestone"])
    assert len(results) >= 2
    trigger_ids = [r["trigger_id"] for r in results]
    assert "low_balance_before_debit" in trigger_ids
    assert "savings_milestone" in trigger_ids

    # 2. Suppress low_balance_before_debit for user_trigger
    record_feedback("user_trigger", "low_balance_before_debit", "harmful")
    results_after = run_all_checks(["user_trigger", "user_milestone"])
    trigger_ids_after = [r["trigger_id"] for r in results_after if r["user_id"] == "user_trigger"]
    assert "low_balance_before_debit" not in trigger_ids_after
