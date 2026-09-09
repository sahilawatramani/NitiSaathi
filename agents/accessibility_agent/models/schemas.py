"""
Pydantic schemas for the Accessibility Agent.
"""
from typing import List, Dict, Optional, Any
from pydantic import BaseModel, Field

# ── Translation Schemas ──────────────────────────────────────────────────

class TranslationRequest(BaseModel):
    """Request model for translating text."""
    text: str = Field(..., description="Text or sentence to translate", min_length=1)
    source_lang: Optional[str] = Field(default="en", description="Source language code (e.g., 'en', 'hi', 'auto')")
    target_lang: str = Field(default="hi", description="Target language code (e.g., 'hi', 'mr', 'ta', 'te', 'en')")
    preserve_financial_tokens: bool = Field(
        default=True, 
        description="Preserve currency symbols (₹), numbers, dates, and scheme abbreviations"
    )

class TranslationResponse(BaseModel):
    """Response model for translation."""
    original_text: str
    translated_text: str
    source_lang: str
    target_lang: str
    preserved_tokens: List[str] = Field(default_factory=list)
    provider: str = Field(default="google_translate_api", description="Translation engine used (google_api or offline_glossary)")
    cached: bool = False

# ── Word-to-Word & Phrase Translation Schemas ────────────────────────────

class WordToWordRequest(BaseModel):
    """Request model for word-to-word translation with contextual glossary."""
    text: str = Field(..., description="Sentence or phrase for word-to-word breakdown", min_length=1)
    source_lang: Optional[str] = Field(default="en", description="Source language code")
    target_lang: str = Field(default="hi", description="Target language code")

class WordItem(BaseModel):
    """Individual word breakdown item."""
    original_word: str
    translated_word: str
    is_financial_term: bool = False
    simplified_meaning: Optional[str] = None
    phonetic: Optional[str] = None
    gig_context_note: Optional[str] = None

class WordToWordResponse(BaseModel):
    """Response model containing word-by-word alignment and glossary mapping."""
    original_text: str
    full_translation: str
    source_lang: str
    target_lang: str
    words: List[WordItem]
    financial_terms_identified: List[str] = Field(default_factory=list)

# ── Glossary Schemas ─────────────────────────────────────────────────────

class GlossaryTerm(BaseModel):
    """Financial/Scheme glossary term."""
    term_id: str
    term_en: str
    term_hi: str
    category: str
    simplified_definition_en: str
    simplified_definition_hi: str
    gig_context_example_en: str
    gig_context_example_hi: str
    phonetic_hi: Optional[str] = None
    alternatives: List[str] = Field(default_factory=list)

class GlossaryQuery(BaseModel):
    """Query model for searching terms."""
    query: Optional[str] = None
    category: Optional[str] = None
    language: Optional[str] = "hi"

class GlossaryListResponse(BaseModel):
    """List of glossary terms."""
    total: int
    terms: List[GlossaryTerm]

# ── Number to Words & Spoken Currency Schemas ────────────────────────────

class NumberToWordsRequest(BaseModel):
    """Request to convert currency/numbers into spoken regional words."""
    amount: float = Field(..., description="Numerical amount (e.g. 2450.50)")
    currency: str = Field(default="INR", description="Currency code (INR)")
    language: str = Field(default="hi", description="Language for spoken verbalization ('hi', 'en', 'mr', etc.)")
    include_paise: bool = Field(default=True, description="Whether to include fraction/paise in verbalization")

class NumberToWordsResponse(BaseModel):
    """Response with spoken verbalization of numbers."""
    amount: float
    currency: str
    formatted_amount: str
    spoken_text: str
    language: str
    short_vernacular: str

# ── TTS (Text-to-Speech) Configuration Schemas ───────────────────────────

class TTSConfigRequest(BaseModel):
    """Request to generate optimal TTS and SSML settings."""
    text: str = Field(..., description="Text to be spoken")
    language: str = Field(default="hi", description="Voice language code")
    speaking_rate: Optional[float] = Field(default=0.9, description="Speaking rate (0.5 to 1.5, default 0.9 for clarity)")
    pitch: Optional[float] = Field(default=0.0, description="Pitch adjustment")
    enhance_financial_pauses: bool = Field(default=True, description="Add SSML pauses after amounts and warnings")

class TTSConfigResponse(BaseModel):
    """Response with Web Speech API and SSML configurations."""
    text: str
    language_code: str
    speaking_rate: float
    pitch: float
    ssml: str
    browser_speech_config: Dict[str, Any]

# ── Transliteration Schemas ──────────────────────────────────────────────

class TransliterationRequest(BaseModel):
    """Request for transliterating Romanized Indic text (Hinglish)."""
    text: str = Field(..., description="Text in Roman script (e.g., 'Swiggy ka paisa kab aayega')")
    source_script: str = Field(default="Latn", description="Source script (Latin/Roman)")
    target_script: str = Field(default="Deva", description="Target script (Devanagari/Deva)")
    target_lang: str = Field(default="hi", description="Target language ('hi', 'mr', etc.)")

class TransliterationResponse(BaseModel):
    """Response for transliteration."""
    original_text: str
    transliterated_text: str
    normalized_english: Optional[str] = None
    identified_intent_hint: Optional[str] = None

# ── Accessibility Profile & UI Adaptations ───────────────────────────────

class AccessibilityProfile(BaseModel):
    """User accessibility preferences."""
    user_id: Optional[str] = "guest"
    preferred_language: str = "hi"
    font_scale: float = Field(default=1.0, ge=0.8, le=2.0)
    high_contrast: bool = False
    screen_reader_mode: bool = False
    voice_speed: float = Field(default=0.9, ge=0.5, le=1.5)
    auto_speak_responses: bool = False
    show_word_glossary_tooltips: bool = True
    color_blindness_filter: Optional[str] = Field(default="none", description="'none', 'protanopia', 'deuteranopia', 'tritanopia'")

class AccessibilityAdaptationResponse(BaseModel):
    """UI Accommodations and ARIA enhancements."""
    profile: AccessibilityProfile
    css_theme_vars: Dict[str, str]
    aria_helper_tags: Dict[str, str]
    recommended_reading_mode: str
    audio_guidance_enabled: bool

# ── Health Schema ────────────────────────────────────────────────────────

class AccessibilityHealthResponse(BaseModel):
    """Health check response."""
    status: str
    agent: str
    version: str
    google_api_configured: bool
    glossary_terms_count: int
    cached_translations_count: int
    supported_languages: Dict[str, str]
