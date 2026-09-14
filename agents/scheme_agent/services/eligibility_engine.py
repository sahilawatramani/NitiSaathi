"""
Scheme Agent Eligibility Engine — Rule-Based Matching, Match Scoring,
Category Filtering, and Personalized Scheme Elaboration.
"""
import json
from datetime import date, datetime
from pathlib import Path
from typing import Dict, List, Tuple, Optional, Any, Union
from ..models.schemas import (
    UserProfile,
    BudgetAgentState,
    EligibilityResult,
    SchemeRecommendation,
    AffordabilityAnalysis,
    SchemeCategory,
    SchemeElaboration,
)


class SchemeEligibilityEngine:
    """
    Core Rule-based eligibility & recommendation engine for government schemes.
    Uses curated knowledge base as the primary source of truth.
    """

    def __init__(self, knowledge_base_path: Optional[str] = None):
        """Load scheme knowledge base"""
        if knowledge_base_path is None:
            kb_path = Path(__file__).parent.parent / "data" / "schemes_kb.json"
        else:
            kb_path = Path(knowledge_base_path)

        with open(kb_path, "r", encoding="utf-8") as f:
            self.knowledge_base = json.load(f)

        self.schemes = self.knowledge_base["schemes"]
        self.categories_raw = self.knowledge_base.get("categories", {})
        self.last_updated = self.knowledge_base.get("last_updated", "2026-09-15")

    def get_categories(self) -> List[SchemeCategory]:
        """Return available scheme categories with live scheme counts."""
        categories = []
        for cat_id, cat_info in self.categories_raw.items():
            count = sum(1 for _, s in self.schemes.items() if s.get("category") == cat_id)
            categories.append(
                SchemeCategory(
                    id=cat_id,
                    name=cat_info["name"],
                    description=cat_info["description"],
                    icon=cat_info.get("icon", "Shield"),
                    scheme_count=count,
                )
            )
        return categories

    def calculate_match_score(self, scheme_key: str, user: UserProfile) -> int:
        """
        Calculate a match score percentage (0-100) based on met criteria weights.

        === MATCH SCORING WEIGHTING LOGIC ===
        1. Age Criterion: 25 points
           - User age within scheme age range: 25 pts
           - Close to boundary (within 3 years): 15 pts
           - Outside range: 0 pts
        2. Platform Gig Worker Activity (Code on Social Security 2020): 25 points
           - Active days >= 90 (or multi-platform >= 120): 25 pts
           - Active days between 45 and 89: 15 pts
           - Active days < 45: 5 pts
        3. Formal Sector & Tax Exclusion (EPFO/ESIC & Income Tax): 20 points
           - Not registered in EPFO/ESIC: 10 pts
           - Not an Income Tax payer: 10 pts
        4. Financial Inclusion (Bank Account & Aadhaar): 15 points
           - Has Savings Bank Account: 10 pts
           - Aadhaar linked: 5 pts
        5. Prerequisite Fulfillment (e-Shram / State Residence): 15 points
           - Already registered on e-Shram (or scheme doesn't require it): 10 pts
           - State matches state board requirement (or general nationwide scheme): 5 pts
        Total Score: 100 points
        """
        scheme = self.schemes.get(scheme_key, {})
        eligibility = scheme.get("eligibility", {})
        score = 0

        # 1. Age Criterion (25 pts)
        age = user.age if user.age is not None else 28
        min_age = eligibility.get("age_min", 18)
        max_age = eligibility.get("age_max", 70)
        if min_age <= age <= max_age:
            score += 25
        elif abs(age - min_age) <= 3 or abs(age - max_age) <= 3:
            score += 15

        # 2. Gig Worker Activity (25 pts)
        days_active = user.days_active_with_aggregator if user.days_active_with_aggregator is not None else 90
        if days_active >= 90:
            score += 25
        elif days_active >= 45:
            score += 15
        else:
            score += 5

        # 3. Formal Sector & Tax Exclusion (20 pts)
        epfo = user.epfo_esic_status or False
        tax_payer = user.income_tax_payer or False
        if not epfo:
            score += 10
        if not tax_payer:
            score += 10

        # 4. Financial Inclusion (15 pts)
        has_bank = user.savings_bank_account if user.savings_bank_account is not None else True
        has_aadhaar = user.aadhaar_linked if user.aadhaar_linked is not None else True
        if has_bank:
            score += 10
        if has_aadhaar:
            score += 5

        # 5. Prerequisite & State Match (15 pts)
        e_shram_req = eligibility.get("e_shram_registered", False)
        is_e_shram = user.e_shram_registered or False
        state_req = eligibility.get("state_residence")

        if not e_shram_req or is_e_shram:
            score += 10
        if state_req:
            if user.state and state_req.lower() in user.state.lower():
                score += 5
        else:
            score += 5

        return min(100, max(0, score))

    def check_gig_worker_status(self, user: UserProfile) -> Tuple[bool, str]:
        """
        Check if user qualifies as gig worker under Code on Social Security 2020.
        """
        days_active = user.days_active_with_aggregator if user.days_active_with_aggregator is not None else 90
        if days_active >= 90:
            return True, f"Eligible: {days_active} days active (≥90 days threshold met)"
        elif days_active >= 120:
            return True, f"Eligible: {days_active} days active (≥120 days multi-platform threshold met)"
        else:
            days_remaining = 90 - days_active
            return False, f"Not eligible: {days_active} days active. Need {days_remaining} more days to reach 90-day threshold."

    def check_scheme_eligibility(
        self, scheme_key: str, user: UserProfile, budget_state: Optional[BudgetAgentState] = None
    ) -> EligibilityResult:
        """
        Generic eligibility checking across any scheme in the knowledge base.
        """
        scheme = self.schemes.get(scheme_key)
        if not scheme:
            raise ValueError(f"Scheme '{scheme_key}' not found in knowledge base.")

        eligibility = scheme.get("eligibility", {})
        reasons = []
        blocking_factors = []

        age = user.age if user.age is not None else 28
        min_age = eligibility.get("age_min", 0)
        max_age = eligibility.get("age_max", 100)

        # 1. Age check
        if min_age <= age <= max_age:
            reasons.append(f"✓ Age {age} is within required range {min_age}-{max_age}")
        else:
            blocking_factors.append(f"✗ Age {age} is outside required range {min_age}-{max_age}")

        # 2. EPFO/ESIC check
        if eligibility.get("epfo_esic_registered") is False:
            if not user.epfo_esic_status:
                reasons.append("✓ Not registered with EPFO/ESIC (Unorganized worker)")
            else:
                blocking_factors.append("✗ Already registered with EPFO/ESIC (Blocks unorganized worker schemes)")

        # 3. Income Tax check
        if eligibility.get("income_tax_payer") is False:
            if not user.income_tax_payer:
                reasons.append("✓ Not an income tax payer")
            else:
                blocking_factors.append("✗ Income tax payer (Ineligible for means-tested social welfare)")

        # 4. Income Limit check
        max_income = eligibility.get("monthly_income_max")
        if max_income:
            income = user.monthly_income if user.monthly_income is not None else 25000.0
            if income <= max_income:
                reasons.append(f"✓ Monthly income ₹{income:,.0f} within limit of ₹{max_income:,.0f}")
            else:
                blocking_factors.append(f"✗ Monthly income ₹{income:,.0f} exceeds limit of ₹{max_income:,.0f}")

        # 5. e-Shram Registration prerequisite check
        if eligibility.get("e_shram_registered") is True:
            if user.e_shram_registered:
                reasons.append("✓ Registered on e-Shram portal")
            else:
                blocking_factors.append("✗ Not registered on e-Shram (Prerequisite for this scheme)")

        # 6. State Residence check
        req_state = eligibility.get("state_residence")
        if req_state:
            if user.state and req_state.lower() in user.state.lower():
                reasons.append(f"✓ Resident of {req_state}")
            else:
                blocking_factors.append(f"✗ Requires residence in {req_state} (User in {user.state or 'Unknown'})")

        # 7. Bank Account check
        if eligibility.get("savings_bank_account") is True:
            if user.savings_bank_account is not False:
                reasons.append("✓ Has active savings bank account")
            else:
                blocking_factors.append("✗ Active savings bank account required")

        eligible = len(blocking_factors) == 0
        match_score = self.calculate_match_score(scheme_key, user)

        # Contribution calculation
        contribution = None
        if "premium" in scheme and "annual_amount" in scheme["premium"]:
            contribution = float(scheme["premium"]["annual_amount"])
        elif "contribution_matrix" in scheme:
            contribution = float(scheme["contribution_matrix"].get(str(age), 150))

        # Affordability analysis if budget state provided
        affordable = None
        affordability_reasoning = None
        if eligible and budget_state and contribution is not None:
            freq = "annual" if ("premium" in scheme) else "monthly"
            analysis = self.analyze_affordability(
                scheme_code=scheme.get("scheme_code", scheme_key),
                contribution=contribution,
                frequency=freq,
                budget_state=budget_state,
                user_age=age,
            )
            affordable = analysis.affordable
            affordability_reasoning = analysis.recommendation
            if analysis.stability_requirement:
                reasons.append(f"⚠ {analysis.stability_requirement}")

        all_reasons = reasons + blocking_factors

        req_docs = scheme.get("eligibility", {}).get("required_documents")
        if not req_docs and scheme.get("required_documents_detail"):
            req_docs = [d["name"] for d in scheme.get("required_documents_detail", [])]

        return EligibilityResult(
            scheme_code=scheme.get("scheme_code", scheme_key.upper()),
            scheme_name=scheme.get("full_name", scheme_key),
            category=scheme.get("category", "insurance_healthcare"),
            eligible=eligible,
            eligibility_status="eligible" if eligible else "not_eligible",
            match_score_pct=match_score,
            reasons=all_reasons,
            official_portal_url=scheme.get("official_portal_url"),
            last_verified=date.fromisoformat(scheme.get("last_verified", self.last_updated)),
            data_freshness=self._compute_freshness(scheme.get("last_verified", self.last_updated)),
            contribution_required=contribution,
            affordable=affordable,
            affordability_reasoning=affordability_reasoning,
            required_documents=req_docs,
            required_documents_detail=scheme.get("required_documents_detail"),
            step_by_step_process=scheme.get("steps"),
            keywords=scheme.get("keywords"),
        )

    def elaborate_scheme(
        self, scheme_code: str, user: UserProfile, budget_state: Optional[BudgetAgentState] = None
    ) -> SchemeElaboration:
        """
        Generate comprehensive, personalized elaboration dossier for a specific scheme.
        """
        # Find scheme in KB by code or key
        matched_key = None
        for key, s in self.schemes.items():
            if key == scheme_code or s.get("scheme_code", "").lower() == scheme_code.lower():
                matched_key = key
                break

        if not matched_key:
            # Fallback to key lookup
            matched_key = scheme_code.lower().replace("-", "_")

        scheme = self.schemes.get(matched_key)
        if not scheme:
            raise ValueError(f"Scheme with code '{scheme_code}' not found.")

        result = self.check_scheme_eligibility(matched_key, user, budget_state)
        age = user.age if user.age is not None else 28

        # Affordability
        afford_analysis = None
        freq = "annual" if "premium" in scheme else "monthly"
        if result.contribution_required is not None and budget_state:
            afford_analysis = self.analyze_affordability(
                scheme_code=scheme.get("scheme_code", matched_key),
                contribution=result.contribution_required,
                frequency=freq,
                budget_state=budget_state,
                user_age=age,
            )

        # Criteria breakdown
        criteria_breakdown = []
        for r in result.reasons:
            is_met = not (r.startswith("✗") or r.startswith("✖") or "Not registered" in r or "Requires residence" in r or "exceeds" in r)
            cleaned = r.replace("✓ ", "").replace("✗ ", "").replace("✖ ", "").replace("⚠ ", "")
            criteria_breakdown.append({
                "criterion": cleaned,
                "met": is_met,
                "detail": r,
            })

        # Budget Affordability Note
        volatility = 0.0
        if budget_state and budget_state.income_volatility_pct is not None:
            volatility = budget_state.income_volatility_pct
        volatility_display = f"{volatility*100:.0f}%" if volatility <= 1.0 else f"{volatility:.0f}%"

        if result.contribution_required and result.contribution_required > 0:
            freq_str = "per year" if freq == "annual" else "per month"
            if afford_analysis and afford_analysis.affordable:
                budget_note = f"✓ Highly Affordable: ₹{result.contribution_required:,.0f} {freq_str} fits comfortably within your monthly savings capacity, with income volatility at {volatility_display}."
            elif budget_state:
                budget_note = f"⚠ Moderate: ₹{result.contribution_required:,.0f} {freq_str} is payable, but monitor auto-debits due to {volatility_display} income volatility."
            else:
                budget_note = f"₹{result.contribution_required:,.0f} {freq_str} nominal contribution."
        else:
            budget_note = f"✓ 100% Free / Government Funded: No direct out-of-pocket premium required. Zero-cost under your income volatility ({volatility_display})."

        return SchemeElaboration(
            scheme_code=scheme.get("scheme_code", matched_key.upper()),
            scheme_name=scheme.get("full_name", matched_key),
            category=scheme.get("category", "insurance_healthcare"),
            ministry=scheme.get("ministry", "Government of India"),
            official_portal_url=scheme.get("official_portal_url", "https://myscheme.gov.in/"),
            eligible=result.eligible,
            eligibility_status=result.eligibility_status,
            match_score_pct=result.match_score_pct,
            reasons=result.reasons,
            criteria_breakdown=criteria_breakdown,
            benefits=scheme.get("benefits", []),
            required_documents=scheme.get("required_documents_detail", [
                {"name": "Aadhaar Card", "purpose": "Identity Proof", "mandatory": True},
                {"name": "Bank Account Passbook", "purpose": "Financial Disbursement", "mandatory": True}
            ]),
            required_documents_detail=scheme.get("required_documents_detail"),
            step_by_step_process=scheme.get("steps", [
                "Visit the official government portal link",
                "Complete registration with Aadhaar e-KYC",
                "Submit required documents and download card/acknowledgment"
            ]),
            contribution_required=result.contribution_required,
            contribution_frequency=freq if result.contribution_required else None,
            affordability_analysis=afford_analysis,
            budget_affordability_note=budget_note,
            data_freshness=result.data_freshness or "✓ Verified",
            target_group=scheme.get("target_group"),
            notes=scheme.get("notes"),
            language=user.language or "en",
        )

    def analyze_affordability(
        self,
        scheme_code: str,
        contribution: float,
        frequency: str,
        budget_state: BudgetAgentState,
        user_age: int,
    ) -> AffordabilityAnalysis:
        """
        Joint reasoning with Budget Agent to determine scheme affordability.
        """
        wma = budget_state.income_wma_4w or 0.0
        monthly_income = wma * 4.33 if wma > 0 else (budget_state.monthly_income or 25000.0)
        savings_rate = budget_state.savings_rate_recommendation or 0.05
        available_savings = monthly_income * savings_rate
        monthly_contribution = contribution if frequency == "monthly" else contribution / 12

        affordable = monthly_contribution <= available_savings if available_savings > 0 else (contribution <= 50)
        margin = available_savings - monthly_contribution

        volatility = budget_state.income_volatility_pct or 0.0
        if volatility > 1.0:
            volatility = volatility / 100.0  # normalize percentage

        if volatility <= 0.15:
            confidence = "high"
        elif volatility <= 0.30:
            confidence = "medium"
        else:
            confidence = "low"

        risk_factors = []
        if volatility > 0.30:
            risk_factors.append("High income volatility may make sustained monthly contributions difficult.")
        if margin < (contribution * 0.5):
            risk_factors.append("Low savings buffer: a lean delivery week could trigger an auto-debit bounce penalty.")

        if affordable and confidence == "high":
            recommendation = f"✓ Highly Affordable: Monthly contribution of ₹{monthly_contribution:,.0f} comfortably fits within your monthly savings budget of ₹{available_savings:,.0f}."
            stability_requirement = None
        elif affordable and confidence == "medium":
            recommendation = f"⚠ Conditionally Affordable: ₹{monthly_contribution:,.0f}/month fits within current savings, but moderate volatility ({volatility*100:.0f}%) observed."
            stability_requirement = "Recommend maintaining at least ₹500 buffer in bank before setting auto-debit."
        elif affordable and confidence == "low":
            recommendation = f"⚠ Risky: High income volatility ({volatility*100:.0f}%). Risk of auto-debit failure during lean weeks."
            stability_requirement = "Wait until income stabilizes (volatility <30%) for 4 consecutive weeks before enrollment."
        else:
            recommendation = f"✗ Not Recommended Currently: Required contribution exceeds recommended savings limit."
            stability_requirement = "Focus on building liquid emergency buffer first."

        scheme_name = scheme_code
        for _, s in self.schemes.items():
            if s.get("scheme_code") == scheme_code:
                scheme_name = s.get("full_name", scheme_code)
                break

        return AffordabilityAnalysis(
            scheme_code=scheme_code,
            scheme_name=scheme_name,
            contribution_required=contribution,
            contribution_frequency=frequency,
            monthly_income_estimate=round(monthly_income, 2),
            savings_rate=savings_rate,
            available_savings_per_month=round(available_savings, 2),
            affordable=affordable,
            margin=round(margin, 2),
            confidence=confidence,
            recommendation=recommendation,
            stability_requirement=stability_requirement,
            risk_factors=risk_factors,
        )

    def generate_recommendation(
        self,
        user: UserProfile,
        budget_state: Optional[BudgetAgentState] = None,
        selected_categories: Optional[List[str]] = None,
        keywords: Optional[Union[List[str], str]] = None,
        query: Optional[str] = None,
    ) -> SchemeRecommendation:
        """
        Generate comprehensive scheme recommendations filtered by categories & keywords.
        """
        is_gig_worker, gig_status = self.check_gig_worker_status(user)

        eligible_schemes = []
        ineligible_schemes = []
        conditional_schemes = []

        # Parse keywords / query terms
        search_terms = set()
        if query and query.strip():
            search_terms.update(query.lower().split())
        if keywords:
            if isinstance(keywords, str) and keywords.strip():
                search_terms.update(keywords.lower().split())
            elif isinstance(keywords, (list, tuple, set)):
                for k in keywords:
                    if isinstance(k, str) and k.strip():
                        search_terms.update(k.lower().split())

        # Category and Keyword filtering
        for scheme_key, scheme_data in self.schemes.items():
            # Category filter check
            scheme_cat = scheme_data.get("category")
            if selected_categories and len(selected_categories) > 0:
                if scheme_cat not in selected_categories and "all" not in selected_categories:
                    continue

            # Keyword / query filter check
            if search_terms:
                scheme_text = (
                    f"{scheme_data.get('full_name', '')} {scheme_data.get('scheme_code', '')} {scheme_data.get('category', '')} "
                    f"{' '.join(scheme_data.get('keywords', []))} {scheme_data.get('target_group', '')}"
                ).lower()

                if not any(term in scheme_text for term in search_terms):
                    continue

            # Evaluate scheme
            result = self.check_scheme_eligibility(scheme_key, user, budget_state)
            if result.eligible:
                if budget_state and result.affordable is False:
                    conditional_schemes.append(result)
                else:
                    eligible_schemes.append(result)
            else:
                ineligible_schemes.append(result)

        # Sort eligible schemes by match score descending
        eligible_schemes.sort(key=lambda s: s.match_score_pct, reverse=True)

        # Priority recommendations
        priority = []
        if not user.e_shram_registered:
            priority.append("1. Register on e-Shram (Foundational 12-digit UAN gateway, free registration at eshram.gov.in)")
        priority.append("2. Enroll in PMSBY (₹20/year accident protection — essential for road & delivery safety)")
        priority.append("3. Explore Ayushman Bharat PM-JAY (₹5 Lakh family cashless healthcare hospitalization cover)")

        joint_summary = None
        if budget_state and budget_state.income_wma_4w:
            joint_summary = (
                f"Financial Context: 4-week income level ₹{budget_state.income_wma_4w:,.0f}/week, "
                f"volatility {budget_state.income_volatility_pct*100:.0f}%, "
                f"recommended savings rate {budget_state.savings_rate_recommendation*100:.0f}%. "
                f"Current closing balance: ₹{budget_state.closing_balance:,.0f}."
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
            joint_reasoning_summary=joint_summary,
            categories_available=self.get_categories(),
        )

    def _compute_freshness(self, last_verified_str: str) -> str:
        """Compute human-readable freshness indicator"""
        try:
            last_verified = date.fromisoformat(last_verified_str)
            today = date.today()
            days_old = (today - last_verified).days
            if days_old == 0:
                return "✓ Verified today"
            elif days_old <= 30:
                return f"✓ Verified ({days_old}d ago)"
            elif days_old <= 90:
                return f"✓ Verified ({days_old}d ago)"
            else:
                return f"⚠ Update Recommended ({days_old}d old)"
        except Exception:
            return "✓ Verified"

    def check_data_freshness(self, staleness_threshold_days: int = 90) -> Dict:
        """Check freshness of schemes in KB."""
        today = date.today()
        stale_schemes = []

        for scheme_key, scheme_data in self.schemes.items():
            if "last_verified" in scheme_data:
                try:
                    last_verified = date.fromisoformat(scheme_data["last_verified"])
                    days_old = (today - last_verified).days
                    if days_old > staleness_threshold_days:
                        stale_schemes.append({
                            "scheme_code": scheme_key,
                            "scheme_name": scheme_data.get("full_name", scheme_key),
                            "last_verified": str(last_verified),
                            "days_old": days_old,
                        })
                except Exception:
                    pass

        return {
            "check_timestamp": datetime.now().isoformat(),
            "schemes_checked": len(self.schemes),
            "stale_schemes": stale_schemes,
            "all_fresh": len(stale_schemes) == 0,
            "recommendation": "All schemes up to date" if len(stale_schemes) == 0 else "Update recommended for stale entries",
        }
