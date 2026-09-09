"""
FastAPI router for Fraud Guard endpoints
"""
from fastapi import APIRouter, HTTPException, Body
from typing import List, Optional

from ..models.schemas import (
    Transaction,
    FraudDetectionResult,
    UserTransactionHistory,
    RBILenderCheckResult,
    FraudStatistics
)
from ..services.fraud_detector import FraudDetectionEngine

router = APIRouter(prefix="/api/v1/fraud-guard", tags=["Fraud Guard"])

# Initialize detector (in production, use dependency injection)
detector = FraudDetectionEngine()


@router.post("/detect", response_model=FraudDetectionResult)
async def detect_fraud(
    transaction: Transaction,
    user_history: UserTransactionHistory,
    check_description: Optional[str] = Body(None, description="Optional text to check for PIN/OTP requests")
):
    """
    Detect fraud patterns in a single transaction
    
    - Runs rule-based pattern matching
    - Computes anomaly features
    - Checks for PIN/OTP requests (CRITICAL)
    - Returns alert if suspicious
    
    HARD RULE: System NEVER asks for PIN/OTP. If detected, generates critical alert.
    """
    try:
        result = detector.detect_fraud(transaction, user_history, check_description)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Fraud detection failed: {str(e)}")


@router.post("/batch-detect", response_model=List[FraudDetectionResult])
async def batch_detect_fraud(
    transactions: List[Transaction],
    user_history: UserTransactionHistory
):
    """
    Batch fraud detection for multiple transactions
    
    Useful for:
    - Initial user onboarding (analyze historical transactions)
    - Weekly fraud review
    - Synthetic data evaluation
    """
    try:
        results = []
        for transaction in transactions:
            result = detector.detect_fraud(transaction, user_history)
            results.append(result)
        
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Batch detection failed: {str(e)}")


@router.post("/build-user-history", response_model=UserTransactionHistory)
async def build_user_transaction_history(
    transactions: List[Transaction]
):
    """
    Build user transaction history summary from transaction list
    
    Returns:
    - Statistical summary (avg, stddev by direction)
    - Counterparty frequency analysis
    - Category distribution
    - Typical transaction hours
    - Historical fraud incidents
    
    This history is required input for fraud detection.
    """
    try:
        history = detector.build_user_history(transactions)
        return history
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"History build failed: {str(e)}")


@router.get("/check-lender/{entity_name}", response_model=RBILenderCheckResult)
async def check_rbi_lender(entity_name: str):
    """
    Check if entity is RBI-registered lender
    
    - Searches RBI whitelist
    - Returns registration status
    - Warns if entity is not registered
    
    Use for loan/lending transaction verification
    """
    try:
        result = detector.check_rbi_lender(entity_name)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lender check failed: {str(e)}")


@router.post("/check-lender", response_model=RBILenderCheckResult)
async def check_rbi_lender_post(
    lender_name: str = Body(...),
    transaction_amount: Optional[float] = Body(None),
    loan_offer_link: Optional[str] = Body(None)
):
    """
    Check if entity is RBI-registered lender (POST version with extra context)
    
    - Searches RBI whitelist
    - Returns registration status
    - Warns if entity is not registered
    - Can include transaction amount and loan offer link for additional validation
    
    Use for loan/lending transaction verification
    """
    try:
        result = detector.check_rbi_lender(lender_name)
        
        # Add extra warnings based on context
        if not result.is_registered:
            warnings = [result.warning] if result.warning else []
            
            if transaction_amount and transaction_amount > 10000:
                warnings.append(f"⚠️ High value loan offer (₹{transaction_amount:,.2f}) from unregistered lender is extremely suspicious")
            
            if loan_offer_link and any(suspicious in loan_offer_link.lower() for suspicious in ['.xyz', 'bit.ly', 't.me', 'wa.me']):
                warnings.append(f"⚠️ Suspicious URL detected: {loan_offer_link}")
            
            result.warning = " | ".join(warnings)
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lender check failed: {str(e)}")


@router.post("/check-pin-otp-request")
async def check_pin_otp_request(text: str = Body(..., embed=True)):
    """
    Check if text contains PIN/OTP request (CRITICAL SECURITY CHECK)
    
    HARD RULE: System NEVER asks for PIN/OTP.
    This endpoint checks if external message/call is asking for sensitive info.
    
    Returns:
    - contains_request: bool
    - alert: Critical security warning if detected
    """
    contains_request = detector._check_pin_otp_request(text)
    
    if contains_request:
        return {
            "contains_pin_otp_request": True,
            "severity": "CRITICAL",
            "alert_title": "🚨 FRAUD ALERT: PIN/OTP Request Detected",
            "alert_message": (
                "The message you're checking is asking for your UPI PIN or OTP. "
                "This is 100% a scam. NEVER share your PIN or OTP with anyone. "
                "No bank, government agency, or UPI app will EVER ask for your PIN. "
                "Hang up immediately if on call and report to cyber cell."
            ),
            "action_required": "DO NOT share your PIN or OTP. Report this incident."
        }
    else:
        return {
            "contains_pin_otp_request": False,
            "status": "safe",
            "message": "No PIN/OTP request detected in the provided text."
        }


@router.get("/patterns")
async def list_fraud_patterns():
    """
    List all fraud patterns with descriptions
    
    Returns metadata for all known fraud patterns:
    - Pattern ID and name
    - Description
    - Severity
    - Detection signals
    - User warnings
    """
    patterns_list = []
    for pattern_key, pattern_data in detector.fraud_patterns.items():
        patterns_list.append({
            "pattern_id": pattern_data["pattern_id"],
            "name": pattern_data["name"],
            "description": pattern_data["description"],
            "severity": pattern_data["severity"],
            "target_group": pattern_data.get("target_group"),
            "detection_signals": pattern_data.get("detection_signals", []),
            "user_warning": pattern_data.get("user_warning")
        })
    
    return {
        "total_patterns": len(patterns_list),
        "patterns": patterns_list,
        "last_updated": detector.knowledge_base["last_updated"]
    }


@router.get("/patterns/{pattern_id}")
async def get_pattern_details(pattern_id: str):
    """
    Get details for a specific fraud pattern
    
    Returns complete information about a fraud pattern including:
    - Detection signals
    - User warnings
    - Examples
    - Mitigation advice
    """
    # Find pattern in fraud_patterns dict
    pattern_data = None
    for key, data in detector.fraud_patterns.items():
        if data["pattern_id"] == pattern_id or key == pattern_id:
            pattern_data = data
            break
    
    if not pattern_data:
        raise HTTPException(status_code=404, detail=f"Pattern '{pattern_id}' not found")
    
    return {
        "pattern_id": pattern_data["pattern_id"],
        "name": pattern_data["name"],
        "description": pattern_data["description"],
        "severity": pattern_data["severity"],
        "target_group": pattern_data.get("target_group"),
        "detection_signals": pattern_data.get("detection_signals", []),
        "examples": pattern_data.get("examples", []),
        "user_warning": pattern_data.get("user_warning"),
        "mitigation": pattern_data.get("mitigation", []),
        "prevalence": pattern_data.get("prevalence")
    }


@router.get("/statistics")
async def get_fraud_statistics():
    """
    Get fraud detection statistics
    
    Returns aggregate statistics on fraud patterns detected
    (In production, this would query database for actual stats)
    """
    return {
        "message": "Statistics endpoint - implement with database tracking",
        "ground_truth_info": detector.knowledge_base["ground_truth_labels"],
        "fraud_stats_fy2024_25": detector.knowledge_base["fraud_statistics"]
    }


@router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "agent": "Fraud Guard",
        "version": "1.0.0",
        "knowledge_base_last_updated": detector.knowledge_base["last_updated"],
        "total_patterns": len(detector.fraud_patterns),
        "hard_rules_active": len(detector.hard_rules)
    }
