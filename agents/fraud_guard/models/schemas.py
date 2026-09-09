"""
Pydantic schemas for Fraud Guard
"""
from pydantic import BaseModel, Field
from typing import Optional, List, Dict
from datetime import datetime
from enum import Enum


class TransactionDirection(str, Enum):
    CREDIT = "credit"
    DEBIT = "debit"


class FraudSeverity(str, Enum):
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"
    SAFE = "SAFE"


class Transaction(BaseModel):
    """UPI transaction for fraud analysis"""
    transaction_id: str
    user_id: str
    timestamp: datetime
    direction: TransactionDirection
    amount: float
    counterparty: str
    counterparty_upi: Optional[str] = None
    category: str
    description: Optional[str] = None
    balance_before: float
    balance_after: float
    
    # Metadata for detection
    is_first_time_counterparty: bool = False
    transaction_hour: int = Field(ge=0, le=23)
    
    # Ground truth (if available from synthetic data)
    is_flagged_anomaly: Optional[bool] = None
    anomaly_type: Optional[str] = None


class FraudPattern(BaseModel):
    """Matched fraud pattern details"""
    pattern_id: str
    pattern_name: str
    description: str
    severity: FraudSeverity
    matched_signals: List[str]
    confidence: float = Field(ge=0.0, le=1.0, description="Pattern match confidence 0.0-1.0")


class FraudAlert(BaseModel):
    """Fraud detection alert"""
    transaction_id: str
    user_id: str
    timestamp: str
    
    # Detection results
    is_suspicious: bool
    severity: FraudSeverity
    risk_score: float = Field(ge=0.0, le=1.0, description="Overall risk score 0.0-1.0")
    
    # Matched patterns
    matched_patterns: List[FraudPattern]
    
    # Warning and action
    alert_title: str
    alert_message: str
    user_warning: str
    action_required: str
    
    # PIN/OTP security check
    contains_pin_otp_request: bool = False
    
    # Additional context
    transaction_details: Dict
    similar_incidents: Optional[List[str]] = Field(None, description="Similar fraud incidents for this user")


class AnomalyFeatures(BaseModel):
    """Computed features for anomaly detection"""
    transaction_id: str
    
    # Deviation features
    amount_deviation_score: float = Field(description="Z-score of amount vs user average")
    
    # Counterparty features
    counterparty_frequency: int = Field(description="Number of transactions with this counterparty in last 90 days")
    is_new_counterparty: bool
    
    # Temporal features
    time_of_day_unusual: bool
    transaction_hour: int
    
    # Velocity features
    velocity_score: int = Field(description="Number of transactions in last 10 minutes")
    
    # Category features
    category_mismatch: bool = Field(description="Transaction category outside user's normal pattern")
    
    # Balance impact
    balance_drop_percentage: float = Field(description="Percentage of balance depleted by transaction")
    
    # Composite score
    anomaly_score: float = Field(ge=0.0, le=1.0, description="ML-based anomaly probability")


class FraudDetectionResult(BaseModel):
    """Complete fraud detection result for a transaction"""
    transaction: Transaction
    alert: Optional[FraudAlert] = None
    anomaly_features: AnomalyFeatures
    
    # Detection metadata
    detection_timestamp: str
    detection_method: str = Field(description="rule_based | ml_based | hybrid")
    processing_time_ms: float
    
    # User action tracking
    user_confirmed_fraud: Optional[bool] = None
    user_feedback: Optional[str] = None


class UserTransactionHistory(BaseModel):
    """User's transaction history summary for pattern analysis"""
    user_id: str
    total_transactions: int
    
    # Statistical summary
    avg_credit_amount: float
    avg_debit_amount: float
    stddev_credit: float
    stddev_debit: float
    
    # Counterparty analysis
    unique_counterparties: int
    frequent_counterparties: List[Dict]  # [{"counterparty": "name", "count": N}]
    
    # Category distribution
    category_distribution: Dict[str, int]
    
    # Temporal patterns
    typical_transaction_hours: List[int]
    
    # Historical fraud
    previous_fraud_incidents: int
    last_fraud_date: Optional[str] = None


class RBILenderCheckResult(BaseModel):
    """Result of RBI registered lender whitelist check"""
    entity_name: str
    is_registered: bool
    registration_number: Optional[str] = None
    entity_type: Optional[str] = Field(None, description="Bank | NBFC | Payment Bank | Other")
    warning: Optional[str] = None
    source: str = "RBI Master List of Regulated Entities"


class FraudStatistics(BaseModel):
    """Fraud detection statistics for reporting"""
    period_start: str
    period_end: str
    
    total_transactions_analyzed: int
    suspicious_transactions: int
    confirmed_fraud: int
    false_positives: int
    
    # By severity
    high_severity_count: int
    medium_severity_count: int
    low_severity_count: int
    
    # By pattern
    pattern_distribution: Dict[str, int]
    
    # Performance metrics
    detection_rate: float = Field(description="Confirmed fraud / Total fraud")
    false_positive_rate: float = Field(description="False positives / Total flagged")
    precision: float
    recall: float
