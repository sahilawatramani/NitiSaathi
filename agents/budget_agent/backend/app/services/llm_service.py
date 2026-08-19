import json
from typing import Optional

from app.config import (
    GEMINI_API_KEY,
    GEMINI_CHAT_MODEL,
    LLM_PROVIDER,
    OLLAMA_API_BASE_URL,
    OLLAMA_CHAT_MODEL,
    OPENAI_API_KEY,
    OPENAI_CHAT_MODEL,
)

try:
    from openai import OpenAI
except Exception:  # pragma: no cover
    OpenAI = None


_openai_client = OpenAI(api_key=OPENAI_API_KEY) if (OpenAI and OPENAI_API_KEY) else None
_ollama_client = OpenAI(api_key="ollama", base_url=OLLAMA_API_BASE_URL) if OpenAI else None


def _extract_json_object(raw: str) -> Optional[dict]:
    raw = raw.strip()
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        pass

    start = raw.find("{")
    end = raw.rfind("}")
    if start != -1 and end != -1 and end > start:
        try:
            return json.loads(raw[start : end + 1])
        except json.JSONDecodeError:
            return None
    return None


def generate_chat_completion(system_prompt: str, user_prompt: str, temperature: float = 0.2) -> str:
    provider = LLM_PROVIDER

    if provider == "gemini" and GEMINI_API_KEY:
        try:
            import google.generativeai as genai

            genai.configure(api_key=GEMINI_API_KEY)
            model = genai.GenerativeModel(GEMINI_CHAT_MODEL)
            response = model.generate_content(
                [
                    {"role": "user", "parts": [f"System: {system_prompt}"]},
                    {"role": "user", "parts": [user_prompt]},
                ],
                generation_config={"temperature": temperature},
            )
            return (response.text or "").strip()
        except Exception as exc:
            return f"LLM provider error (gemini): {exc}"

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
            return (response.choices[0].message.content or "").strip()
        except Exception as exc:
            return f"LLM provider error (ollama): {exc}"

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
            return (response.choices[0].message.content or "").strip()
        except Exception as exc:
            return f"LLM provider error (openai): {exc}"

    return ""


def generate_json_completion(system_prompt: str, user_prompt: str, temperature: float = 0.0) -> Optional[dict]:
    text = generate_chat_completion(system_prompt=system_prompt, user_prompt=user_prompt, temperature=temperature)
    if not text:
        return None
    return _extract_json_object(text)
