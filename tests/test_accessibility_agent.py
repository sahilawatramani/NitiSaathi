"""
Unit tests for the Accessibility Agent.
"""
import pytest
from agents.accessibility_agent.services.google_translate_service import GoogleTranslateService, get_translate_service
from agents.accessibility_agent.services.glossary_service import GlossaryService, get_glossary_service
from agents.accessibility_agent.services.speech_accessibility_service import SpeechAccessibilityService, get_speech_service
from agents.accessibility_agent.services.transliteration_service import TransliterationService, get_transliteration_service
from agents.accessibility_agent.services.profile_service import AccessibilityProfileService, get_profile_service
from agents.accessibility_agent.models.schemas import (
    AccessibilityProfile,
    TranslationRequest,
    WordToWordRequest,
    NumberToWordsRequest,
    TTSConfigRequest,
    TransliterationRequest
)
from agents.accessibility_agent.routers.accessibility_router import (
    health_check,
    translate,
    word_to_word_translate,
    get_glossary,
    get_glossary_term,
    number_to_words,
    get_tts_config,
    transliterate,
    adapt_ui,
    clear_cache
)

# ── 1. Glossary Service Tests ─────────────────────────────────────────────

def test_glossary_service_loading():
    service = GlossaryService()
    terms = service.get_all_terms()
    assert len(terms) >= 15
    categories = service.get_categories()
    assert len(categories) >= 4
    assert "Government Schemes" in categories

def test_glossary_find_term():
    service = GlossaryService()
    # Find e-shram
    term = service.find_term("e-Shram")
    assert term is not None
    assert term.term_id == "e_shram"
    assert "PMSBY" in term.gig_context_example_en

    # Find PMSBY
    pmsby = service.find_term("pmsby")
    assert pmsby is not None
    assert "20" in pmsby.simplified_definition_en

    # Non-existent term
    assert service.find_term("non_existent_term_xyz") is None

def test_glossary_search():
    service = GlossaryService()
    results = service.search_terms("pension")
    assert len(results) >= 2
    term_ids = [t.term_id for t in results]
    assert "pm_sym" in term_ids or "apy" in term_ids

    # Search with category filter
    scheme_results = service.search_terms("", category="Government Schemes")
    assert len(scheme_results) >= 4

# ── 2. Speech Accessibility & Number to Words Tests ───────────────────────

def test_number_to_words_english():
    service = SpeechAccessibilityService()
    
    assert service.number_to_words_en(0) == "Zero Rupees"
    assert service.number_to_words_en(20) == "Twenty Rupees"
    assert service.number_to_words_en(55) == "Fifty Five Rupees"
    assert service.number_to_words_en(436) == "Four Hundred Thirty Six Rupees"
    assert service.number_to_words_en(2500) == "Two Thousand Five Hundred Rupees"
    assert service.number_to_words_en(100000) == "One Lakh Rupees"
    assert service.number_to_words_en(2500000) == "Twenty Five Lakh Rupees"
    assert service.number_to_words_en(10000000) == "One Crore Rupees"
    
    # With paise
    res_paise = service.number_to_words_en(1250.75)
    assert res_paise == "One Thousand Two Hundred Fifty Rupees and Seventy Five Paise"

def test_number_to_words_hindi():
    service = SpeechAccessibilityService()
    
    assert service.number_to_words_hi(0) == "शून्य रुपये"
    assert "बीस रुपये" in service.number_to_words_hi(20)
    assert "पचपन रुपये" in service.number_to_words_hi(55)
    assert "दो हज़ार" in service.number_to_words_hi(2500)
    assert "एक लाख" in service.number_to_words_hi(100000)
    assert "एक करोड़" in service.number_to_words_hi(10000000)

def test_format_indian_currency():
    service = SpeechAccessibilityService()
    assert service.format_indian_currency(20) == "₹20"
    assert service.format_indian_currency(2500) == "₹2,500"
    assert service.format_indian_currency(123456) == "₹1,23,456"
    assert service.format_indian_currency(10000000) == "₹1,00,00,000"
    assert service.format_indian_currency(1450.50) == "₹1,450.50"

def test_tts_config_generation():
    service = SpeechAccessibilityService()
    config = service.generate_tts_config(
        text="आपका PMSBY का ₹20 का debit 9 दिन में है।",
        language="hi",
        speaking_rate=0.85
    )
    assert config["language_code"] == "hi-IN"
    assert config["speaking_rate"] == 0.85
    assert "<speak" in config["ssml"]
    assert "₹20" in config["ssml"]

# ── 3. Google Translate Service & Token Preservation Tests ────────────────

def test_token_masking_and_unmasking():
    service = GoogleTranslateService()
    text = "Your PMSBY premium is ₹20/year and Swiggy payout is ₹3,500. Never share your OTP or UPI PIN."
    masked, tokens = service._mask_tokens(text)
    
    assert "₹20/year" in tokens
    assert "₹3,500" in tokens
    assert "PMSBY" in tokens
    assert "Swiggy" in tokens
    assert "OTP" in tokens
    assert "UPI PIN" in tokens
    
    # Test unmasking
    unmasked = service._unmask_tokens(masked, tokens)
    assert "₹20/year" in unmasked
    assert "₹3,500" in unmasked
    assert "PMSBY" in unmasked

def test_offline_translation_fallback():
    service = GoogleTranslateService(api_key=None)
    result = service.translate_text(
        text="Your PMSBY insurance premium is ₹20",
        target_lang="hi",
        source_lang="en"
    )
    assert result["target_lang"] == "hi"
    assert "₹20" in result["translated_text"]
    assert result["provider"] == "offline_fallback"

def test_translation_cache():
    service = GoogleTranslateService(api_key=None)
    service.clear_cache()
    
    # First call
    res1 = service.translate_text("Your platform payout is ₹4000", target_lang="hi")
    assert res1["cached"] is False
    
    # Second call should be from cache
    res2 = service.translate_text("Your platform payout is ₹4000", target_lang="hi")
    assert res2["cached"] is True
    assert res2["translated_text"] == res1["translated_text"]

def test_word_to_word_translate():
    service = GoogleTranslateService(api_key=None)
    result = service.word_to_word_translate(
        text="Your PMSBY premium is ₹20",
        target_lang="hi",
        source_lang="en"
    )
    assert len(result["words"]) >= 4
    words = [item["original_word"] for item in result["words"]]
    assert "PMSBY" in words
    
    # Find PMSBY item
    pmsby_item = next(item for item in result["words"] if item["original_word"] == "PMSBY")
    assert pmsby_item["is_financial_term"] is True
    assert pmsby_item["simplified_meaning"] is not None

# ── 4. Transliteration Service Tests ──────────────────────────────────────

def test_transliteration_hinglish():
    service = TransliterationService()
    res = service.transliterate_hinglish("Swiggy ka paisa kab aayega aur hafta ka kharcha kitna hai")
    assert "पैसा" in res["transliterated_text"]
    assert "खर्चा" in res["transliterated_text"]
    assert "हफ्ता" in res["transliterated_text"]

def test_intent_detection_from_vernacular():
    service = TransliterationService()
    fraud_res = service.transliterate_hinglish("Mera account block hone ka fake call aaya fraud hai kya")
    assert fraud_res["identified_intent_hint"] == "fraud"

    scheme_res = service.transliterate_hinglish("e-shram yojana me beema kaise milega")
    assert scheme_res["identified_intent_hint"] == "scheme"

    budget_res = service.transliterate_hinglish("is hafte ka bachat aur kamai forecast batao")
    assert budget_res["identified_intent_hint"] == "budget"

# ── 5. Profile Accommodation Tests ────────────────────────────────────────

def test_profile_adaptation_standard():
    service = AccessibilityProfileService()
    profile = AccessibilityProfile(
        font_scale=1.0,
        high_contrast=False,
        screen_reader_mode=False
    )
    res = service.adapt_ui_for_profile(profile)
    assert res.css_theme_vars["--ns-font-scale"] == "1.0"
    assert res.css_theme_vars["--ns-bg-primary"] == "#F8FAFC"
    assert res.recommended_reading_mode == "standard"

def test_profile_adaptation_high_contrast_and_large_font():
    service = AccessibilityProfileService()
    profile = AccessibilityProfile(
        font_scale=1.5,
        high_contrast=True,
        screen_reader_mode=True,
        auto_speak_responses=True
    )
    res = service.adapt_ui_for_profile(profile)
    assert res.css_theme_vars["--ns-font-scale"] == "1.5"
    assert res.css_theme_vars["--ns-bg-primary"] == "#000000"
    assert res.css_theme_vars["--ns-text-primary"] == "#FFFFFF"
    assert res.recommended_reading_mode == "large_text"
    assert res.audio_guidance_enabled is True

# ── 6. FastAPI Router Direct Invocation Tests ─────────────────────────────

@pytest.mark.asyncio
async def test_router_health():
    res = await health_check()
    assert res.status == "healthy"
    assert res.agent == "Accessibility Agent"
    assert res.glossary_terms_count >= 15
    assert "hi" in res.supported_languages

@pytest.mark.asyncio
async def test_router_translate():
    req = TranslationRequest(
        text="Your PMSBY insurance premium of ₹20 is due next week.",
        target_lang="hi",
        source_lang="en",
        preserve_financial_tokens=True
    )
    res = await translate(req)
    assert "₹20" in res.translated_text
    assert res.target_lang == "hi"

@pytest.mark.asyncio
async def test_router_word_to_word():
    req = WordToWordRequest(
        text="PMSBY insurance ₹20",
        target_lang="hi",
        source_lang="en"
    )
    res = await word_to_word_translate(req)
    assert len(res.words) >= 2
    assert "PMSBY" in [w.original_word for w in res.words]

@pytest.mark.asyncio
async def test_router_glossary():
    # List all
    res_all = await get_glossary(query=None, category=None, language="hi")
    assert res_all.total >= 15

    # Filter category
    res_cat = await get_glossary(query=None, category="Banking & UPI", language="hi")
    assert res_cat.total >= 1

    # Get single term
    res_term = await get_glossary_term(term_id="e_shram")
    assert res_term.term_id == "e_shram"

@pytest.mark.asyncio
async def test_router_number_to_words():
    req = NumberToWordsRequest(
        amount=3450.50,
        currency="INR",
        language="hi",
        include_paise=True
    )
    res = await number_to_words(req)
    assert "₹3,450.50" in res.formatted_amount
    assert "हज़ार" in res.spoken_text

@pytest.mark.asyncio
async def test_router_tts_config():
    req = TTSConfigRequest(
        text="चेतावनी: किसी को भी अपना यूपीआई पिन न बताएं।",
        language="hi",
        speaking_rate=0.9
    )
    res = await get_tts_config(req)
    assert "<speak" in res.ssml
    assert res.browser_speech_config["lang"] == "hi-IN"

@pytest.mark.asyncio
async def test_router_transliterate():
    req = TransliterationRequest(
        text="Swiggy ka paisa kab aayega",
        target_script="Deva",
        target_lang="hi"
    )
    res = await transliterate(req)
    assert "पैसा" in res.transliterated_text

@pytest.mark.asyncio
async def test_router_profile_adapt_ui():
    profile = AccessibilityProfile(
        user_id="rajesh_01",
        preferred_language="hi",
        font_scale=1.2,
        high_contrast=True,
        screen_reader_mode=False
    )
    res = await adapt_ui(profile)
    assert res.css_theme_vars["--ns-bg-primary"] == "#000000"

@pytest.mark.asyncio
async def test_router_clear_cache():
    res = await clear_cache()
    assert res["status"] == "success"
