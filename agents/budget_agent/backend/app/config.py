# config.py
import os
from dotenv import load_dotenv

# Always load backend/.env regardless of current working directory.
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ENV_FILE = os.path.join(BASE_DIR, ".env")
load_dotenv(ENV_FILE)

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
LLM_PROVIDER = os.getenv("LLM_PROVIDER", "openai").lower()
OPENAI_CHAT_MODEL = os.getenv("OPENAI_CHAT_MODEL", "gpt-3.5-turbo")
GEMINI_CHAT_MODEL = os.getenv("GEMINI_CHAT_MODEL", "gemini-1.5-flash")
OLLAMA_API_BASE_URL = os.getenv("OLLAMA_API_BASE_URL", "http://localhost:11434")
OLLAMA_CHAT_MODEL = os.getenv("OLLAMA_CHAT_MODEL", "mistral")
WEBHOOK_SECRET = os.getenv("WEBHOOK_SECRET", "finassist-dev-secret")
SMS_FORWARD_SECRET = os.getenv("SMS_FORWARD_SECRET", "")
SMS_FORWARD_DEFAULT_USER_EMAIL = os.getenv("SMS_FORWARD_DEFAULT_USER_EMAIL", "")
REPORT_LOOKBACK_DAYS = int(os.getenv("REPORT_LOOKBACK_DAYS", "30"))

JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "change-me-in-production")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "10080"))
AUTO_CREATE_TABLES = os.getenv("AUTO_CREATE_TABLES", "true").lower() == "true"
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
RATE_LIMIT_BACKEND = os.getenv("RATE_LIMIT_BACKEND", "memory").lower()
REDIS_URL = os.getenv("REDIS_URL", "")
AUTO_CLASSIFICATION_ENABLED = os.getenv("AUTO_CLASSIFICATION_ENABLED", "true").lower() == "true"
LANGGRAPH_CHECKPOINT_PATH = os.getenv(
	"LANGGRAPH_CHECKPOINT_PATH",
	os.path.join(BASE_DIR, "data", "langgraph_checkpoints.sqlite"),
)

CORS_ALLOWED_ORIGINS = os.getenv("CORS_ALLOWED_ORIGINS", "*")
CORS_ALLOW_CREDENTIALS = os.getenv("CORS_ALLOW_CREDENTIALS", "true").lower() == "true"
TRUSTED_HOSTS = os.getenv("TRUSTED_HOSTS", "*")
SECURITY_HEADERS_ENABLED = os.getenv("SECURITY_HEADERS_ENABLED", "true").lower() == "true"
REQUIRE_HTTPS = os.getenv("REQUIRE_HTTPS", "false").lower() == "true"

# Optional provider keys for future integrations.
TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID", "")
TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN", "")
TWILIO_FROM_NUMBER = os.getenv("TWILIO_FROM_NUMBER", "")
MSG91_AUTH_KEY = os.getenv("MSG91_AUTH_KEY", "")
FAST2SMS_API_KEY = os.getenv("FAST2SMS_API_KEY", "")
RAZORPAY_KEY_ID = os.getenv("RAZORPAY_KEY_ID", "")
RAZORPAY_KEY_SECRET = os.getenv("RAZORPAY_KEY_SECRET", "")
STRIPE_SECRET_KEY = os.getenv("STRIPE_SECRET_KEY", "")

# Fix: use absolute path so db location is consistent regardless of working directory
DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{os.path.join(BASE_DIR, 'data', 'finassist.db')}")