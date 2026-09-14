"""llm_service.py — Literacy Agent's own LLM service.

Mirrors the budget_agent fallback chain (Gemini → OpenAI → Ollama) but is
completely self-contained so the two agents have zero import dependencies on
each other.
"""

import json
import logging
from typing import Optional

try:
    from config import (
        GEMINI_API_KEY,
        GEMINI_CHAT_MODEL,
        LLM_PROVIDER,
        OLLAMA_API_BASE_URL,
        OLLAMA_CHAT_MODEL,
        OPENAI_API_KEY,
        OPENAI_CHAT_MODEL,
    )
except ImportError:
    from .config import (
        GEMINI_API_KEY,
        GEMINI_CHAT_MODEL,
        LLM_PROVIDER,
        OLLAMA_API_BASE_URL,
        OLLAMA_CHAT_MODEL,
        OPENAI_API_KEY,
        OPENAI_CHAT_MODEL,
    )

logger = logging.getLogger("literacy_agent.llm")

# ── Lazy client singletons ────────────────────────────────────────────────

try:
    from openai import OpenAI
except ImportError:
    OpenAI = None  # type: ignore[assignment,misc]

_openai_client = (
    OpenAI(api_key=OPENAI_API_KEY) if (OpenAI and OPENAI_API_KEY and not OPENAI_API_KEY.startswith("your_")) else None
)

_ollama_base = OLLAMA_API_BASE_URL.rstrip("/")
if not _ollama_base.endswith("/v1"):
    _ollama_base += "/v1"
_ollama_client = OpenAI(api_key="ollama", base_url=_ollama_base, timeout=2.0) if OpenAI else None


# ── Public helpers ─────────────────────────────────────────────────────────

def generate_chat_completion(
    system_prompt: str,
    user_prompt: str,
    temperature: float = 0.3,
) -> str:
    """Try the preferred provider first, then cascade through the others."""

    providers_to_try = [LLM_PROVIDER]
    for p in ("gemini", "openai", "ollama"):
        if p not in providers_to_try:
            providers_to_try.append(p)

    for provider in providers_to_try:
        # ── Gemini ──
        if provider == "gemini" and GEMINI_API_KEY and not GEMINI_API_KEY.startswith("your_"):
            try:
                from google import genai
                from google.genai import types as genai_types
                client = genai.Client(
                    api_key=GEMINI_API_KEY,
                    http_options={"timeout": 10},
                )
                response = client.models.generate_content(
                    model=GEMINI_CHAT_MODEL,
                    contents=[
                        genai_types.Content(
                            role="user",
                            parts=[
                                genai_types.Part(text=f"System instructions: {system_prompt}\n\nUser: {user_prompt}"),
                            ],
                        )
                    ],
                    config=genai_types.GenerateContentConfig(temperature=temperature),
                )
                text = (response.text or "").strip()
                if text:
                    return text
            except Exception as exc:
                logger.warning("Gemini call failed: %s", exc)

        # ── OpenAI ──
        if provider == "openai" and _openai_client:
            try:
                response = _openai_client.chat.completions.create(
                    model=OPENAI_CHAT_MODEL,
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt},
                    ],
                    temperature=temperature,
                )
                text = (response.choices[0].message.content or "").strip()
                if text:
                    return text
            except Exception as exc:
                logger.warning("OpenAI call failed: %s", exc)

        # ── Ollama ──
        if provider == "ollama" and _ollama_client:
            try:
                response = _ollama_client.chat.completions.create(
                    model=OLLAMA_CHAT_MODEL,
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt},
                    ],
                    temperature=temperature,
                )
                text = (response.choices[0].message.content or "").strip()
                if text:
                    return text
            except Exception as exc:
                logger.warning("Ollama call failed: %s", exc)

    logger.error("All LLM providers failed — returning empty string.")
    return ""
