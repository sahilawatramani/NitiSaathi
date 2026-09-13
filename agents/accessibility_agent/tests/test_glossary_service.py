"""
Unit and integration tests for Accessibility Agent Glossary Service and API Endpoints.
"""
import pytest
from fastapi.testclient import TestClient

from agents.accessibility_agent.main import app
from agents.accessibility_agent.services.glossary_service import GlossaryService


@pytest.fixture
def glossary_service():
    return GlossaryService()


@pytest.fixture
def client():
    return TestClient(app)


def test_glossary_initialization(glossary_service):
    """Ensure all 18 curated terms are loaded."""
    terms = glossary_service.get_all_terms()
    assert len(terms) == 18
    term_ids = [t.term_id for t in terms]
    assert "e_shram" in term_ids
    assert "pmsby" in term_ids
    assert "pm_sym" in term_ids
    assert "apy" in term_ids


def test_glossary_term_localized_hindi(glossary_service):
    """Ensure default/explicit Hindi projection works correctly."""
    term_hi = glossary_service.get_term_by_id("e_shram", target_lang="hi")
    assert term_hi is not None
    assert term_hi.language == "hi"
    assert "ई-श्रम" in term_hi.term
    assert "असंगठित" in term_hi.simplified_definition or "श्रमिक" in term_hi.simplified_definition


def test_glossary_term_localized_marathi(glossary_service):
    """Ensure Marathi projection returns authentic Marathi definitions."""
    term_mr = glossary_service.get_term_by_id("e_shram", target_lang="mr")
    assert term_mr is not None
    assert term_mr.language == "mr"
    assert "ई-श्रम" in term_mr.term
    assert "असंघटित" in term_mr.simplified_definition or "कामगार" in term_mr.simplified_definition

    pmsby_mr = glossary_service.get_term_by_id("pmsby", target_lang="mr")
    assert pmsby_mr is not None
    assert pmsby_mr.language == "mr"
    assert "विमा" in pmsby_mr.term or "सुरक्षा" in pmsby_mr.term


def test_glossary_term_localized_english(glossary_service):
    """Ensure English projection returns English definitions."""
    term_en = glossary_service.get_term_by_id("apy", target_lang="en")
    assert term_en is not None
    assert term_en.language == "en"
    assert "Atal Pension" in term_en.term
    assert "pension" in term_en.simplified_definition.lower()


def test_glossary_search_multilingual(glossary_service):
    """Search terms across English, Hindi, and Marathi."""
    # Search in English
    results_en = glossary_service.search_terms("pension", target_lang="en")
    assert len(results_en) >= 1
    assert any(r.term_id == "pm_sym" or r.term_id == "apy" for r in results_en)

    # Search in Hindi
    results_hi = glossary_service.search_terms("पेंशन", target_lang="hi")
    assert len(results_hi) >= 1
    assert all(r.language == "hi" for r in results_hi)

    # Search in Marathi
    results_mr = glossary_service.search_terms("विमा", target_lang="mr")
    assert len(results_mr) >= 1
    assert all(r.language == "mr" for r in results_mr)


def test_glossary_category_filter(glossary_service):
    """Filter terms by category."""
    schemes = glossary_service.search_terms(query="", category="Government Schemes", target_lang="hi")
    assert len(schemes) >= 4
    assert all(s.category == "Government Schemes" for s in schemes)


def test_glossary_api_endpoints(client):
    """Test FastAPI glossary endpoints via TestClient."""
    # List endpoint
    res_list = client.get("/api/v1/accessibility/glossary?target_lang=mr")
    assert res_list.status_code == 200
    data_list = res_list.json()
    assert data_list["total"] == 18
    assert data_list["target_lang"] == "mr"
    assert len(data_list["terms"]) == 18
    assert data_list["terms"][0]["language"] == "mr"

    # Detail endpoint single language
    res_detail = client.get("/api/v1/accessibility/glossary/pmjjby?target_lang=hi")
    assert res_detail.status_code == 200
    detail = res_detail.json()
    assert detail["term_id"] == "pmjjby"
    assert detail["language"] == "hi"

    # Detail endpoint full bundle
    res_all = client.get("/api/v1/accessibility/glossary/pmjjby?all=true")
    assert res_all.status_code == 200
    detail_all = res_all.json()
    assert "translations" in detail_all
    assert "en" in detail_all["translations"]
    assert "hi" in detail_all["translations"]
    assert "mr" in detail_all["translations"]
