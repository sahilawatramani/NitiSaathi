"""test_disclaimer.py — Deterministic tests for disclaimer injection.

These tests mock the LLM so they run fast and deterministically.
"""

import sys
import os
from unittest.mock import patch

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from agent import rewrite_output, DISCLAIMER_EN


def _mock_llm(system_prompt: str, user_prompt: str, temperature: float = 0.3) -> str:
    """Fake LLM that echoes back the user prompt text between the --- markers."""
    # Extract text between --- markers
    parts = user_prompt.split("---")
    if len(parts) >= 3:
        return parts[1].strip()
    return user_prompt


class TestDisclaimer:
    """Tests that the advisory disclaimer is correctly injected."""

    @patch("agent.generate_chat_completion", side_effect=_mock_llm)
    def test_disclaimer_added_for_financial_content(self, mock_llm):
        result = rewrite_output(
            raw_text="You should save 10% of your income.",
            literacy_level="medium",
            has_financial_content=True,
        )
        assert result["disclaimer_added"] is True
        assert "general guidance only" in result["rewritten_text"].lower()

    @patch("agent.generate_chat_completion", side_effect=_mock_llm)
    def test_disclaimer_added_for_scheme_content(self, mock_llm):
        result = rewrite_output(
            raw_text="You are eligible for PM-SYM.",
            literacy_level="medium",
            has_scheme_content=True,
        )
        assert result["disclaimer_added"] is True
        assert "official website" in result["rewritten_text"].lower()

    @patch("agent.generate_chat_completion", side_effect=_mock_llm)
    def test_disclaimer_added_when_both_flags_true(self, mock_llm):
        result = rewrite_output(
            raw_text="Save 10% and enroll in PM-SYM.",
            literacy_level="low",
            has_financial_content=True,
            has_scheme_content=True,
        )
        assert result["disclaimer_added"] is True

    @patch("agent.generate_chat_completion", side_effect=_mock_llm)
    def test_no_disclaimer_for_general_content(self, mock_llm):
        result = rewrite_output(
            raw_text="Hello! How can I help you today?",
            literacy_level="medium",
            has_financial_content=False,
            has_scheme_content=False,
        )
        assert result["disclaimer_added"] is False
        assert "general guidance" not in result["rewritten_text"].lower()

    @patch("agent.generate_chat_completion", side_effect=_mock_llm)
    def test_disclaimer_exact_text(self, mock_llm):
        result = rewrite_output(
            raw_text="Enroll in e-Shram.",
            literacy_level="medium",
            has_scheme_content=True,
        )
        assert DISCLAIMER_EN.strip() in result["rewritten_text"]

    def test_empty_input_returns_empty(self):
        result = rewrite_output(raw_text="", literacy_level="medium")
        assert result["rewritten_text"] == ""
        assert result["disclaimer_added"] is False

    def test_whitespace_input_returns_whitespace(self):
        result = rewrite_output(raw_text="   ", literacy_level="low")
        assert result["disclaimer_added"] is False
