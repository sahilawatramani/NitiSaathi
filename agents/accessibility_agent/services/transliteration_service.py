"""
Transliteration & Vernacular Normalizer for Hinglish and Colloquial Gig Phrases.
"""
import re
import logging
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)

# Common Hinglish terms and colloquial mappings to Devanagari & Standard English
HINGLISH_MAP = {
    # Earnings & Work
    "paisa": ("पैसा", "money / earnings"),
    "paise": ("पैसे", "money"),
    "kamai": ("कमाई", "earnings / income"),
    "hafta": ("हफ्ता", "week"),
    "hafte": ("हफ्ते", "weekly"),
    "roz": ("रोज", "daily"),
    "kharcha": ("खर्चा", "expense"),
    "kharche": ("खर्चे", "expenses"),
    "bachat": ("बचत", "savings"),
    "udhaar": ("उधार", "informal borrowing / loan"),
    "karz": ("कर्ज", "debt"),
    "kist": ("किस्त", "EMI / installment"),
    "bima": ("बीमा", "insurance"),
    "beema": ("बीमा", "insurance"),
    "suraksha": ("सुरक्षा", "protection / security"),
    "yojana": ("योजना", "government scheme"),
    "khata": ("खाता", "bank account"),
    "dhokhadhadi": ("धोखाधड़ी", "fraud / scam"),
    "jhol": ("झोल", "scam / issue"),
    "chori": ("चोरी", "theft"),
    "fraad": ("फ्रॉड", "fraud"),

    # Query helpers
    "kab": ("कब", "when"),
    "kitna": ("कितना", "how much"),
    "kitni": ("कितनी", "how much"),
    "kaise": ("कैसे", "how to"),
    "milega": ("मिलेगा", "will receive"),
    "kat gaya": ("कट गया", "deducted"),
    "cut gaya": ("कट गया", "deducted"),
    "aayega": ("आएगा", "will arrive"),
    "batao": ("बताओ", "tell me"),
    "check karo": ("चेक करो", "check this"),
    "kya": ("क्या", "what / is"),
    "hai": ("है", "is"),
    "hain": ("हैं", "are"),
    "mera": ("मेरा", "my"),
    "meri": ("मेरी", "my"),
    "mujhe": ("मुझे", "to me"),
    "chahiye": ("चाहिए", "needed / want"),
}

INTENT_KEYWORDS = {
    "fraud": ["fraud", "dhokhadhadi", "jhol", "fake", "otp", "pin", "block", "phishing", "scam", "qr code"],
    "scheme": ["yojana", "scheme", "e-shram", "eshram", "pmsby", "pm-sym", "pmjjby", "apy", "beema", "bima", "pension"],
    "budget": ["kamai", "income", "kharcha", "bachat", "payout", "hafta", "forecast", "rent", "emi", "kist", "balance"],
    "literacy": ["matlab", "meaning", "samjhao", "kaise kare", "kya hota hai", "explain"]
}

class TransliterationService:
    """Service to normalize and transliterate Romanized Hindi (Hinglish) expressions."""

    def transliterate_hinglish(
        self,
        text: str,
        target_script: str = "Deva",
        target_lang: str = "hi"
    ) -> Dict[str, Any]:
        """
        Transliterate Romanized Hindi words into Devanagari and detect intent hints.
        """
        words = re.findall(r"[\w'₹\.-]+|[^\w\s]", text)
        deva_words = []
        english_normalized_words = []

        for w in words:
            clean = w.lower()
            if clean in HINGLISH_MAP:
                deva_char, en_meaning = HINGLISH_MAP[clean]
                deva_words.append(deva_char)
                english_normalized_words.append(clean)
            else:
                deva_words.append(w)
                english_normalized_words.append(w)

        transliterated_str = " ".join(deva_words)
        # Fix punctuation spaces
        transliterated_str = re.sub(r'\s+([?.!,])', r'\1', transliterated_str)

        # Detect potential domain intent hint
        text_lower = text.lower()
        detected_intent = None
        for intent, kw_list in INTENT_KEYWORDS.items():
            if any(kw in text_lower for kw in kw_list):
                detected_intent = intent
                break

        return {
            "original_text": text,
            "transliterated_text": transliterated_str,
            "normalized_english": " ".join(english_normalized_words),
            "identified_intent_hint": detected_intent
        }

_translit_instance = None

def get_transliteration_service() -> TransliterationService:
    global _translit_instance
    if _translit_instance is None:
        _translit_instance = TransliterationService()
    return _translit_instance
