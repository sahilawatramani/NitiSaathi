"""test_jargon.py — Deterministic tests for jargon replacement.

These tests run WITHOUT any LLM calls — pure string manipulation.
"""

import sys
import os

# Allow imports from the literacy_agent package
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from jargon import replace_jargon, get_jargon_map


class TestJargonReplacement:
    """Tests that internal variable names and financial jargon are replaced."""

    def test_internal_variable_income_wma(self):
        text = "Your income_wma_4w is ₹2,800."
        result = replace_jargon(text)
        assert "income_wma_4w" not in result
        assert "estimated weekly income" in result
        assert "₹2,800" in result  # amount preserved

    def test_internal_variable_low_balance_flag(self):
        text = "low_balance_flag has been triggered."
        result = replace_jargon(text)
        assert "low_balance_flag" not in result
        assert "low balance warning" in result

    def test_coefficient_of_variation_removed(self):
        text = "The coefficient of variation is 0.31."
        result = replace_jargon(text)
        assert "coefficient of variation" not in result.lower()
        assert "income fluctuation" in result

    def test_platform_payout_replaced(self):
        text = "You received a platform payout of ₹840."
        result = replace_jargon(text)
        assert "platform payout" not in result.lower()
        assert "earnings from your delivery/ride app" in result

    def test_emi_replaced(self):
        text = "Your next EMI is due in 3 days."
        result = replace_jargon(text)
        assert "monthly loan payment" in result

    def test_multiple_terms_in_one_text(self):
        text = (
            "Your income_wma_4w is ₹2,800 with income_volatility_pct of 0.31. "
            "The low_balance_flag is active and your next EMI is ₹3,200."
        )
        result = replace_jargon(text)
        assert "income_wma_4w" not in result
        assert "income_volatility_pct" not in result
        assert "low_balance_flag" not in result
        assert "₹2,800" in result
        assert "₹3,200" in result

    def test_case_insensitive(self):
        text = "Your PLATFORM PAYOUT was ₹500."
        result = replace_jargon(text)
        assert "platform payout" not in result.lower()

    def test_idempotent(self):
        text = "Your income_wma_4w is ₹2,800."
        first_pass = replace_jargon(text)
        second_pass = replace_jargon(first_pass)
        assert first_pass == second_pass

    def test_empty_string(self):
        assert replace_jargon("") == ""

    def test_no_jargon_text_unchanged(self):
        text = "You earned ₹5,000 this week. Great job!"
        assert replace_jargon(text) == text

    def test_jargon_map_is_dict(self):
        m = get_jargon_map()
        assert isinstance(m, dict)
        assert len(m) > 10  # sanity check — we have many entries
