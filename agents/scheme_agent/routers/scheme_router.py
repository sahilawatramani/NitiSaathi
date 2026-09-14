"""
FastAPI router for Scheme Agent endpoints
"""
import asyncio
from fastapi import APIRouter, HTTPException, BackgroundTasks, Body
from typing import Optional, List
from datetime import datetime

from ..models.schemas import (
    UserProfile,
    BudgetAgentState,
    SchemeRecommendation,
    EligibilityResult,
    AffordabilityAnalysis,
    SchemeCategory,
    SchemeSearchRequest,
    SchemeElaboration,
)
from ..services.eligibility_engine import SchemeEligibilityEngine
from ..services.portal_scraper import portal_scraper_service

router = APIRouter(prefix="/api/v1/schemes", tags=["Scheme Agent"])

# Initialize engine with curated knowledge base
engine = SchemeEligibilityEngine()


@router.get("/categories", response_model=List[SchemeCategory])
async def get_categories():
    """
    Get all welfare sections / categories with scheme counts.
    """
    return engine.get_categories()


@router.post("/check-eligibility", response_model=SchemeRecommendation)
async def check_scheme_eligibility(
    user_profile: UserProfile,
    budget_state: Optional[BudgetAgentState] = None
):
    """
    Check user's eligibility for all government welfare schemes
    
    - Validates gig worker status under Code on Social Security 2020
    - Checks eligibility across curated government schemes
    - Performs joint reasoning with Budget Agent state for affordability
    - Computes weighted match scores (0-100%)
    - Returns prioritized scheme recommendations
    """
    try:
        recommendation = engine.generate_recommendation(user_profile, budget_state)
        return recommendation
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Eligibility check failed: {str(e)}")


@router.post("/filter", response_model=SchemeRecommendation)
async def filter_schemes(request: SchemeSearchRequest):
    """
    Search and filter schemes by category sections and keywords.
    """
    try:
        user = request.user_profile or UserProfile()
        budget = request.budget_state
        return engine.generate_recommendation(
            user=user,
            budget_state=budget,
            selected_categories=request.selected_categories,
            keywords=request.keywords,
            query=request.query,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Scheme filtering failed: {str(e)}")


@router.post("/elaborate/{scheme_code}", response_model=SchemeElaboration)
async def elaborate_scheme_for_user(
    scheme_code: str,
    user_profile: UserProfile = Body(default_factory=UserProfile),
    budget_state: Optional[BudgetAgentState] = None
):
    """
    Return comprehensive, personalized elaboration dossier for a specific scheme.
    Includes:
    - Personalized criteria breakdown (green checks / red blockers)
    - Match score percentage
    - Required documents checklist
    - Step-by-step application instructions
    - Verified official portal application URL
    - Joint budget affordability check against income volatility
    """
    try:
        elaboration = engine.elaborate_scheme(scheme_code, user_profile, budget_state)
        return elaboration
    except ValueError as ve:
        raise HTTPException(status_code=404, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Scheme elaboration failed: {str(e)}")


@router.get("/details/{scheme_code}")
async def get_scheme_details(scheme_code: str):
    """
    Get raw scheme metadata from the curated knowledge base.
    """
    for key, s in engine.schemes.items():
        if key == scheme_code or s.get("scheme_code", "").lower() == scheme_code.lower():
            return s
    raise HTTPException(status_code=404, detail=f"Scheme '{scheme_code}' not found")


@router.post("/scrape-now")
async def trigger_portal_scraper(background_tasks: BackgroundTasks):
    """
    Trigger the offline portal scraper as a background enrichment task.
    Does not block the request, writes safely to staging file only.
    """
    background_tasks.add_task(portal_scraper_service.run_batch_scrape)
    return {
        "status": "queued",
        "message": "Offline portal scraping job initiated in background. Results will be saved to staging file for review.",
        "staging_destination": str(portal_scraper_service.staging_path),
        "target_portals_count": 6
    }


@router.get("/scrape-status")
async def get_scraper_status():
    """
    Check the status and results of the last portal scraping run.
    """
    return portal_scraper_service.last_scrape_status


@router.post("/check-scheme/{scheme_code}", response_model=EligibilityResult)
async def check_single_scheme(
    scheme_code: str,
    user_profile: UserProfile,
    budget_state: Optional[BudgetAgentState] = None
):
    """
    Check eligibility for a single scheme.
    """
    try:
        return engine.check_scheme_eligibility(scheme_code, user_profile, budget_state)
    except ValueError as ve:
        raise HTTPException(status_code=404, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Scheme check failed: {str(e)}")


@router.post("/analyze-affordability", response_model=AffordabilityAnalysis)
async def analyze_scheme_affordability(
    scheme_code: str,
    contribution: float,
    frequency: str,
    user_age: int,
    budget_state: BudgetAgentState
):
    """
    Analyze affordability of a specific scheme contribution.
    """
    if frequency not in ["monthly", "annual"]:
        raise HTTPException(status_code=400, detail="Frequency must be 'monthly' or 'annual'")

    try:
        analysis = engine.analyze_affordability(
            scheme_code=scheme_code,
            contribution=contribution,
            frequency=frequency,
            budget_state=budget_state,
            user_age=user_age
        )
        return analysis
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Affordability analysis failed: {str(e)}")


@router.get("/check-data-freshness")
async def check_scheme_data_freshness(staleness_threshold_days: int = 90):
    """
    Check if scheme data is stale and needs updating.
    """
    try:
        freshness_check = engine.check_data_freshness(staleness_threshold_days)
        return {
            "check_timestamp": freshness_check["check_timestamp"],
            "schemes_checked": freshness_check["schemes_checked"],
            "stale_schemes": freshness_check["stale_schemes"],
            "stale_schemes_count": len(freshness_check["stale_schemes"]),
            "all_fresh": freshness_check["all_fresh"],
            "next_check_due": None,
            "recommendation": freshness_check.get("recommendation", "")
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Freshness check failed: {str(e)}")


@router.get("/schemes/list")
async def list_available_schemes():
    """
    List all available schemes with metadata.
    """
    schemes_list = []
    for scheme_key, scheme_data in engine.schemes.items():
        if isinstance(scheme_data, dict) and "full_name" in scheme_data:
            schemes_list.append({
                "scheme_code": scheme_key,
                "full_name": scheme_data["full_name"],
                "scheme_id": scheme_data.get("scheme_code"),
                "category": scheme_data.get("category", "insurance_healthcare"),
                "official_portal_url": scheme_data.get("official_portal_url"),
                "last_verified": scheme_data.get("last_verified"),
                "ministry": scheme_data.get("ministry", "N/A"),
                "target_group": scheme_data.get("target_group", "N/A")
            })

    return {
        "total_schemes": len(schemes_list),
        "last_updated": engine.last_updated,
        "schemes": schemes_list
    }


@router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "agent": "Scheme Agent",
        "version": "2.0.0",
        "knowledge_base_last_updated": engine.last_updated,
        "total_schemes": len(engine.schemes),
        "categories_count": len(engine.categories_raw)
    }
