"""schemas.py — Pydantic models for Literacy Agent request/response."""

from pydantic import BaseModel, Field
from typing import Literal, Optional


class RewriteRequest(BaseModel):
    """Incoming text to be rewritten by the Literacy Agent."""

    text: str = Field(
        ...,
        description="The raw system/agent output text to simplify.",
        min_length=1,
    )
    literacy_level: str = Field(
        default="medium",
        description="Target literacy level: low | medium | high.",
        pattern="^(low|medium|high)$",
    )
    language_pref: Literal["hi", "en", "mr"] = Field(
        default="en", description="Output language: hi | en | mr."
    )
    has_financial_content: bool = Field(
        default=False,
        description="True if the text contains financial or scheme advice "
        "(triggers mandatory advisory disclaimer).",
    )
    has_scheme_content: bool = Field(
        default=False,
        description="True if the text contains government scheme information "
        "(triggers mandatory advisory disclaimer).",
    )


class RewriteResponse(BaseModel):
    """Literacy Agent output."""

    original_text: str = Field(
        ..., description="The original input text (for comparison / logging)."
    )
    rewritten_text: str = Field(
        ..., description="The simplified, literacy-level-appropriate output."
    )
    literacy_level: str = Field(
        ..., description="The literacy level that was applied."
    )
    language_pref: str = Field(..., description="Language used for the output.")
    disclaimer_added: bool = Field(
        ..., description="Whether the advisory disclaimer was appended."
    )
