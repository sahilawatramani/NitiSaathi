"""
Financial & Welfare Scheme Glossary Service for Gig Workers.
Provides localized term definitions in English (en), Hindi (hi), and Marathi (mr).
"""
import os
import json
import logging
from pathlib import Path
from typing import List, Optional, Dict, Any, Union

from ..models.schemas import (
    GlossaryTerm,
    GlossaryTermLocalized,
    GlossaryTermSingle,
)

logger = logging.getLogger(__name__)


class GlossaryService:
    """Service to load, index, and query the financial and welfare scheme glossary."""

    def __init__(self, data_path: Optional[str] = None):
        if data_path:
            self.data_path = Path(data_path)
        else:
            self.data_path = Path(__file__).resolve().parent.parent / "data" / "financial_glossary.json"

        self.terms: List[GlossaryTerm] = []
        self._term_lookup: Dict[str, GlossaryTerm] = {}
        self._categories: List[str] = []
        self._load_glossary()

    def _load_glossary(self) -> None:
        """Load glossary JSON from disk and build fast lookup indices."""
        try:
            if not self.data_path.exists():
                logger.warning(f"Glossary file not found at {self.data_path}")
                return

            with open(self.data_path, "r", encoding="utf-8") as f:
                data = json.load(f)

            self._categories = data.get("categories", [])
            raw_terms = data.get("terms", [])

            self.terms = [GlossaryTerm(**item) for item in raw_terms]
            self._build_indices()
            logger.info(f"Loaded {len(self.terms)} glossary terms across {len(self._categories)} categories.")
        except Exception as e:
            logger.error(f"Failed to load glossary from {self.data_path}: {e}")

    def _build_indices(self) -> None:
        """Build normalized lookup maps for terms, localized names, and aliases."""
        self._term_lookup.clear()
        for term in self.terms:
            keys = [term.term_id.lower()]
            for lang, loc in term.translations.items():
                keys.append(loc.term.lower())
                keys.append(loc.term.lower().split("(")[0].strip())
            for alt in term.alternatives:
                keys.append(alt.lower())

            for k in set(keys):
                if k:
                    self._term_lookup[k] = term

    def localize_term(self, term: GlossaryTerm, target_lang: str = "hi") -> GlossaryTermSingle:
        """Project a GlossaryTerm into a single localized GlossaryTermSingle."""
        lang = target_lang if target_lang in term.translations else ("hi" if "hi" in term.translations else "en")
        loc = term.translations.get(lang) or next(iter(term.translations.values()))
        return GlossaryTermSingle(
            term_id=term.term_id,
            category=term.category,
            language=lang,
            term=loc.term,
            simplified_definition=loc.simplified_definition,
            gig_context_example=loc.gig_context_example,
            phonetic=loc.phonetic,
            alternatives=term.alternatives,
        )

    def get_all_terms(
        self,
        category: Optional[str] = None,
        target_lang: str = "hi",
        all_langs: bool = False,
    ) -> Union[List[GlossaryTermSingle], List[GlossaryTerm]]:
        """Retrieve all terms, optionally filtered by category and localized."""
        filtered = [t for t in self.terms if not category or t.category.lower() == category.lower()]
        if all_langs:
            return filtered
        return [self.localize_term(t, target_lang) for t in filtered]

    def get_categories(self) -> List[str]:
        """Return list of distinct categories."""
        return self._categories

    def find_term(self, word_or_phrase: str) -> Optional[GlossaryTerm]:
        """Exact or normalized lookup for a single word or phrase."""
        if not word_or_phrase:
            return None
        norm = word_or_phrase.strip().lower()
        if norm in self._term_lookup:
            return self._term_lookup[norm]

        cleaned = "".join(ch for ch in norm if ch.isalnum() or ch in ("-", "_", " ")).strip()
        if cleaned in self._term_lookup:
            return self._term_lookup[cleaned]

        return None

    def search_terms(
        self,
        query: str,
        target_lang: str = "hi",
        category: Optional[str] = None,
        all_langs: bool = False,
    ) -> Union[List[GlossaryTermSingle], List[GlossaryTerm]]:
        """Search glossary terms matching query string across all language fields."""
        if not query or not query.strip():
            return self.get_all_terms(category=category, target_lang=target_lang, all_langs=all_langs)

        q = query.strip().lower()
        matched: List[GlossaryTerm] = []

        for term in self.terms:
            if category and term.category.lower() != category.lower():
                continue

            matches = any(
                q in loc.term.lower() or q in loc.simplified_definition.lower() or q in loc.gig_context_example.lower()
                for loc in term.translations.values()
            ) or any(q in alt.lower() for alt in term.alternatives) or q in term.term_id.lower()

            if matches:
                matched.append(term)

        if all_langs:
            return matched
        return [self.localize_term(t, target_lang) for t in matched]

    def get_term_by_id(
        self,
        term_id: str,
        target_lang: str = "hi",
        all_langs: bool = False,
    ) -> Optional[Union[GlossaryTermSingle, GlossaryTerm]]:
        """Lookup term by unique term_id."""
        for term in self.terms:
            if term.term_id == term_id:
                return term if all_langs else self.localize_term(term, target_lang)
        
        # Try lookup by alias/name
        found = self.find_term(term_id)
        if found:
            return found if all_langs else self.localize_term(found, target_lang)
        return None


_glossary_instance = None


def get_glossary_service() -> GlossaryService:
    global _glossary_instance
    if _glossary_instance is None:
        _glossary_instance = GlossaryService()
    return _glossary_instance
