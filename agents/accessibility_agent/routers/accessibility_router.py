"""
FastAPI Router for Accessibility Agent Endpoints.
"""
import logging
from typing import Optional, List
from fastapi import APIRouter, HTTPException, Query, Path

from ..config import settings
from ..models.schemas import (
    TranslationRequest,
    TranslationResponse,
    WordToWordRequest,
    WordToWordResponse,
    GlossaryListResponse,
    GlossaryTerm,
    NumberToWordsRequest,
    NumberToWordsResponse,
    TTSConfigRequest,
    TTSConfigResponse,
    TransliterationRequest,
    TransliterationResponse,
    AccessibilityProfile,
    AccessibilityAdaptationResponse,
    AccessibilityHealthResponse
)
from ..services.google_translate_service import get_translate_service
from ..services.glossary_service import get_glossary_service
from ..services.speech_accessibility_service import get_speech_service
from ..services.transliteration_service import get_transliteration_service
from ..services.profile_service import get_profile_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/accessibility", tags=["Accessibility Agent"])

@router.get("/health", response_model=AccessibilityHealthResponse)
async def health_check():
    """
    Health check endpoint returning configuration status, glossary count, and cache stats.
    """
    translate_svc = get_translate_service()
    glossary_svc = get_glossary_service()
    cache_stats = translate_svc.get_cache_stats()

    return AccessibilityHealthResponse(
        status="healthy",
        agent="Accessibility Agent",
        version=settings.VERSION,
        google_api_configured=bool(translate_svc.api_key),
        glossary_terms_count=len(glossary_svc.get_all_terms()),
        cached_translations_count=cache_stats.get("cached_entries", 0),
        supported_languages=settings.SUPPORTED_LANGUAGES
    )

@router.post("/translate", response_model=TranslationResponse)
async def translate(request: TranslationRequest):
    """
    Translate text into target language while preserving ₹ amounts, percentages, and scheme names.
    """
    try:
        translate_svc = get_translate_service()
        result = translate_svc.translate_text(
            text=request.text,
            target_lang=request.target_lang,
            source_lang=request.source_lang,
            preserve_tokens=request.preserve_financial_tokens
        )
        return TranslationResponse(**result)
    except Exception as e:
        logger.error(f"Translation failed: {e}")
        raise HTTPException(status_code=500, detail=f"Translation error: {str(e)}")

@router.post("/word-to-word", response_model=WordToWordResponse)
async def word_to_word_translate(request: WordToWordRequest):
    """
    Break down input text word-by-word with translation, phonetic guides, and financial definitions.
    """
    try:
        translate_svc = get_translate_service()
        result = translate_svc.word_to_word_translate(
            text=request.text,
            target_lang=request.target_lang,
            source_lang=request.source_lang
        )
        return WordToWordResponse(**result)
    except Exception as e:
        logger.error(f"Word-to-word translation failed: {e}")
        raise HTTPException(status_code=500, detail=f"Word-to-word breakdown error: {str(e)}")

@router.get("/glossary", response_model=GlossaryListResponse)
async def get_glossary(
    query: Optional[str] = Query(None, description="Search query in English or Hindi"),
    category: Optional[str] = Query(None, description="Filter by category"),
    language: Optional[str] = Query("hi", description="Language preference")
):
    """
    List or search all curated financial, banking, and government welfare scheme terms.
    """
    try:
        glossary_svc = get_glossary_service()
        terms = glossary_svc.search_terms(query=query or "", language=language or "hi", category=category)
        return GlossaryListResponse(total=len(terms), terms=terms)
    except Exception as e:
        logger.error(f"Glossary search failed: {e}")
        raise HTTPException(status_code=500, detail=f"Glossary search error: {str(e)}")

@router.get("/glossary/{term_id}", response_model=GlossaryTerm)
async def get_glossary_term(
    term_id: str = Path(..., description="Unique term ID (e.g., 'e_shram', 'pmsby')")
):
    """
    Get detailed breakdown for a specific glossary term.
    """
    glossary_svc = get_glossary_service()
    term = glossary_svc.get_term_by_id(term_id)
    if not term:
        # Try find by string
        term = glossary_svc.find_term(term_id)
    if not term:
        raise HTTPException(status_code=404, detail=f"Term '{term_id}' not found in glossary.")
    return term

@router.post("/number-to-words", response_model=NumberToWordsResponse)
async def number_to_words(request: NumberToWordsRequest):
    """
    Convert numerical Indian rupee amounts into spoken words in Hindi or English.
    """
    try:
        speech_svc = get_speech_service()
        result = speech_svc.verbalize_currency(
            amount=request.amount,
            language=request.language,
            currency=request.currency,
            include_paise=request.include_paise
        )
        return NumberToWordsResponse(**result)
    except Exception as e:
        logger.error(f"Number to words conversion failed: {e}")
        raise HTTPException(status_code=500, detail=f"Conversion error: {str(e)}")

@router.post("/tts-config", response_model=TTSConfigResponse)
async def get_tts_config(request: TTSConfigRequest):
    """
    Generate SSML markup with pauses around critical amounts & warnings, plus Web Speech API configs.
    """
    try:
        speech_svc = get_speech_service()
        result = speech_svc.generate_tts_config(
            text=request.text,
            language=request.language,
            speaking_rate=request.speaking_rate or 0.9,
            pitch=request.pitch or 0.0,
            enhance_financial_pauses=request.enhance_financial_pauses
        )
        return TTSConfigResponse(**result)
    except Exception as e:
        logger.error(f"TTS config generation failed: {e}")
        raise HTTPException(status_code=500, detail=f"TTS config error: {str(e)}")

@router.post("/transliterate", response_model=TransliterationResponse)
async def transliterate(request: TransliterationRequest):
    """
    Convert Romanized Hindi / Hinglish phrases into Devanagari and detect intent hints.
    """
    try:
        translit_svc = get_transliteration_service()
        result = translit_svc.transliterate_hinglish(
            text=request.text,
            target_script=request.target_script,
            target_lang=request.target_lang
        )
        return TransliterationResponse(**result)
    except Exception as e:
        logger.error(f"Transliteration failed: {e}")
        raise HTTPException(status_code=500, detail=f"Transliteration error: {str(e)}")

@router.post("/profile/adapt-ui", response_model=AccessibilityAdaptationResponse)
async def adapt_ui(profile: AccessibilityProfile):
    """
    Compute UI styling tokens (CSS variables) and ARIA accessibility properties for a user profile.
    """
    try:
        profile_svc = get_profile_service()
        return profile_svc.adapt_ui_for_profile(profile)
    except Exception as e:
        logger.error(f"UI adaptation failed: {e}")
        raise HTTPException(status_code=500, detail=f"Profile adaptation error: {str(e)}")

@router.post("/cache/clear")
async def clear_cache():
    """
    Clear translation memory cache.
    """
    translate_svc = get_translate_service()
    translate_svc.clear_cache()
    return {"status": "success", "message": "Translation cache cleared successfully."}
