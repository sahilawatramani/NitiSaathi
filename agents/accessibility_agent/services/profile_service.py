"""
Accessibility Profile & UI Accommodation Service.
"""
from typing import Dict, Any
from ..models.schemas import AccessibilityProfile, AccessibilityAdaptationResponse

class AccessibilityProfileService:
    """Service to compute UI styling tokens and ARIA accommodations based on user accessibility profile."""

    def adapt_ui_for_profile(self, profile: AccessibilityProfile) -> AccessibilityAdaptationResponse:
        """Generate CSS variables, ARIA tags, and reading mode settings."""
        css_vars: Dict[str, str] = {
            "--ns-font-scale": str(profile.font_scale),
            "--ns-base-font-size": f"{16 * profile.font_scale}px",
            "--ns-touch-target-size": "48px" if profile.font_scale > 1.2 or profile.screen_reader_mode else "40px",
            "--ns-line-height": "1.6" if profile.font_scale > 1.0 else "1.4",
        }

        if profile.high_contrast:
            css_vars.update({
                "--ns-bg-primary": "#000000",
                "--ns-bg-surface": "#121212",
                "--ns-text-primary": "#FFFFFF",
                "--ns-text-secondary": "#FFFF00",
                "--ns-accent": "#00FFFF",
                "--ns-border-color": "#FFFFFF",
                "--ns-focus-ring": "3px solid #00FFFF"
            })
        else:
            css_vars.update({
                "--ns-bg-primary": "#F8FAFC",
                "--ns-bg-surface": "#FFFFFF",
                "--ns-text-primary": "#0F172A",
                "--ns-text-secondary": "#475569",
                "--ns-accent": "#2563EB",
                "--ns-border-color": "#E2E8F0",
                "--ns-focus-ring": "2px solid #2563EB"
            })

        # Color blindness filters
        if profile.color_blindness_filter == "protanopia":
            css_vars["--ns-color-filter"] = "url(#protanopia-filter)"
        elif profile.color_blindness_filter == "deuteranopia":
            css_vars["--ns-color-filter"] = "url(#deuteranopia-filter)"
        elif profile.color_blindness_filter == "tritanopia":
            css_vars["--ns-color-filter"] = "url(#tritanopia-filter)"
        else:
            css_vars["--ns-color-filter"] = "none"

        aria_tags = {
            "role_region": "main",
            "aria_live": "assertive" if profile.screen_reader_mode else "polite",
            "aria_atomic": "true",
            "screen_reader_voice_rate": str(profile.voice_speed)
        }

        reading_mode = "large_text" if profile.font_scale >= 1.3 else ("screen_reader" if profile.screen_reader_mode else "standard")

        return AccessibilityAdaptationResponse(
            profile=profile,
            css_theme_vars=css_vars,
            aria_helper_tags=aria_tags,
            recommended_reading_mode=reading_mode,
            audio_guidance_enabled=profile.auto_speak_responses or profile.screen_reader_mode
        )

_profile_instance = None

def get_profile_service() -> AccessibilityProfileService:
    global _profile_instance
    if _profile_instance is None:
        _profile_instance = AccessibilityProfileService()
    return _profile_instance
