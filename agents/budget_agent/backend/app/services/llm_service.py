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

_ollama_base = OLLAMA_API_BASE_URL.rstrip("/")
if not _ollama_base.endswith("/v1"):
    _ollama_base += "/v1"
_ollama_client = OpenAI(api_key="ollama", base_url=_ollama_base, timeout=180.0) if OpenAI else None


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
    providers_to_try = [LLM_PROVIDER]
    for p in ["gemini", "openai", "ollama"]:
        if p not in providers_to_try:
            providers_to_try.append(p)

    for provider in providers_to_try:
        if provider == "gemini" and GEMINI_API_KEY:
            try:
                from google import genai
                from google.genai import types as genai_types
                import httpx as _httpx
                client = genai.Client(
                    api_key=GEMINI_API_KEY,
                    http_options={"timeout": 60},
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
                res_text = (response.text or "").strip()
                if res_text:
                    return res_text
            except Exception:
                pass

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
                res_text = (response.choices[0].message.content or "").strip()
                if res_text:
                    return res_text
            except Exception:
                pass

        if provider == "ollama" and _ollama_client:
            try:
                response = _ollama_client.chat.completions.create(
                    model=OLLAMA_CHAT_MODEL,
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt},
                    ],
                    temperature=temperature,
                    max_tokens=220,
                )
                res_text = (response.choices[0].message.content or "").strip()
                if res_text:
                    return res_text
            except Exception:
                pass

    return ""


def generate_json_completion(system_prompt: str, user_prompt: str, temperature: float = 0.0) -> Optional[dict]:
    text = generate_chat_completion(system_prompt=system_prompt, user_prompt=user_prompt, temperature=temperature)
    if not text:
        return None
    return _extract_json_object(text)
