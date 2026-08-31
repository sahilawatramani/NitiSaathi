"""
Tests for user feedback suppression rules.
"""
import pytest
from ..services.suppression_service import (
    record_feedback,
    is_suppressed,
    clear_suppression_history
)

@pytest.fixture(autouse=True)
def clean_history():
    """Ensure in-memory store is cleared before and after each test."""
    clear_suppression_history()
    yield
    clear_suppression_history()


def test_default_state():
    """By default, a trigger should not be suppressed."""
    assert is_suppressed("user_001", "low_balance") is False


def test_useful_feedback_no_suppression():
    """Giving 'useful' feedback should not trigger suppression."""
    record_feedback("user_001", "low_balance", "useful")
    record_feedback("user_001", "low_balance", "useful")
    assert is_suppressed("user_001", "low_balance") is False


def test_harmful_feedback_immediate_suppression():
    """A single 'harmful' rating should suppress the trigger immediately."""
    record_feedback("user_001", "low_balance", "harmful")
    assert is_suppressed("user_001", "low_balance") is True


def test_three_consecutive_not_useful_suppresses():
    """Three consecutive 'not_useful' ratings should suppress the trigger."""
    record_feedback("user_001", "low_balance", "not_useful")
    assert is_suppressed("user_001", "low_balance") is False

    record_feedback("user_001", "low_balance", "not_useful")
    assert is_suppressed("user_001", "low_balance") is False

    record_feedback("user_001", "low_balance", "not_useful")
    assert is_suppressed("user_001", "low_balance") is True


def test_broken_consecutive_streak():
    """A streak of 'not_useful' broken by 'useful' should not suppress."""
    record_feedback("user_001", "low_balance", "not_useful")
    record_feedback("user_001", "low_balance", "not_useful")
    
    # Break streak
    record_feedback("user_001", "low_balance", "useful")
    
    record_feedback("user_001", "low_balance", "not_useful")
    # Only 1 consecutive not_useful after useful, so it should not be suppressed
    assert is_suppressed("user_001", "low_balance") is False
