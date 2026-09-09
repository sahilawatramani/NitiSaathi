"""
Scheme Agent Eligibility Engine

Core logic for rule-based eligibility checking and joint affordability reasoning
"""
import json
from datetime import date, datetime
from pathlib import Path
from typing import Dict, List, Tuple
from ..models.schemas import (
    UserProfile,
    BudgetAgentState,
    EligibilityResult,
    SchemeRecommendation,
    AffordabilityAnalysis
)


class SchemeEligibilityEngine:
    """
    Rule-based eligibility engine for government welfare schemes
    """
    
    def __init__(self, knowledge_base_path: str = None):
        """Load scheme knowledge base"""
        if knowledge_base_path is None:
            kb_path = Path(__file__).parent.parent / "data" / "schemes_kb.json"
        else:
            kb_path = Path(knowledge_base_path)
        
        with open(kb_path, 'r', encoding='utf-8') as f:
            self.knowledge_base = json.load(f)
        
        self.schemes = self.knowledge_base["schemes"]
        self.last_updated = self.knowledge_base["last_updated"]
    
    def check_gig_worker_status(self, user: UserProfile) -> Tuple[bool, str]:
        """
        Check if user qualifies as gig worker under Code on Social Security 2020
        
        Returns:
            (is_eligible, status_description)
        """
        days_active = user.days_active_with_aggregator
        
        # Option 1: 90+ days on single platform
        if days_active >= 90:
            return True, f"Eligible: {days_active} days active (≥90 days threshold met)"
        
        # Option 2: 120+ days across multiple platforms (synthetic data simplification: single field)
        # In production, would check aggregators list and sum days
        if days_active >= 120:
            return True, f"Eligible: {days_active} days active (≥120 days multi-platform threshold met)"
        
        # Not eligible yet
        days_remaining = 90 - days_active
        return False, f"Not eligible: {days_active} days active. Need {days_remaining} more days to reach 90-day threshold."
    
    def check_e_shram_eligibility(self, user: UserProfile) -> EligibilityResult:
        """Check e-Shram eligibility"""
        scheme = self.schemes["e_shram"]
        eligibility = scheme["eligibility"]
        reasons = []
        blocking_factors = []
        
        # Age check
        if eligibility["age_min"] <= user.age <= eligibility["age_max"]:
            reasons.append(f"✓ Age {user.age} is within range {eligibility['age_min']}-{eligibility['age_max']}")
        else:
            blocking_factors.append(f"✗ Age {user.age} outside range {eligibility['age_min']}-{eligibility['age_max']}")
        
        # EPFO/ESIC check
        if not user.epfo_esic_status:
            reasons.append("✓ Not registered with EPFO/ESIC")
        else:
            blocking_factors.append("✗ Already registered with EPFO/ESIC (blocks eligibility)")
        
        # Income tax check
        if not user.income_tax_payer:
            reasons.append("✓ Not an income tax payer")
        else:
            blocking_factors.append("✗ Income tax payer (blocks eligibility)")
        
        eligible = len(blocking_factors) == 0
        all_reasons = reasons + blocking_factors
        
        return EligibilityResult(
            scheme_code="ESHRAM_001",
            scheme_name=scheme["full_name"],
            eligible=eligible,
            eligibility_status="eligible" if eligible else "not_eligible",
            reasons=all_reasons,
            last_verified=date.fromisoformat(scheme["last_verified"]),
            data_freshness=self._compute_freshness(scheme["last_verified"]),
            pending_requirements=["Complete registration at eshram.gov.in with Aadhaar and bank account"] if eligible else None,
            contribution_required=0.0,  # Free registration
            affordable=True if eligible else None
        )
    
    def check_pm_sym_eligibility(self, user: UserProfile, budget_state: BudgetAgentState = None) -> EligibilityResult:
        """Check PM-SYM eligibility with joint affordability reasoning"""
        scheme = self.schemes["pm_sym"]
        eligibility = scheme["eligibility"]
        reasons = []
        blocking_factors = []
        
        # Age check
        if eligibility["age_min"] <= user.age <= eligibility["age_max"]:
            reasons.append(f"✓ Age {user.age} is within range {eligibility['age_min']}-{eligibility['age_max']}")
        else:
            blocking_factors.append(f"✗ Age {user.age} outside range {eligibility['age_min']}-{eligibility['age_max']}")
        
        # Income check
        if user.monthly_income and user.monthly_income <= eligibility["monthly_income_max"]:
            reasons.append(f"✓ Monthly income ₹{user.monthly_income:,.0f} < ₹{eligibility['monthly_income_max']:,}")
        elif user.monthly_income and user.monthly_income > eligibility["monthly_income_max"]:
            blocking_factors.append(f"✗ Monthly income ₹{user.monthly_income:,.0f} exceeds limit ₹{eligibility['monthly_income_max']:,}")
        
        # EPFO/ESIC check
        if not user.epfo_esic_status:
            reasons.append("✓ Not registered with EPFO/ESIC")
        else:
            blocking_factors.append("✗ Already registered with EPFO/ESIC")
        
        # Income tax check
        if not user.income_tax_payer:
            reasons.append("✓ Not an income tax payer")
        else:
            blocking_factors.append("✗ Income tax payer")
        
        # e-Shram prerequisite
        if user.e_shram_registered:
            reasons.append("✓ Registered on e-Shram (prerequisite met)")
        else:
            blocking_factors.append("✗ Not registered on e-Shram (prerequisite)")
        
        eligible = len(blocking_factors) == 0
        
        # Get contribution amount
        contribution = scheme["contribution_matrix"].get(str(user.age), 200)
        
        # Affordability analysis if Budget Agent state provided
        affordable = None
        affordability_reasoning = None
        if eligible and budget_state:
            affordability = self.analyze_affordability(
                scheme_code="PMSYM_001",
                contribution=contribution,
                frequency="monthly",
                budget_state=budget_state,
                user_age=user.age
            )
            affordable = affordability.affordable
            affordability_reasoning = affordability.recommendation
            
            if affordability.stability_requirement:
                reasons.append(f"⚠ {affordability.stability_requirement}")
        
        all_reasons = reasons + blocking_factors
        
        return EligibilityResult(
            scheme_code="PMSYM_001",
            scheme_name=scheme["full_name"],
            eligible=eligible,
            eligibility_status="eligible" if eligible else "not_eligible",
            reasons=all_reasons,
            last_verified=date.fromisoformat(scheme["last_verified"]),
            data_freshness=self._compute_freshness(scheme["last_verified"]),
            contribution_required=float(contribution) if eligible else None,
            affordable=affordable,
            affordability_reasoning=affordability_reasoning
        )
    
    def check_pmsby_eligibility(self, user: UserProfile, budget_state: BudgetAgentState = None) -> EligibilityResult:
        """Check PMSBY eligibility"""
        scheme = self.schemes["pmsby"]
        eligibility = scheme["eligibility"]
        reasons = []
        blocking_factors = []
        
        # Age check
        if eligibility["age_min"] <= user.age <= eligibility["age_max"]:
            reasons.append(f"✓ Age {user.age} is within range {eligibility['age_min']}-{eligibility['age_max']}")
        else:
            blocking_factors.append(f"✗ Age {user.age} outside range {eligibility['age_min']}-{eligibility['age_max']}")
        
        # Bank account check
        if user.savings_bank_account:
            reasons.append("✓ Has savings bank account")
        else:
            blocking_factors.append("✗ No savings bank account")
        
        # e-Shram prerequisite
        if user.e_shram_registered:
            reasons.append("✓ Registered on e-Shram")
        else:
            blocking_factors.append("✗ Not registered on e-Shram (prerequisite)")
        
        eligible = len(blocking_factors) == 0
        premium = scheme["premium"]["annual_amount"]
        
        # Affordability check (always affordable given ₹20 annual)
        affordable = None
        if eligible and budget_state:
            # Even with closing_balance, ₹20/year is always affordable for active gig workers
            # But check if balance will cover on debit date
            affordable = budget_state.closing_balance >= premium
            if not affordable:
                reasons.append(f"⚠ Current balance ₹{budget_state.closing_balance:.0f} < ₹{premium} premium. Top up before debit date.")
        
        all_reasons = reasons + blocking_factors
        
        return EligibilityResult(
            scheme_code="PMSBY_001",
            scheme_name=scheme["full_name"],
            eligible=eligible,
            eligibility_status="eligible" if eligible else "not_eligible",
            reasons=all_reasons,
            last_verified=date.fromisoformat(scheme["last_verified"]),
            data_freshness=self._compute_freshness(scheme["last_verified"]),
            contribution_required=float(premium) if eligible else None,
            affordable=affordable,
            affordability_reasoning=f"Annual premium ₹{premium} is affordable for active gig workers. Critical: ensure balance ≥₹{premium} on debit date to avoid lapse." if eligible else None
        )
    
    def check_pmjjby_eligibility(self, user: UserProfile) -> EligibilityResult:
        """Check PMJJBY eligibility"""
        scheme = self.schemes["pmjjby"]
        eligibility = scheme["eligibility"]
        reasons = []
        blocking_factors = []
        
        # Age check
        if eligibility["age_min"] <= user.age <= eligibility["age_max"]:
            reasons.append(f"✓ Age {user.age} is within range {eligibility['age_min']}-{eligibility['age_max']}")
        else:
            blocking_factors.append(f"✗ Age {user.age} outside range {eligibility['age_min']}-{eligibility['age_max']}")
        
        # Bank account check
        if user.savings_bank_account:
            reasons.append("✓ Has savings bank account")
        else:
            blocking_factors.append("✗ No savings bank account")
        
        eligible = len(blocking_factors) == 0
        premium = scheme["premium"]["annual_amount"]
        
        all_reasons = reasons + blocking_factors
        if eligible:
            reasons.append(f"ℹ Consider PMSBY first (₹20/year) vs PMJJBY (₹{premium}/year) - PMSBY better for high-risk occupations")
        
        return EligibilityResult(
            scheme_code="PMJJBY_001",
            scheme_name=scheme["full_name"],
            eligible=eligible,
            eligibility_status="eligible" if eligible else "not_eligible",
            reasons=all_reasons,
            last_verified=date.fromisoformat(scheme["last_verified"]),
            data_freshness=self._compute_freshness(scheme["last_verified"]),
            contribution_required=float(premium) if eligible else None
        )
    
    def check_apy_eligibility(self, user: UserProfile, budget_state: BudgetAgentState = None) -> EligibilityResult:
        """Check APY eligibility"""
        scheme = self.schemes["apy"]
        eligibility = scheme["eligibility"]
        reasons = []
        blocking_factors = []
        
        # Age check
        if eligibility["age_min"] <= user.age <= eligibility["age_max"]:
            reasons.append(f"✓ Age {user.age} is within range {eligibility['age_min']}-{eligibility['age_max']}")
        else:
            blocking_factors.append(f"✗ Age {user.age} outside range {eligibility['age_min']}-{eligibility['age_max']}")
        
        # Bank account check
        if user.savings_bank_account:
            reasons.append("✓ Has savings bank account")
        else:
            blocking_factors.append("✗ No savings bank account")
        
        # Income tax check
        if not user.income_tax_payer:
            reasons.append("✓ Not an income tax payer (eligible for govt co-contribution)")
        else:
            blocking_factors.append("✗ Income tax payer (blocks govt co-contribution)")
        
        eligible = len(blocking_factors) == 0
        
        # Note about comparison with PM-SYM
        if eligible:
            reasons.append("ℹ APY offers ₹1,000-₹5,000/month pension tiers vs PM-SYM fixed ₹3,000")
            reasons.append("ℹ Consider PM-SYM if you want simple ₹3,000 pension with lower contribution")
        
        all_reasons = reasons + blocking_factors
        
        return EligibilityResult(
            scheme_code="APY_001",
            scheme_name=scheme["full_name"],
            eligible=eligible,
            eligibility_status="eligible" if eligible else "not_eligible",
            reasons=all_reasons,
            last_verified=date.fromisoformat(scheme["last_verified"]),
            data_freshness=self._compute_freshness(scheme["last_verified"]),
            pending_requirements=["Choose pension tier (₹1,000-₹5,000/month)", "Register at bank or post office"] if eligible else None
        )
    
    def analyze_affordability(
        self,
        scheme_code: str,
        contribution: float,
        frequency: str,
        budget_state: BudgetAgentState,
        user_age: int
    ) -> AffordabilityAnalysis:
        """
        Joint reasoning with Budget Agent to determine scheme affordability
        
        Args:
            scheme_code: Scheme identifier
            contribution: Required contribution amount
            frequency: "monthly" or "annual"
            budget_state: Budget Agent financial state
            user_age: User's age for context
        
        Returns:
            AffordabilityAnalysis with recommendation
        """
        # Estimate monthly income
        monthly_income = budget_state.income_wma_4w * 4.33  # 4.33 weeks per month average
        
        # Available savings per month
        available_savings = monthly_income * budget_state.savings_rate_recommendation
        
        # Convert contribution to monthly if annual
        monthly_contribution = contribution if frequency == "monthly" else contribution / 12
        
        # Affordability check
        affordable = monthly_contribution < available_savings
        margin = available_savings - monthly_contribution
        
        # Confidence based on income volatility
        if budget_state.income_volatility_pct < 0.15:
            confidence = "high"
            stability_note = "Income is stable (low volatility)"
        elif budget_state.income_volatility_pct <= 0.30:
            confidence = "medium"
            stability_note = "Income has moderate volatility"
        else:
            confidence = "low"
            stability_note = "Income is highly volatile"
        
        # Risk factors
        risk_factors = []
        if budget_state.income_volatility_pct > 0.30:
            risk_factors.append("High income volatility may make sustained contributions difficult")
        if margin < contribution * 0.5:
            risk_factors.append("Low savings margin - one bad week could cause payment failure")
        if budget_state.financial_persona == "conservative":
            risk_factors.append("Conservative financial persona - currently in survival mode")
        
        # Recommendation
        if affordable and confidence == "high":
            recommendation = f"✓ Affordable: You can comfortably afford ₹{contribution:.0f}/{frequency}. Your savings rate of {budget_state.savings_rate_recommendation*100:.0f}% covers this with ₹{margin:.0f} margin."
            stability_requirement = None
        elif affordable and confidence == "medium":
            recommendation = f"⚠ Conditionally affordable: ₹{contribution:.0f}/{frequency} fits your budget, but income volatility is {budget_state.income_volatility_pct*100:.0f}%."
            stability_requirement = "Recommend waiting for 4 consecutive stable weeks before enabling auto-debit"
        elif affordable and confidence == "low":
            recommendation = f"⚠ Risky: While ₹{contribution:.0f}/{frequency} technically fits, your income volatility is {budget_state.income_volatility_pct*100:.0f}%. High risk of missed payments."
            stability_requirement = "Wait until income stabilizes (volatility <30%) for at least 4 weeks"
        else:
            recommendation = f"✗ Not affordable now: ₹{contribution:.0f}/{frequency} exceeds your recommended savings rate. Available: ₹{available_savings:.0f}/month, Required: ₹{monthly_contribution:.0f}/month."
            stability_requirement = f"Need income to increase by ₹{abs(margin) * 4.33:.0f}/month OR volatility to decrease below 30%"
        
        return AffordabilityAnalysis(
            scheme_code=scheme_code,
            scheme_name=self.schemes.get(scheme_code.split('_')[0].lower(), {}).get("full_name", scheme_code),
            contribution_required=contribution,
            contribution_frequency=frequency,
            monthly_income_estimate=monthly_income,
            savings_rate=budget_state.savings_rate_recommendation,
            available_savings_per_month=available_savings,
            affordable=affordable,
            margin=margin,
            confidence=confidence,
            recommendation=recommendation,
            stability_requirement=stability_requirement,
            risk_factors=risk_factors
        )
    
    def generate_recommendation(
        self,
        user: UserProfile,
        budget_state: BudgetAgentState = None
    ) -> SchemeRecommendation:
        """
        Generate comprehensive scheme recommendation for user
        """
        # Check gig worker status first
        is_gig_worker, gig_status = self.check_gig_worker_status(user)
        
        eligible_schemes = []
        ineligible_schemes = []
        conditional_schemes = []
        
        # Check each scheme
        e_shram_result = self.check_e_shram_eligibility(user)
        if e_shram_result.eligible:
            eligible_schemes.append(e_shram_result)
        else:
            ineligible_schemes.append(e_shram_result)
        
        pm_sym_result = self.check_pm_sym_eligibility(user, budget_state)
        if pm_sym_result.eligible:
            if budget_state and pm_sym_result.affordable is False:
                conditional_schemes.append(pm_sym_result)
            else:
                eligible_schemes.append(pm_sym_result)
        else:
            ineligible_schemes.append(pm_sym_result)
        
        pmsby_result = self.check_pmsby_eligibility(user, budget_state)
        if pmsby_result.eligible:
            eligible_schemes.append(pmsby_result)
        else:
            ineligible_schemes.append(pmsby_result)
        
        pmjjby_result = self.check_pmjjby_eligibility(user)
        if pmjjby_result.eligible:
            eligible_schemes.append(pmjjby_result)
        else:
            ineligible_schemes.append(pmjjby_result)
        
        apy_result = self.check_apy_eligibility(user, budget_state)
        if apy_result.eligible:
            eligible_schemes.append(apy_result)
        else:
            ineligible_schemes.append(apy_result)
        
        # Priority recommendations (ordered by importance for gig workers)
        priority = []
        if not user.e_shram_registered and e_shram_result.eligible:
            priority.append("1. Register on e-Shram (prerequisite for other schemes, free, takes 10 minutes)")
        
        if pmsby_result.eligible:
            priority.append("2. Enroll in PMSBY (₹20/year accident cover - CRITICAL for gig workers)")
        
        if pm_sym_result.eligible and (not budget_state or pm_sym_result.affordable):
            priority.append(f"3. Consider PM-SYM (₹{pm_sym_result.contribution_required}/month for ₹3,000/month pension after 60)")
        
        # Joint reasoning summary
        joint_summary = None
        if budget_state:
            joint_summary = (
                f"Based on your current financial state: "
                f"Weekly income ₹{budget_state.income_wma_4w:.0f} (volatility {budget_state.income_volatility_pct*100:.0f}%), "
                f"recommended savings rate {budget_state.savings_rate_recommendation*100:.0f}%, "
                f"current balance ₹{budget_state.closing_balance:.0f}. "
                f"Persona: {budget_state.financial_persona}."
            )
        
        return SchemeRecommendation(
            user_id=user.user_id,
            timestamp=datetime.now().isoformat(),
            gig_worker_status="eligible" if is_gig_worker else "not_eligible",
            gig_worker_days_threshold=gig_status,
            eligible_schemes=eligible_schemes,
            ineligible_schemes=ineligible_schemes,
            conditional_schemes=conditional_schemes,
            priority_recommendations=priority,
            joint_reasoning_summary=joint_summary
        )
    
    def _compute_freshness(self, last_verified_str: str) -> str:
        """Compute human-readable freshness indicator"""
        last_verified = date.fromisoformat(last_verified_str)
        today = date.today()
        days_old = (today - last_verified).days
        
        if days_old == 0:
            return "✓ Verified today"
        elif days_old <= 7:
            return f"✓ Verified {days_old} days ago"
        elif days_old <= 30:
            return f"⚠ Verified {days_old} days ago (check for updates)"
        elif days_old <= 90:
            return f"⚠ Verified {days_old} days ago (may be outdated)"
        else:
            return f"✗ STALE: Verified {days_old} days ago (REQUIRES UPDATE)"
    
    def check_data_freshness(self, staleness_threshold_days: int = 90) -> Dict:
        """
        Check if scheme data is stale and needs updating
        
        Args:
            staleness_threshold_days: Days after which data is considered stale
        
        Returns:
            Dict with stale schemes and recommendation to update
        """
        today = date.today()
        stale_schemes = []
        
        for scheme_key, scheme_data in self.schemes.items():
            if "last_verified" in scheme_data:
                last_verified = date.fromisoformat(scheme_data["last_verified"])
                days_old = (today - last_verified).days
                
                if days_old > staleness_threshold_days:
                    stale_schemes.append({
                        "scheme_code": scheme_key,
                        "scheme_name": scheme_data.get("full_name", scheme_key),
                        "last_verified": str(last_verified),
                        "days_old": days_old
                    })
        
        return {
            "check_timestamp": datetime.now().isoformat(),
            "schemes_checked": len(self.schemes),
            "stale_schemes": stale_schemes,
            "all_fresh": len(stale_schemes) == 0,
            "recommendation": "Update scheme data from official sources" if stale_schemes else "All schemes up to date"
        }
