"""
Tests for the Nudge Agent trigger registry and LowBalanceBeforeDebitChecker.
Uses a temporary synthetic CSV file as a fixture.
"""
import pytest
import pandas as pd
from unittest.mock import MagicMock

from ..services.trigger_registry import (
    LowBalanceBeforeDebitChecker,
    run_all_checks,
    TRIGGER_REGISTRY
)
from ..services.suppression_service import clear_suppression_history, record_feedback

@pytest.fixture(autouse=True)
def clean_suppressions():
    clear_suppression_history()
    yield
    clear_suppression_history()


@pytest.fixture
def temp_csv_data(tmp_path):
    """Create a temporary features.csv with 2 users for testing."""
    temp_dir = tmp_path / "data_pipeline" / "data"
    temp_dir.mkdir(parents=True, exist_ok=True)
    csv_file = temp_dir / "features.csv"

    # Synthetic data: user_trigger should fire, user_no_trigger should not.
    df = pd.DataFrame([
        {
            "user_id": "user_trigger",
            "week_start": "2026-06-08",
            "closing_balance": 150.50,
            "days_to_next_pmsby_debit": 5.0,
            "nudge_trigger_low_balance_before_debit": True,
            "literacy_level": "low"
        },
        {
            "user_id": "user_no_trigger",
            "week_start": "2026-06-08",
            "closing_balance": 2500.00,
            "days_to_next_pmsby_debit": 12.0,
            "nudge_trigger_low_balance_before_debit": False,
            "literacy_level": "high"
        }
    ])
    df.to_csv(csv_file, index=False)
    return csv_file


def test_low_balance_before_debit_checker(temp_csv_data):
    """Test check() and build_message() methods of the checker class."""
    checker = LowBalanceBeforeDebitChecker()
    
    # Mock _load_data to read our temporary CSV
    checker._load_data = MagicMock(return_value=pd.read_csv(temp_csv_data))

    # Test trigger evaluations
    assert checker.check("user_trigger") is True
    assert checker.check("user_no_trigger") is False
    assert checker.check("unknown_user") is None

    # Test message generation
    msg = checker.build_message("user_trigger")
    assert "₹150.50" in msg
    assert "5 days" in msg


def test_run_all_checks_orchestration(temp_csv_data):
    """Test run_all_checks orchestration logic across all registered checkers."""
    checker = TRIGGER_REGISTRY[0]
    
    # Save original functions/state to restore later
    original_load = checker._load_data
    original_df = checker._df
    
    # Apply temporary mock data
    mock_df = pd.read_csv(temp_csv_data)
    checker._df = mock_df
    checker._load_data = MagicMock(return_value=mock_df)

    try:
        # 1. Run all checks
        results = run_all_checks(["user_trigger", "user_no_trigger", "unknown_user"])
        
        # Should only have 1 active nudge triggered
        assert len(results) == 1
        assert results[0]["user_id"] == "user_trigger"
        assert results[0]["trigger_id"] == "low_balance_before_debit"
        assert "₹150.50" in results[0]["raw_message"]

        # 2. Test suppression integration: Suppress user_trigger and run again
        record_feedback("user_trigger", "low_balance_before_debit", "harmful")
        results_after_suppression = run_all_checks(["user_trigger", "user_no_trigger"])
        
        # Should be empty since the only triggering nudge is now suppressed
        assert len(results_after_suppression) == 0

    finally:
        # Restore original state
        checker._load_data = original_load
        checker._df = original_df
