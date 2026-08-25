# config.py — Literacy Agent standalone configuration
import os
from dotenv import load_dotenv

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ENV_FILE = os.path.join(BASE_DIR, ".env")
load_dotenv(ENV_FILE)

# ── LLM providers (same env vars as budget_agent for consistency) ──────────
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GEMINI_CHAT_MODEL = os.getenv("GEMINI_CHAT_MODEL", "gemini-2.0-flash")
LLM_PROVIDER = os.getenv("LLM_PROVIDER", "gemini").lower()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
OPENAI_CHAT_MODEL = os.getenv("OPENAI_CHAT_MODEL", "gpt-4o-mini")

OLLAMA_API_BASE_URL = os.getenv("OLLAMA_API_BASE_URL", "http://localhost:11434")
OLLAMA_CHAT_MODEL = os.getenv("OLLAMA_CHAT_MODEL", "phi3")

# ── Agent defaults ─────────────────────────────────────────────────────────
DEFAULT_LITERACY_LEVEL = os.getenv("DEFAULT_LITERACY_LEVEL", "medium")
DEFAULT_LANGUAGE = os.getenv("DEFAULT_LANGUAGE", "en")

LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
