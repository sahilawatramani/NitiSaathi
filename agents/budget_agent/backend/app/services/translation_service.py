"""
Translation service with tiered provider support:
1. Bhashini API (if BHASHINI_API_KEY set)
2. LibreTranslate (if LIBRETRANSLATE_URL set)
3. Offline passthrough (returns original text with note)
"""
import logging
import os
import httpx

logger = logging.getLogger(__name__)

# Offline static phrases for very common UI strings
_OFFLINE_PHRASES = {
    'hi': {
        'This information is for general guidance only.': 'यह जानकारी केवल सामान्य मार्गदर्शन के लिए है।',
        'High': 'उच्च', 'Moderate': 'मध्यम', 'Low': 'निम्न',
        'Confidence': 'विश्वसनीयता',
    },
    'mr': {
        'This information is for general guidance only.': 'ही माहिती केवळ सामान्य मार्गदर्शनासाठी आहे।',
        'High': 'उच्च', 'Moderate': 'मध्यम', 'Low': 'कमी',
    }
}

async def translate(text: str, target_lang: str, source_lang: str = 'en') -> str:
    """Translate text to target_lang. Falls through providers in priority order."""
    if target_lang == 'en' or target_lang == source_lang:
        return text
    if not text.strip():
        return text
    
    bhashini_key = os.getenv('BHASHINI_API_KEY', '')
    libretranslate_url = os.getenv('LIBRETRANSLATE_URL', '')
    
    # Try Bhashini
    if bhashini_key:
        try:
            result = await _bhashini_translate(text, source_lang, target_lang, bhashini_key)
            if result:
                return result
        except Exception as e:
            logger.warning('Bhashini translation failed: %s', e)
    
    # Try LibreTranslate
    if libretranslate_url:
        try:
            result = await _libretranslate(text, source_lang, target_lang, libretranslate_url)
            if result:
                return result
        except Exception as e:
            logger.warning('LibreTranslate failed: %s', e)
    
    # Offline fallback: return original with note
    lang_note = {'hi': '(हिंदी अनुवाद उपलब्ध नहीं)', 'mr': '(मराठी अनुवाद उपलब्ध नहीं)'}
    return text + f" {lang_note.get(target_lang, '')}"


async def _bhashini_translate(text: str, source: str, target: str, api_key: str) -> str | None:
    """Bhashini NMT pipeline — stub until API docs are integrated."""
    # Real implementation: POST to Bhashini's ULCA endpoint
    # https://bhashini.gov.in/ulca/model/api
    raise NotImplementedError('Bhashini translation stub — wire with actual endpoint when API key available')


async def _libretranslate(text: str, source: str, target: str, base_url: str) -> str | None:
    """LibreTranslate open-source translation."""
    lang_map = {'hi': 'hi', 'en': 'en', 'mr': 'mr'}  # LibreTranslate uses ISO codes
    async with httpx.AsyncClient(timeout=5) as client:
        resp = await client.post(
            f'{base_url.rstrip("/")}/translate',
            json={'q': text, 'source': lang_map.get(source, source), 'target': lang_map.get(target, target), 'format': 'text'}
        )
        resp.raise_for_status()
        return resp.json().get('translatedText')
