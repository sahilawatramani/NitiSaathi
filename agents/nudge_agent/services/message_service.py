"""
Message service to simplify nudges using the Literacy Agent service.
Handles graceful degradation in case of network or API errors.
"""
import logging
import requests

logger = logging.getLogger(__name__)

LITERACY_AGENT_URL = "http://localhost:8100/literacy/rewrite"

def simplify_message(raw_message: str, literacy_level: str = "medium") -> str:
    """
    Simplifies a raw message by POSTing to the Literacy Agent's rewrite endpoint.
    On connection error or non-200 status code, logs a warning and returns
    the raw_message unchanged.
    """
    if not raw_message:
        return raw_message

    payload = {
        "text": raw_message,
        "literacy_level": literacy_level,
        "has_financial_content": True,
        "has_scheme_content": "pmsby" in raw_message.lower() or "insurance" in raw_message.lower()
    }

    try:
        response = requests.post(LITERACY_AGENT_URL, json=payload, timeout=2.0)
        if response.status_code == 200:
            data = response.json()
            return data.get("rewritten_text", raw_message)
        else:
            logger.warning(
                f"Literacy Agent returned status code {response.status_code}. "
                f"Returning raw message."
            )
    except Exception as e:
        logger.warning(f"Error communicating with Literacy Agent: {e}. Returning raw message.")

    return raw_message
