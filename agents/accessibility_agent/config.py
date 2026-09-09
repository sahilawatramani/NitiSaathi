"""
Configuration settings for the Accessibility Agent.
"""
import os
from pathlib import Path
from typing import Optional
from dotenv import load_dotenv

# Load environment variables from .env files
current_dir = Path(__file__).resolve().parent
env_paths = [
    current_dir / ".env",
    current_dir.parent / "literacy_agent" / ".env",
    current_dir.parent / "budget_agent" / "backend" / ".env",
    current_dir.parent.parent / ".env",
]

for env_path in env_paths:
    if env_path.exists():
        load_dotenv(dotenv_path=env_path)

class Settings:
    """Agent Configuration Settings"""
    PROJECT_NAME: str = "NitiSaathi Accessibility Agent"
    VERSION: str = "1.0.0"
    API_PREFIX: str = "/api/v1/accessibility"
    PORT: int = int(os.getenv("ACCESSIBILITY_AGENT_PORT", "8005"))

    # Google Translation API Key
    GOOGLE_TRANSLATE_API_KEY: Optional[str] = (
        os.getenv("GOOGLE_TRANSLATE_API_KEY") 
        or os.getenv("GOOGLE_API_KEY") 
        or os.getenv("GEMINI_API_KEY")
    )
    
    # Translation Defaults
    DEFAULT_SOURCE_LANG: str = "en"
    DEFAULT_TARGET_LANG: str = "hi"
    
    # Cache settings
    ENABLE_TRANSLATION_CACHE: bool = True
    CACHE_MAX_SIZE: int = 1024
    
    # Supported Languages Mapping
    SUPPORTED_LANGUAGES: dict = {
        "en": "English",
        "hi": "Hindi",
        "mr": "Marathi",
        "bn": "Bengali",
        "ta": "Tamil",
        "te": "Telugu",
        "kn": "Kannada",
        "gu": "Gujarati",
        "pa": "Punjabi",
        "ml": "Malayalam",
        "or": "Odia",
        "as": "Assamese",
        "ur": "Urdu"
    }

settings = Settings()
