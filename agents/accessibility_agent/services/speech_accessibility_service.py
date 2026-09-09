"""
Speech Accessibility & Number-to-Words Engine for Indian Currency and Languages.
"""
import re
import logging
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)

# Hindi numeral mappings
HINDI_ONES = [
    "", "एक", "दो", "तीन", "चार", "पाँच", "छह", "सात", "आठ", "नौ", "दस",
    "ग्यारह", "बारह", "तेरह", "चौदह", "पंद्रह", "सोलह", "सत्रह", "अठारह", "उन्नीस"
]
HINDI_TENS = [
    "", "", "बीस", "तीस", "चालीस", "पचास", "साठ", "सत्तर", "अस्सी", "नब्बे"
]
# Detailed numbers 20-99 in standard Hindi
HINDI_NUMS = {
    20: "बीस", 21: "इक्कीस", 22: "बाईस", 23: "तेईस", 24: "चौबीस", 25: "पच्चीस",
    26: "छब्बीस", 27: "सत्ताईस", 28: "अट्ठाईस", 29: "उनतीस", 30: "तीस",
    31: "इकतीस", 32: "बत्तीस", 33: "तैंतीस", 34: "चौंतीस", 35: "पैंतीस",
    36: "छत्तीस", 37: "सैंतीस", 38: "अड़तीस", 39: "उनतालीस", 40: "चालीस",
    41: "इकतालीस", 42: "बयालीस", 43: "तैंतालीस", 44: "चवालीस", 45: "पैंतालीस",
    46: "छियालीस", 47: "सैंतालीस", 48: "अड़तालीस", 49: "उनचास", 50: "पचास",
    51: "इक्यावन", 52: "बावन", 53: "तिरेपन", 54: "चौवन", 55: "पचपन",
    56: "छप्पन", 57: "सत्तावन", 58: "अट्ठावन", 59: "उनसठ", 60: "साठ",
    61: "इकसठ", 62: "बासठ", 63: "तिरसठ", 64: "चौंसठ", 65: "पैंसठ",
    66: "छियासठ", 67: "सरसठ", 68: "अड़सठ", 69: "उनहत्तर", 70: "सत्तर",
    71: "इकहत्तर", 72: "बहत्तर", 73: "तिहत्तर", 74: "चौहत्तर", 75: "पचहत्तर",
    76: "छिहत्तर", 77: "सतहत्तर", 78: "अठहत्तर", 79: "उनासी", 80: "अस्सी",
    81: "इक्यासी", 82: "बयासी", 83: "तिरासी", 84: "चौरासी", 85: "पचासी",
    86: "छियासी", 87: "सत्तासी", 88: "अट्ठासी", 89: "नवासी", 90: "नब्बे",
    91: "इक्यानवे", 92: "बानवे", 93: "तिरानवे", 94: "चौरानवे", 95: "पंचानवे",
    96: "छियानवे", 97: "सत्तानवे", 98: "अट्ठानवे", 99: "निन्यानवे"
}

ENGLISH_ONES = [
    "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
    "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"
]
ENGLISH_TENS = [
    "", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"
]

class SpeechAccessibilityService:
    """Service to generate spoken representations of numbers, currencies, and TTS configurations."""

    def _convert_below_thousand_en(self, num: int) -> str:
        """Helper to convert 1..999 to English words."""
        parts = []
        hundreds = num // 100
        remainder = num % 100

        if hundreds > 0:
            parts.append(f"{ENGLISH_ONES[hundreds]} Hundred")

        if remainder > 0:
            if remainder < 20:
                parts.append(ENGLISH_ONES[remainder])
            else:
                tens = remainder // 10
                ones = remainder % 10
                if ones > 0:
                    parts.append(f"{ENGLISH_TENS[tens]} {ENGLISH_ONES[ones]}")
                else:
                    parts.append(ENGLISH_TENS[tens])

        return " ".join(parts).strip()

    def _convert_below_thousand_hi(self, num: int) -> str:
        """Helper to convert 1..999 to Hindi words."""
        parts = []
        hundreds = num // 100
        remainder = num % 100

        if hundreds > 0:
            parts.append(f"{HINDI_ONES[hundreds]} सौ")

        if remainder > 0:
            if remainder < 20:
                parts.append(HINDI_ONES[remainder])
            else:
                parts.append(HINDI_NUMS.get(remainder, f"{HINDI_TENS[remainder // 10]} {HINDI_ONES[remainder % 10]}"))

        return " ".join(parts).strip()

    def number_to_words_en(self, amount: float, include_paise: bool = True) -> str:
        """Convert float amount to Indian English words (Crore, Lakh, Thousand, Rupees)."""
        int_part = int(amount)
        paise_part = round((amount - int_part) * 100)

        if int_part == 0 and paise_part == 0:
            return "Zero Rupees"

        parts = []
        crores = int_part // 10000000
        rem_crores = int_part % 10000000
        lakhs = rem_crores // 100000
        rem_lakhs = rem_crores % 100000
        thousands = rem_lakhs // 1000
        hundreds_and_below = rem_lakhs % 1000

        if crores > 0:
            parts.append(f"{self._convert_below_thousand_en(crores)} Crore")
        if lakhs > 0:
            parts.append(f"{self._convert_below_thousand_en(lakhs)} Lakh")
        if thousands > 0:
            parts.append(f"{self._convert_below_thousand_en(thousands)} Thousand")
        if hundreds_and_below > 0:
            parts.append(self._convert_below_thousand_en(hundreds_and_below))

        spoken_rupees = " ".join(parts).strip() + " Rupees" if parts else ""

        if include_paise and paise_part > 0:
            spoken_paise = f"{self._convert_below_thousand_en(paise_part)} Paise"
            if spoken_rupees:
                return f"{spoken_rupees} and {spoken_paise}"
            return spoken_paise

        return spoken_rupees or "Zero Rupees"

    def number_to_words_hi(self, amount: float, include_paise: bool = True) -> str:
        """Convert float amount to Hindi words using Indian numbering system."""
        int_part = int(amount)
        paise_part = round((amount - int_part) * 100)

        if int_part == 0 and paise_part == 0:
            return "शून्य रुपये"

        parts = []
        crores = int_part // 10000000
        rem_crores = int_part % 10000000
        lakhs = rem_crores // 100000
        rem_lakhs = rem_crores % 100000
        thousands = rem_lakhs // 1000
        hundreds_and_below = rem_lakhs % 1000

        if crores > 0:
            parts.append(f"{self._convert_below_thousand_hi(crores)} करोड़")
        if lakhs > 0:
            parts.append(f"{self._convert_below_thousand_hi(lakhs)} लाख")
        if thousands > 0:
            parts.append(f"{self._convert_below_thousand_hi(thousands)} हज़ार")
        if hundreds_and_below > 0:
            parts.append(self._convert_below_thousand_hi(hundreds_and_below))

        spoken_rupees = " ".join(parts).strip() + " रुपये" if parts else ""

        if include_paise and paise_part > 0:
            spoken_paise = f"{self._convert_below_thousand_hi(paise_part)} पैसे"
            if spoken_rupees:
                return f"{spoken_rupees} {spoken_paise}"
            return spoken_paise

        return spoken_rupees or "शून्य रुपये"

    def format_indian_currency(self, amount: float) -> str:
        """Format number into Indian currency format: ₹1,23,456.78"""
        is_negative = amount < 0
        amount = abs(amount)
        int_part = int(amount)
        dec_part = f"{amount - int_part:.2f}"[2:]

        s = str(int_part)
        if len(s) <= 3:
            res = s
        else:
            last3 = s[-3:]
            rem = s[:-3]
            # Group by 2 digits
            groups = []
            while len(rem) > 2:
                groups.insert(0, rem[-2:])
                rem = rem[:-2]
            if rem:
                groups.insert(0, rem)
            res = ",".join(groups) + "," + last3

        sign = "-" if is_negative else ""
        if dec_part != "00":
            return f"{sign}₹{res}.{dec_part}"
        return f"{sign}₹{res}"

    def verbalize_currency(
        self,
        amount: float,
        language: str = "hi",
        currency: str = "INR",
        include_paise: bool = True
    ) -> Dict[str, Any]:
        """Produce full verbalization dictionary for an amount."""
        formatted = self.format_indian_currency(amount)
        
        if language == "en":
            spoken = self.number_to_words_en(amount, include_paise)
            short = f"{formatted} ({spoken})"
        else:
            spoken = self.number_to_words_hi(amount, include_paise)
            short = f"{formatted} ({spoken})"

        return {
            "amount": amount,
            "currency": currency,
            "formatted_amount": formatted,
            "spoken_text": spoken,
            "language": language,
            "short_vernacular": short
        }

    def generate_tts_config(
        self,
        text: str,
        language: str = "hi",
        speaking_rate: float = 0.9,
        pitch: float = 0.0,
        enhance_financial_pauses: bool = True
    ) -> Dict[str, Any]:
        """
        Generate SSML text with audio pauses around amounts, warnings, and scheme names,
        along with browser Web Speech API parameters.
        """
        ssml_body = text
        if enhance_financial_pauses:
            # Add micro pause after currency amounts
            ssml_body = re.sub(
                r'(₹\s*[\d,]+(?:\.\d+)?)',
                r'<emphasis level="moderate">\1</emphasis><break time="250ms"/>',
                ssml_body
            )
            # Add pause after warnings
            ssml_body = re.sub(
                r'(सावधान|धोखाधड़ी|चेतावनी|Warning|Alert|Never share)',
                r'<break time="300ms"/><emphasis level="strong">\1</emphasis>',
                ssml_body,
                flags=re.IGNORECASE
            )

        ssml = f'<speak version="1.0" xml:lang="{language}"><prosody rate="{speaking_rate}" pitch="{pitch:+.1f}st">{ssml_body}</prosody></speak>'

        # Browser Speech Synthesis config
        lang_tag = "hi-IN" if language == "hi" else ("mr-IN" if language == "mr" else "en-IN")
        browser_config = {
            "lang": lang_tag,
            "rate": max(0.5, min(1.5, speaking_rate)),
            "pitch": max(0.5, min(1.5, 1.0 + (pitch / 10.0))),
            "volume": 1.0
        }

        return {
            "text": text,
            "language_code": lang_tag,
            "speaking_rate": speaking_rate,
            "pitch": pitch,
            "ssml": ssml,
            "browser_speech_config": browser_config
        }

_speech_instance = None

def get_speech_service() -> SpeechAccessibilityService:
    global _speech_instance
    if _speech_instance is None:
        _speech_instance = SpeechAccessibilityService()
    return _speech_instance
