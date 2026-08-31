"""
FastAPI router for Scheme Agent endpoints
"""
from fastapi import APIRouter, HTTPException, Depends
from typing import Optional
from datetime import datetime

from ..models.schemas import (
    UserProfile,
    BudgetAgentState,
    SchemeRecommendation,
    EligibilityResult,
    AffordabilityAnalysis,
    SchemeUpdateCheck
)
from ..services.eligibility_engine import SchemeEligibilityEngine

router = APIRouter(prefix="/api/v1/schemes", tags=["Scheme Agent"])

# Initialize engine (in production, use dependency injection)
engine = SchemeEligibilityEngine()


@router.post("/check-eligibility", response_model=SchemeRecommendation)
async def check_scheme_eligibility(
    user_profile: UserProfile,
    budget_state: Optional[BudgetAgentState] = None
):
    """
    Check user's eligibility for all government welfare schemes
    
    - Validates gig worker status under Code on Social Security 2020
    - Checks eligibility for e-Shram, PM-SYM, PMSBY, PMJJBY, APY, state boards
    - Performs joint reasoning with Budget Agent state for affordability
    - Returns prioritized scheme recommendations
    """
    try:
        recommendation = engine.generate_recommendation(user_profile, budget_state)
        return recommendation
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Eligibility check failed: {str(e)}")


@router.post("/check-scheme/{scheme_code}", response_model=EligibilityResult)
async def check_single_scheme(
    scheme_code: str,
    user_profile: UserProfile,
    budget_state: Optional[BudgetAgentState] = None
):
    """
    Check eligibility for a single scheme
    
    Scheme codes:
    - e_shram: e-Shram Registration
    - pm_sym: PM-SYM (Pension)
    - pmsby: PMSBY (Accident Insurance)
    - pmjjby: PMJJBY (Life Insurance)
    - apy: Atal Pension Yojana
    """
    scheme_map = {
        "e_shram": engine.check_e_shram_eligibility,
        "pm_sym": engine.check_pm_sym_eligibility,
        "pmsby": engine.check_pmsby_eligibility,
        "pmjjby": engine.check_pmjjby_eligibility,
        "apy": engine.check_apy_eligibility
    }
    
    if scheme_code not in scheme_map:
        raise HTTPException(status_code=404, detail=f"Scheme '{scheme_code}' not found")
    
    try:
        check_func = scheme_map[scheme_code]
        if scheme_code in ["pm_sym", "pmsby", "apy"] and budget_state:
            result = check_func(user_profile, budget_state)
        else:
            result = check_func(user_profile)
        
        return result
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
    Analyze affordability of a specific scheme contribution
    
    - Uses Budget Agent state (WMA, volatility, savings rate)
    - Computes available savings vs required contribution
    - Provides stability recommendation
    - Lists risk factors
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
    Check if scheme data is stale and needs updating
    
    - Compares last_verified dates against threshold
    - Flags schemes needing update
    - Returns recommendation
    
    Default threshold: 90 days
    """
    try:
        freshness_check = engine.check_data_freshness(staleness_threshold_days)
        return {
            "check_timestamp": freshness_check["check_timestamp"],
            "schemes_checked": freshness_check["schemes_checked"],
            "stale_schemes": freshness_check["stale_schemes"],
            "stale_schemes_count": len(freshness_check["stale_schemes"]),
            "all_fresh": freshness_check["all_fresh"],
            "next_check_due": None,  # Optional field
            "recommendation": freshness_check.get("recommendation", "")
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Freshness check failed: {str(e)}")


@router.get("/schemes/list")
async def list_available_schemes():
    """
    List all available schemes with metadata
    """
    schemes_list = []
    for scheme_key, scheme_data in engine.schemes.items():
        if isinstance(scheme_data, dict) and "full_name" in scheme_data:
            schemes_list.append({
                "scheme_code": scheme_key,
                "full_name": scheme_data["full_name"],
                "scheme_id": scheme_data.get("scheme_code"),
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
        "version": "1.0.0",
        "knowledge_base_last_updated": engine.last_updated,
        "total_schemes": len(engine.schemes)
    }
