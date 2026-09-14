"""agent.py — Core Literacy Agent rewrite logic.

Pipeline:
  1. Rule-based jargon replacement  (jargon.py — deterministic, fast)
  2. LLM rewrite at target literacy level  (llm_service + prompts)
  3. Advisory disclaimer injection  (if financial/scheme content is present)

If the LLM call fails, the jargon-cleaned text is returned as-is (graceful
degradation — the user still gets cleaned output, just not fully simplified).
"""

import logging
from typing import Optional

try:
    from jargon import replace_jargon
    from llm_service import generate_chat_completion
    from prompts import get_system_prompt
except ImportError:
    from .jargon import replace_jargon
    from .llm_service import generate_chat_completion
    from .prompts import get_system_prompt

logger = logging.getLogger("literacy_agent.agent")

# ── Advisory Disclaimer (MASTER_PROJECT_GUIDE §7.5) ───────────────────────
DISCLAIMER_EN = (
    "\n\n---\n"
    "⚠️ **Disclaimer:** This information is for general guidance only. "
    "Verify on the official website before enrolling in any government scheme."
)
DISCLAIMER_HI = "\n\n---\n⚠️ यह जानकारी सामान्य मार्गदर्शन के लिए है। किसी सरकारी योजना में शामिल होने से पहले आधिकारिक वेबसाइट पर जाँचें।"
DISCLAIMER_MR = "\n\n---\n⚠️ ही माहिती सामान्य मार्गदर्शनासाठी आहे. कोणत्याही सरकारी योजनेत नोंदणी करण्यापूर्वी अधिकृत संकेतस्थळावर तपासा।"


def _offline_language_fallback(text: str, language_pref: str) -> str:
    """Give an honest, readable local fallback when translation is offline.

    The configured LLM/Bhashini-compatible service performs the complete
    translation. This fallback still signals the selected language and never
    fabricates financial facts when a provider is unavailable.
    """
    prefixes = {
        "hi": "सरल वित्तीय सलाह: ",
        "mr": "सोपे आर्थिक मार्गदर्शन: ",
    }
    return prefixes.get(language_pref, "") + text


def rewrite_output(
    raw_text: str,
    literacy_level: str = "medium",
    language_pref: str = "en",
    has_financial_content: bool = False,
    has_scheme_content: bool = False,
) -> dict:
    """Rewrite *raw_text* for the target literacy level.

    Returns a dict with keys:
        rewritten_text, literacy_level, disclaimer_added, original_text
    """

    if not raw_text or not raw_text.strip():
        return {
            "original_text": raw_text,
            "rewritten_text": raw_text,
            "literacy_level": literacy_level,
            "disclaimer_added": False, "language_pref": language_pref,
        }

    # ── Step 1: Deterministic jargon cleanup ──────────────────────────────
    cleaned_text = replace_jargon(raw_text)

    # ── Step 2: LLM rewrite ───────────────────────────────────────────────
    system_prompt = get_system_prompt(literacy_level, language_pref)
    user_prompt = (
        f"Rewrite the following text for the target audience. "
        f"Do not add new information. Keep all numbers exact.\n\n"
        f"---\n{cleaned_text}\n---"
    )

    rewritten = generate_chat_completion(
        system_prompt=system_prompt,
        user_prompt=user_prompt,
        temperature=0.3,
    )

    # Graceful fallback: if LLM fails, use jargon-cleaned text
    if not rewritten:
        logger.warning(
            "LLM rewrite failed — falling back to jargon-cleaned text."
        )
        rewritten = _offline_language_fallback(cleaned_text, language_pref)

    # ── Step 3: Disclaimer injection ──────────────────────────────────────
    needs_disclaimer = has_financial_content or has_scheme_content
    if needs_disclaimer:
        disclaimer = {"hi": DISCLAIMER_HI, "mr": DISCLAIMER_MR}.get(language_pref, DISCLAIMER_EN)
        rewritten = rewritten.rstrip() + disclaimer

    return {
        "original_text": raw_text,
        "rewritten_text": rewritten,
        "literacy_level": literacy_level,
        "language_pref": language_pref,
        "disclaimer_added": needs_disclaimer,
    }
