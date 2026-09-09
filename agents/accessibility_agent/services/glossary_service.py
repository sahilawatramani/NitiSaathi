"""
Financial & Welfare Scheme Glossary Service for Gig Workers.
"""
import os
import json
import logging
from pathlib import Path
from typing import List, Optional, Dict, Any

from ..models.schemas import GlossaryTerm

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
        """Build normalized lookup maps for terms, Hindi names, and aliases."""
        self._term_lookup.clear()
        for term in self.terms:
            keys = [
                term.term_id.lower(),
                term.term_en.lower(),
                term.term_hi.lower(),
            ]
            # Strip punctuation/parentheses
            keys.append(term.term_en.lower().split('(')[0].strip())
            keys.append(term.term_hi.lower().split('(')[0].strip())
            for alt in term.alternatives:
                keys.append(alt.lower())

            for k in set(keys):
                if k:
                    self._term_lookup[k] = term

    def get_all_terms(self, category: Optional[str] = None) -> List[GlossaryTerm]:
        """Retrieve all terms, optionally filtered by category."""
        if category:
            return [t for t in self.terms if t.category.lower() == category.lower()]
        return self.terms

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

        # Clean non-alphanumerics except hyphen
        cleaned = ''.join(ch for ch in norm if ch.isalnum() or ch in ('-', '_', ' ')).strip()
        if cleaned in self._term_lookup:
            return self._term_lookup[cleaned]

        return None

    def search_terms(self, query: str, language: str = "hi", category: Optional[str] = None) -> List[GlossaryTerm]:
        """Search glossary terms matching query string across English and Hindi fields."""
        if not query or not query.strip():
            return self.get_all_terms(category)

        q = query.strip().lower()
        results: List[GlossaryTerm] = []

        for term in self.terms:
            if category and term.category.lower() != category.lower():
                continue

            # Check match in name, definitions, or aliases
            matches = (
                q in term.term_en.lower()
                or q in term.term_hi.lower()
                or q in term.simplified_definition_en.lower()
                or q in term.simplified_definition_hi.lower()
                or any(q in alt.lower() for alt in term.alternatives)
            )
            if matches:
                results.append(term)

        return results

    def get_term_by_id(self, term_id: str) -> Optional[GlossaryTerm]:
        """Lookup term by unique term_id."""
        for term in self.terms:
            if term.term_id == term_id:
                return term
        return None

_glossary_instance = None

def get_glossary_service() -> GlossaryService:
    global _glossary_instance
    if _glossary_instance is None:
        _glossary_instance = GlossaryService()
    return _glossary_instance
