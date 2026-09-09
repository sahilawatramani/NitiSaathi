"""
Google Translation API Service with Financial Token Preservation and Cache.
"""
import re
import html
import logging
from typing import List, Dict, Tuple, Optional, Any
import requests

from ..config import settings
from .glossary_service import get_glossary_service

logger = logging.getLogger(__name__)

# Patterns to protect from being mangled by machine translation
PROTECTED_PATTERNS = [
    r'₹\s*[\d,]+(?:\.\d+)?(?:/[a-zA-Z]+)?',            # Currency amounts (e.g., ₹2,500, ₹20/year)
    r'Rs\.?\s*[\d,]+(?:\.\d+)?',                       # Rs. 500
    r'\b\d+(?:\.\d+)?%',                               # Percentages (e.g., 15%, 3.5%)
    r'\b\d{10,12}\b',                                  # Aadhaar / Phone / UAN numbers
    r'\b(?:e-Shram|eShram|PM-SYM|PMSBY|PMJJBY|APY)\b',  # Scheme acronyms
    r'\b(?:UPI PIN|UPI|OTP|KYC|TDS|EPFO|ESIC|WMA)\b',   # Technical acronyms
    r'\b(?:Swiggy|Zomato|Uber|Ola|Zepto|Blinkit|Rapido|Urban Company)\b', # Platforms
]

COMPILED_PROTECTION_REGEX = re.compile('|'.join(f'({p})' for p in PROTECTED_PATTERNS), re.IGNORECASE)

_SENTINEL = object()

class GoogleTranslateService:
    """Service to handle translation via Google Translation API v2 and Gemini with token preservation and cache."""

    def __init__(self, api_key: Any = _SENTINEL):
        if api_key is _SENTINEL:
            self.api_key = settings.GOOGLE_TRANSLATE_API_KEY
        else:
            self.api_key = api_key
        self.api_url = "https://translation.googleapis.com/language/translate/v2"
        self._cache: Dict[str, str] = {}
        self.glossary_service = get_glossary_service()

    def _mask_tokens(self, text: str) -> Tuple[str, List[str]]:
        """
        Replace protected tokens (currency, scheme codes, etc.) with unique placeholders
        so translation engines do not alter them.
        """
        tokens: List[str] = []
        
        def replacer(match):
            token = match.group(0)
            token_index = len(tokens)
            tokens.append(token)
            return f" __PROTECTED_TOKEN_{token_index}__ "

        masked_text = COMPILED_PROTECTION_REGEX.sub(replacer, text)
        return masked_text, tokens

    def _unmask_tokens(self, translated_text: str, tokens: List[str]) -> str:
        """
        Restore original protected tokens into translated text.
        """
        result = translated_text
        for idx, token in enumerate(tokens):
            # Match placeholder with possible spaces inserted by translation
            pattern = re.compile(rf'__\s*PROTECTED_TOKEN_{idx}\s*__', re.IGNORECASE)
            result = pattern.sub(token, result)
        
        # Clean up any residual double spaces
        result = re.sub(r'\s{2,}', ' ', result).strip()
        return result

    def translate_text(
        self,
        text: str,
        target_lang: str = "hi",
        source_lang: Optional[str] = "en",
        preserve_tokens: bool = True
    ) -> Dict[str, Any]:
        """
        Translate text using Google Cloud Translation API.
        Falls back to offline glossary and rule-based system if API is unavailable.
        """
        if not text or not text.strip():
            return {
                "original_text": text,
                "translated_text": text,
                "source_lang": source_lang or "en",
                "target_lang": target_lang,
                "preserved_tokens": [],
                "provider": "passthrough",
                "cached": False
            }

        cache_key = f"{source_lang}:{target_lang}:{preserve_tokens}:{text}"
        if settings.ENABLE_TRANSLATION_CACHE and cache_key in self._cache:
            return {
                "original_text": text,
                "translated_text": self._cache[cache_key],
                "source_lang": source_lang or "en",
                "target_lang": target_lang,
                "preserved_tokens": [],
                "provider": "cache",
                "cached": True
            }

        tokens: List[str] = []
        text_to_send = text
        if preserve_tokens:
            text_to_send, tokens = self._mask_tokens(text)

        translated_text = ""
        provider = "google_translate_api"

        if self.api_key:
            # 1. Try Google Cloud Translation API v2
            try:
                params = {
                    "key": self.api_key,
                    "q": text_to_send,
                    "target": target_lang,
                    "format": "text"
                }
                if source_lang and source_lang != "auto":
                    params["source"] = source_lang

                response = requests.post(self.api_url, params=params, timeout=8)
                if response.status_code == 200:
                    data = response.json()
                    translations = data.get("data", {}).get("translations", [])
                    if translations:
                        raw_translated = translations[0].get("translatedText", "")
                        raw_translated = html.unescape(raw_translated)
                        if preserve_tokens:
                            translated_text = self._unmask_tokens(raw_translated, tokens)
                        else:
                            translated_text = raw_translated
                else:
                    logger.debug(
                        f"Google Translation API returned status {response.status_code}. Attempting Gemini Translation fallback."
                    )
            except Exception as e:
                logger.debug(f"Error calling Google Cloud Translation API: {e}")

            # 2. If Translation API didn't return text, try Google Gemini AI Translation
            if not translated_text:
                gemini_res = self._gemini_translate(text_to_send, target_lang, source_lang)
                if gemini_res:
                    provider = "google_gemini_api"
                    if preserve_tokens:
                        translated_text = self._unmask_tokens(gemini_res, tokens)
                    else:
                        translated_text = gemini_res

            # 3. If neither worked, use offline translation fallback
            if not translated_text:
                provider = "offline_fallback"
                translated_text = self._offline_translate(text, target_lang, source_lang)
        else:
            logger.info("No GOOGLE_TRANSLATE_API_KEY found, using offline translation engine.")
            provider = "offline_fallback"
            translated_text = self._offline_translate(text, target_lang, source_lang)

        # Store in cache
        if settings.ENABLE_TRANSLATION_CACHE and translated_text:
            if len(self._cache) >= settings.CACHE_MAX_SIZE:
                self._cache.pop(next(iter(self._cache)))
            self._cache[cache_key] = translated_text

        return {
            "original_text": text,
            "translated_text": translated_text,
            "source_lang": source_lang or "en",
            "target_lang": target_lang,
            "preserved_tokens": tokens,
            "provider": provider,
            "cached": False
        }

    def _gemini_translate(self, text_to_send: str, target_lang: str, source_lang: Optional[str] = "en") -> Optional[str]:
        """
        Translate using Google Gemini Generative API when a Gemini API key is provided.
        """
        if not self.api_key:
            return None
            
        target_lang_name = settings.SUPPORTED_LANGUAGES.get(target_lang, target_lang)
        prompt = (
            f"You are an expert financial and government scheme translator for Indian informal and gig workers.\n"
            f"Translate the following text into {target_lang_name}.\n"
            f"CRITICAL RULES:\n"
            f"1. Maintain exact financial and conversational meaning, simple and clear for low-literacy workers.\n"
            f"2. Keep all placeholder tokens (like __PROTECTED_TOKEN_0__, __PROTECTED_TOKEN_1__, etc.) EXACTLY verbatim without translating, modifying, or dropping them.\n"
            f"3. Return ONLY the translated sentence/text without any markdown conversational intro/outro or quotes.\n\n"
            f"Text to translate:\n{text_to_send}"
        )
        
        models_to_try = ["gemini-3.5-flash-lite", "gemini-3.6-flash", "gemini-flash-latest"]
        for model in models_to_try:
            try:
                url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={self.api_key}"
                payload = {
                    "contents": [{"parts": [{"text": prompt}]}],
                    "generationConfig": {"temperature": 0.1}
                }
                res = requests.post(url, json=payload, timeout=6)
                if res.status_code == 200:
                    data = res.json()
                    candidates = data.get("candidates", [])
                    if candidates:
                        parts = candidates[0].get("content", {}).get("parts", [])
                        if parts:
                            translated = parts[0].get("text", "").strip()
                            if translated:
                                return translated
            except Exception as e:
                logger.debug(f"Gemini translation attempt with {model} failed: {e}")
        return None

    def _offline_translate(self, text: str, target_lang: str, source_lang: Optional[str]) -> str:
        """
        Rule-based and glossary-based offline translation fallback.
        """
        if target_lang == "en" and source_lang == "en":
            return text
            
        translated = text
        # Replace financial glossary terms first
        for term in self.glossary_service.get_all_terms():
            if target_lang == "hi":
                # Replace English term with Hindi term
                pattern = re.compile(rf'\b{re.escape(term.term_en)}\b', re.IGNORECASE)
                translated = pattern.sub(term.term_hi, translated)
                for alt in term.alternatives:
                    pattern_alt = re.compile(rf'\b{re.escape(alt)}\b', re.IGNORECASE)
                    translated = pattern_alt.sub(term.term_hi, translated)

        # Common phrase replacements for gig workers if target is Hindi
        if target_lang == "hi":
            common_phrases = [
                ("Your", "आपका"),
                ("your", "आपका"),
                ("is due in", "की अंतिम तारीख है"),
                ("insurance premium", "बीमा प्रीमियम"),
                ("Keep sufficient balance", "पर्याप्त बैलेंस बनाए रखें"),
                ("Balance is", "बैलेंस है"),
                ("predicted earnings", "अनुमानित कमाई"),
                ("next week", "अगले हफ्ते"),
                ("is eligible", "पात्र है"),
                ("not eligible", "पात्र नहीं है"),
                ("Do not share your UPI PIN", "अपना यूपीआई पिन किसी को न दें"),
                ("One-time password", "एक बार का पासवर्ड"),
                ("monthly savings", "मासिक बचत"),
            ]
            for en_phrase, hi_phrase in common_phrases:
                translated = re.sub(rf'\b{re.escape(en_phrase)}\b', hi_phrase, translated, flags=re.IGNORECASE)

        return translated

    def word_to_word_translate(
        self,
        text: str,
        target_lang: str = "hi",
        source_lang: Optional[str] = "en"
    ) -> Dict[str, Any]:
        """
        Break sentence into words and provide word-by-word alignment + glossary matching.
        """
        full_res = self.translate_text(text, target_lang=target_lang, source_lang=source_lang)
        
        # Tokenize words while preserving punctuation
        raw_words = re.findall(r"[\w'₹\.-]+|[.,!?;]", text)
        word_items = []
        financial_terms_found = set()

        for w in raw_words:
            clean_word = w.strip()
            if not clean_word:
                continue

            # Check if this word or phrase is in our financial glossary
            glossary_match = self.glossary_service.find_term(clean_word)
            is_financial = glossary_match is not None

            if is_financial:
                translated_word = glossary_match.term_hi if target_lang == "hi" else glossary_match.term_en
                simplified_def = (
                    glossary_match.simplified_definition_hi if target_lang == "hi" 
                    else glossary_match.simplified_definition_en
                )
                phonetic = glossary_match.phonetic_hi
                gig_note = (
                    glossary_match.gig_context_example_hi if target_lang == "hi"
                    else glossary_match.gig_context_example_en
                )
                financial_terms_found.add(glossary_match.term_en)
            else:
                # If it's a number or currency
                if re.match(r'^₹?\d+(?:\.\d+)?$', clean_word):
                    translated_word = clean_word
                    simplified_def = "राशि / संख्या" if target_lang == "hi" else "Amount / Number"
                    phonetic = None
                    gig_note = None
                else:
                    # Translate single word
                    word_trans = self.translate_text(
                        clean_word, target_lang=target_lang, source_lang=source_lang, preserve_tokens=True
                    )
                    translated_word = word_trans["translated_text"]
                    simplified_def = None
                    phonetic = None
                    gig_note = None

            word_items.append({
                "original_word": clean_word,
                "translated_word": translated_word,
                "is_financial_term": is_financial,
                "simplified_meaning": simplified_def,
                "phonetic": phonetic,
                "gig_context_note": gig_note
            })

        return {
            "original_text": text,
            "full_translation": full_res["translated_text"],
            "source_lang": source_lang or "en",
            "target_lang": target_lang,
            "words": word_items,
            "financial_terms_identified": list(financial_terms_found)
        }

    def get_cache_stats(self) -> Dict[str, int]:
        """Return cache statistics."""
        return {
            "cached_entries": len(self._cache),
            "max_cache_size": settings.CACHE_MAX_SIZE
        }

    def clear_cache(self) -> None:
        """Clear cache."""
        self._cache.clear()

_instance = None

def get_translate_service() -> GoogleTranslateService:
    global _instance
    if _instance is None:
        _instance = GoogleTranslateService()
    return _instance
