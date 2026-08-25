"""test_agent.py — Tests for the full rewrite pipeline.

Uses a mock LLM so tests are deterministic and fast.
"""

import sys
import os
from unittest.mock import patch

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from agent import rewrite_output


def _mock_llm(system_prompt: str, user_prompt: str, temperature: float = 0.3) -> str:
    """Mock LLM that returns the input text with '[REWRITTEN]' prefix.

    This lets us verify the pipeline ran without needing a real LLM.
    """
    parts = user_prompt.split("---")
    if len(parts) >= 3:
        return f"[REWRITTEN] {parts[1].strip()}"
    return f"[REWRITTEN] {user_prompt}"


class TestRewritePipeline:
    """Tests the full jargon→LLM→disclaimer pipeline."""

    @patch("agent.generate_chat_completion", side_effect=_mock_llm)
    def test_jargon_cleaned_before_llm(self, mock_llm):
        """Internal variable names are replaced BEFORE the LLM sees them."""
        result = rewrite_output(
            raw_text="Your income_wma_4w is ₹2,800 with coefficient of variation 0.31.",
            literacy_level="low",
        )
        # Jargon should be gone from the final output
        assert "income_wma_4w" not in result["rewritten_text"]
        assert "coefficient of variation" not in result["rewritten_text"]
        # Amount preserved
        assert "₹2,800" in result["rewritten_text"]
        # LLM was called (our mock prepends [REWRITTEN])
        assert "[REWRITTEN]" in result["rewritten_text"]

    @patch("agent.generate_chat_completion", side_effect=_mock_llm)
    def test_all_literacy_levels_produce_output(self, mock_llm):
        for level in ("low", "medium", "high"):
            result = rewrite_output(
                raw_text="Your savings rate is 10%.",
                literacy_level=level,
            )
            assert len(result["rewritten_text"]) > 0
            assert result["literacy_level"] == level

    @patch("agent.generate_chat_completion", side_effect=_mock_llm)
    def test_original_text_preserved(self, mock_llm):
        original = "income_wma_4w is ₹5,000"
        result = rewrite_output(raw_text=original, literacy_level="medium")
        assert result["original_text"] == original

    @patch("agent.generate_chat_completion", return_value="")
    def test_llm_failure_falls_back_to_jargon_cleaned(self, mock_llm):
        """When LLM returns empty, we still get jargon-cleaned text."""
        result = rewrite_output(
            raw_text="Your income_wma_4w is ₹2,800.",
            literacy_level="low",
        )
        # Jargon cleaned even without LLM
        assert "income_wma_4w" not in result["rewritten_text"]
        assert "estimated weekly income" in result["rewritten_text"]
        # No [REWRITTEN] prefix since LLM failed
        assert "[REWRITTEN]" not in result["rewritten_text"]

    @patch("agent.generate_chat_completion", side_effect=_mock_llm)
    def test_unknown_literacy_level_defaults_to_medium(self, mock_llm):
        result = rewrite_output(
            raw_text="Test text.",
            literacy_level="unknown_level",
        )
        # Should not crash; prompts.py falls back to medium
        assert len(result["rewritten_text"]) > 0

    @patch("agent.generate_chat_completion", side_effect=_mock_llm)
    def test_combined_financial_and_scheme(self, mock_llm):
        """Full pipeline test matching MASTER_PROJECT_GUIDE §19.4."""
        result = rewrite_output(
            raw_text=(
                "Your income_wma_4w is ₹2,800 with coefficient of variation 0.31. "
                "You are eligible for PM-SYM. Monthly contribution ₹55."
            ),
            literacy_level="low",
            has_financial_content=True,
            has_scheme_content=True,
        )
        # Jargon removed
        assert "income_wma_4w" not in result["rewritten_text"]
        assert "coefficient of variation" not in result["rewritten_text"]
        # Amounts preserved
        assert "₹2,800" in result["rewritten_text"]
        assert "₹55" in result["rewritten_text"]
        # Disclaimer present
        assert result["disclaimer_added"] is True
        assert "general guidance only" in result["rewritten_text"].lower()
