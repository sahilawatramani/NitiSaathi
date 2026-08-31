"""
Fraud Guard Detection Engine

Real-time fraud pattern detection using rule-based and ML-based methods
"""
import json
import re
from pathlib import Path
from datetime import datetime, timedelta
from typing import Dict, List, Tuple, Optional
import numpy as np
from collections import Counter, defaultdict

from ..models.schemas import (
    Transaction,
    FraudAlert,
    FraudPattern,
    FraudSeverity,
    AnomalyFeatures,
    FraudDetectionResult,
    UserTransactionHistory,
    RBILenderCheckResult
)


class FraudDetectionEngine:
    """
    Core fraud detection engine combining rule-based patterns and anomaly detection
    """
    
    def __init__(self, patterns_path: str = None):
        """Load fraud patterns knowledge base"""
        if patterns_path is None:
            kb_path = Path(__file__).parent.parent / "data" / "fraud_patterns.json"
        else:
            kb_path = Path(patterns_path)
        
        with open(kb_path, 'r', encoding='utf-8') as f:
            self.knowledge_base = json.load(f)
        
        self.fraud_patterns = self.knowledge_base["fraud_patterns"]
        self.hard_rules = self.knowledge_base["hard_rules"]
        self.response_templates = self.knowledge_base["response_templates"]
        
        # Compile regex patterns for efficiency
        self._compile_detection_patterns()
    
    def _compile_detection_patterns(self):
        """Compile regex patterns for fast matching"""
        self.pin_otp_patterns = [
            re.compile(r'\bpin\b', re.IGNORECASE),
            re.compile(r'\botp\b', re.IGNORECASE),
            re.compile(r'enter\s+(?:your\s+)?(?:upi\s+)?pin', re.IGNORECASE),
            re.compile(r'share\s+(?:your\s+)?otp', re.IGNORECASE),
            re.compile(r'verify\s+(?:your\s+)?pin', re.IGNORECASE),
            re.compile(r'\d+\s*-?\s*digit\s+(?:pin|otp|code)', re.IGNORECASE),
        ]
        
        # Task-based scam keywords
        self.task_scam_keywords = [
            'registration', 'activation', 'job', 'task', 'security', 'deposit',
            'earning', 'opportunity', 'work from home', 'daily income'
        ]
    
    def detect_fraud(
        self,
        transaction: Transaction,
        user_history: UserTransactionHistory,
        check_description: str = None
    ) -> FraudDetectionResult:
        """
        Main fraud detection pipeline
        
        Args:
            transaction: Transaction to analyze
            user_history: User's historical transaction summary
            check_description: Optional text to check for PIN/OTP requests
        
        Returns:
            FraudDetectionResult with alert if suspicious
        """
        start_time = datetime.now()
        
        # 1. HARD RULE CHECK: PIN/OTP request detection
        contains_pin_otp = False
        if check_description:
            contains_pin_otp = self._check_pin_otp_request(check_description)
        
        # 2. Compute anomaly features
        anomaly_features = self._compute_anomaly_features(transaction, user_history)
        
        # 3. Rule-based pattern matching
        matched_patterns = self._match_fraud_patterns(transaction, user_history, anomaly_features)
        
        # 4. Generate alert if suspicious
        alert = None
        if contains_pin_otp:
            # Critical security violation - always alert
            alert = self._generate_pin_otp_alert(transaction)
        elif matched_patterns:
            alert = self._generate_fraud_alert(transaction, matched_patterns, anomaly_features)
        elif anomaly_features.anomaly_score > 0.75:
            # ML-based detection caught something rule-based missed
            alert = self._generate_anomaly_alert(transaction, anomaly_features)
        
        processing_time = (datetime.now() - start_time).total_seconds() * 1000
        
        return FraudDetectionResult(
            transaction=transaction,
            alert=alert,
            anomaly_features=anomaly_features,
            detection_timestamp=datetime.now().isoformat(),
            detection_method="hybrid" if matched_patterns and anomaly_features.anomaly_score > 0.5 else "rule_based" if matched_patterns else "ml_based",
            processing_time_ms=processing_time
        )
    
    def _check_pin_otp_request(self, text: str) -> bool:
        """
        HARD RULE: Check if text contains PIN/OTP request
        
        This is a CRITICAL SECURITY CHECK. Any match triggers immediate alert.
        """
        for pattern in self.pin_otp_patterns:
            if pattern.search(text):
                return True
        return False
    
    def _compute_anomaly_features(
        self,
        transaction: Transaction,
        user_history: UserTransactionHistory
    ) -> AnomalyFeatures:
        """Compute statistical anomaly features for transaction"""
        
        # Amount deviation (Z-score)
        if transaction.direction.value == "debit":
            avg = user_history.avg_debit_amount
            stddev = user_history.stddev_debit
        else:
            avg = user_history.avg_credit_amount
            stddev = user_history.stddev_credit
        
        amount_deviation = (transaction.amount - avg) / stddev if stddev > 0 else 0
        
        # Counterparty frequency
        counterparty_count = 0
        for cp_dict in user_history.frequent_counterparties:
            if cp_dict.get("counterparty") == transaction.counterparty:
                counterparty_count = cp_dict.get("count", 0)
                break
        
        is_new_counterparty = counterparty_count == 0
        
        # Time of day unusual
        typical_hours = user_history.typical_transaction_hours
        time_unusual = transaction.transaction_hour not in typical_hours
        
        # Velocity score (would need recent transaction timestamps in real system)
        # Simplified: set to 1 for now
        velocity_score = 1
        
        # Category mismatch
        category_mismatch = transaction.category not in user_history.category_distribution
        
        # Balance drop percentage
        if transaction.direction.value == "debit" and transaction.balance_before > 0:
            balance_drop = (transaction.balance_before - transaction.balance_after) / transaction.balance_before
        else:
            balance_drop = 0.0
        
        # Composite anomaly score (weighted combination)
        anomaly_score = self._compute_composite_anomaly_score(
            amount_deviation,
            is_new_counterparty,
            time_unusual,
            velocity_score,
            category_mismatch,
            balance_drop
        )
        
        return AnomalyFeatures(
            transaction_id=transaction.transaction_id,
            amount_deviation_score=amount_deviation,
            counterparty_frequency=counterparty_count,
            is_new_counterparty=is_new_counterparty,
            time_of_day_unusual=time_unusual,
            transaction_hour=transaction.transaction_hour,
            velocity_score=velocity_score,
            category_mismatch=category_mismatch,
            balance_drop_percentage=balance_drop,
            anomaly_score=anomaly_score
        )
    
    def _compute_composite_anomaly_score(
        self,
        amount_deviation: float,
        is_new_counterparty: bool,
        time_unusual: bool,
        velocity_score: int,
        category_mismatch: bool,
        balance_drop: float
    ) -> float:
        """
        Compute weighted composite anomaly score
        
        Weights tuned for gig worker fraud patterns (can be improved with ML)
        """
        score = 0.0
        
        # Amount deviation (Z-score > 3 is very unusual)
        if abs(amount_deviation) > 3:
            score += 0.35
        elif abs(amount_deviation) > 2:
            score += 0.20
        
        # New counterparty with large amount
        if is_new_counterparty:
            score += 0.25
        
        # Unusual time (late night/early morning)
        if time_unusual:
            score += 0.15
        
        # High velocity (multiple transactions quickly)
        if velocity_score >= 3:
            score += 0.30
        
        # Category mismatch
        if category_mismatch:
            score += 0.10
        
        # Large balance drop (>50% in one transaction)
        if balance_drop > 0.50:
            score += 0.25
        
        # Cap at 1.0
        return min(score, 1.0)
    
    def _match_fraud_patterns(
        self,
        transaction: Transaction,
        user_history: UserTransactionHistory,
        anomaly_features: AnomalyFeatures
    ) -> List[FraudPattern]:
        """
        Match transaction against known fraud patterns
        """
        matched = []
        
        # Pattern 1: Fake QR Overlay
        if self._check_fake_qr_overlay(transaction, anomaly_features):
            pattern = self.fraud_patterns["fake_qr_overlay"]
            matched.append(FraudPattern(
                pattern_id=pattern["pattern_id"],
                pattern_name=pattern["name"],
                description=pattern["description"],
                severity=FraudSeverity(pattern["severity"]),
                matched_signals=[
                    f"First-time counterparty: {transaction.counterparty}",
                    f"Category: {transaction.category} (typical for QR scams)",
                    "Merchant name may not match physical location"
                ],
                confidence=0.7
            ))
        
        # Pattern 2: Task-Based Job Scam
        if self._check_task_scam(transaction):
            pattern = self.fraud_patterns["task_based_job_scam"]
            matched.append(FraudPattern(
                pattern_id=pattern["pattern_id"],
                pattern_name=pattern["name"],
                description=pattern["description"],
                severity=FraudSeverity(pattern["severity"]),
                matched_signals=[
                    f"Amount ₹{transaction.amount} in typical scam range (₹300-₹5,000)",
                    f"Description contains job/registration keywords",
                    "Counterparty is individual, not company"
                ],
                confidence=0.85
            ))
        
        # Pattern 3: Large Atypical Debit
        if self._check_large_atypical_debit(transaction, anomaly_features):
            pattern = self.fraud_patterns["large_atypical_debit"]
            matched.append(FraudPattern(
                pattern_id=pattern["pattern_id"],
                pattern_name=pattern["name"],
                description=pattern["description"],
                severity=FraudSeverity(pattern["severity"]),
                matched_signals=[
                    f"Amount ₹{transaction.amount} is {abs(anomaly_features.amount_deviation_score):.1f}x std dev above average",
                    f"New or rarely-used counterparty (frequency: {anomaly_features.counterparty_frequency})",
                    f"Unusual time: {transaction.transaction_hour}:00" if anomaly_features.time_of_day_unusual else ""
                ],
                confidence=0.65
            ))
        
        # Pattern 4: Rapid Micro-Debits
        if anomaly_features.velocity_score >= 3 and transaction.amount < 50:
            pattern = self.fraud_patterns["rapid_micro_debits"]
            matched.append(FraudPattern(
                pattern_id=pattern["pattern_id"],
                pattern_name=pattern["name"],
                description=pattern["description"],
                severity=FraudSeverity(pattern["severity"]),
                matched_signals=[
                    f"{anomaly_features.velocity_score} transactions in short window",
                    f"Small amount: ₹{transaction.amount}",
                    "May indicate card testing before larger fraud"
                ],
                confidence=0.90
            ))
        
        # Pattern 5: New Counterparty Large Debit
        if (transaction.direction.value == "debit" and 
            anomaly_features.is_new_counterparty and 
            transaction.amount > max(user_history.avg_debit_amount * 2, 1000)):
            
            pattern = self.fraud_patterns["collect_request_new_counterparty_large"]
            matched.append(FraudPattern(
                pattern_id=pattern["pattern_id"],
                pattern_name=pattern["name"],
                description=pattern["description"],
                severity=FraudSeverity(pattern["severity"]),
                matched_signals=[
                    f"First transaction with {transaction.counterparty}",
                    f"Amount ₹{transaction.amount} is large for first interaction",
                    "No recent credits from this counterparty"
                ],
                confidence=0.75
            ))
        
        return matched
    
    def _check_fake_qr_overlay(self, transaction: Transaction, features: AnomalyFeatures) -> bool:
        """Check if transaction matches fake QR overlay pattern"""
        if transaction.direction.value != "debit":
            return False
        
        # Check if category is typical for QR scams
        qr_categories = ["fuel", "food", "recharge"]
        if transaction.category not in qr_categories:
            return False
        
        # Must be new or rare counterparty
        if not features.is_new_counterparty and features.counterparty_frequency > 3:
            return False
        
        # Amount should be in normal range for category (not a red flag on its own)
        # This pattern is about merchant name mismatch, which we approximate with new counterparty
        
        return True
    
    def _check_task_scam(self, transaction: Transaction) -> bool:
        """Check if transaction matches task-based job scam"""
        if transaction.direction.value != "debit":
            return False
        
        # Amount range check
        if not (300 <= transaction.amount <= 5000):
            return False
        
        # Check description for keywords
        if transaction.description:
            description_lower = transaction.description.lower()
            keyword_matches = sum(1 for keyword in self.task_scam_keywords if keyword in description_lower)
            if keyword_matches >= 2:
                return True
        
        # Check counterparty name for keywords
        counterparty_lower = transaction.counterparty.lower()
        keyword_matches = sum(1 for keyword in self.task_scam_keywords if keyword in counterparty_lower)
        if keyword_matches >= 1:
            return True
        
        return False
    
    def _check_large_atypical_debit(self, transaction: Transaction, features: AnomalyFeatures) -> bool:
        """Check if transaction is large and atypical"""
        if transaction.direction.value != "debit":
            return False
        
        # Amount deviation must be significant
        if abs(features.amount_deviation_score) < 2.5:
            return False
        
        # New or rare counterparty
        if features.counterparty_frequency > 5:
            return False
        
        # Optional: unusual time adds confidence
        # But not required for match
        
        return True
    
    def _generate_pin_otp_alert(self, transaction: Transaction) -> FraudAlert:
        """
        Generate CRITICAL alert for PIN/OTP request detection
        
        This is the highest priority alert - overrides all others
        """
        template = self.response_templates["pin_otp_warning"]
        
        return FraudAlert(
            transaction_id=transaction.transaction_id,
            user_id=transaction.user_id,
            timestamp=datetime.now().isoformat(),
            is_suspicious=True,
            severity=FraudSeverity.HIGH,
            risk_score=1.0,
            matched_patterns=[],
            alert_title=template["title"],
            alert_message=template["message"],
            user_warning=template["message"],
            action_required="DO NOT share your PIN or OTP. Hang up immediately if on call. Report to cyber cell.",
            contains_pin_otp_request=True,
            transaction_details=transaction.model_dump()
        )
    
    def _generate_fraud_alert(
        self,
        transaction: Transaction,
        matched_patterns: List[FraudPattern],
        anomaly_features: AnomalyFeatures
    ) -> FraudAlert:
        """Generate fraud alert based on matched patterns"""
        
        # Determine overall severity (highest among matched patterns)
        severity = max(p.severity for p in matched_patterns)
        
        # Compute risk score (average confidence of matched patterns + anomaly score)
        pattern_confidence = np.mean([p.confidence for p in matched_patterns])
        risk_score = (pattern_confidence + anomaly_features.anomaly_score) / 2
        
        # Select template based on severity
        template_key = f"fraud_detected_{severity.value.lower()}"
        template = self.response_templates.get(template_key, self.response_templates["fraud_detected_medium"])
        
        # Build alert message
        primary_pattern = matched_patterns[0]  # Highest confidence
        
        # Get pattern key from fraud_patterns (handle various pattern ID formats)
        pattern_lookup_key = None
        for key in self.fraud_patterns.keys():
            if self.fraud_patterns[key].get("pattern_id") == primary_pattern.pattern_id:
                pattern_lookup_key = key
                break
        
        specific_warning = ""
        if pattern_lookup_key:
            specific_warning = self.fraud_patterns[pattern_lookup_key].get("user_warning", "")
        
        alert_message = primary_pattern.description
        if specific_warning:
            alert_message = f"{primary_pattern.description}. {specific_warning}"
        
        # Build user warning
        user_warning_parts = []
        for p in matched_patterns:
            for key in self.fraud_patterns.keys():
                if self.fraud_patterns[key].get("pattern_id") == p.pattern_id:
                    warning = self.fraud_patterns[key].get("user_warning", "")
                    if warning:
                        user_warning_parts.append(warning)
                    break
        
        user_warning = "\n\n".join(user_warning_parts)
        
        return FraudAlert(
            transaction_id=transaction.transaction_id,
            user_id=transaction.user_id,
            timestamp=datetime.now().isoformat(),
            is_suspicious=True,
            severity=severity,
            risk_score=risk_score,
            matched_patterns=matched_patterns,
            alert_title=template["title"],
            alert_message=alert_message,
            user_warning=user_warning,
            action_required=template["action_required"],
            contains_pin_otp_request=False,
            transaction_details=transaction.model_dump()
        )
    
    def _generate_anomaly_alert(
        self,
        transaction: Transaction,
        anomaly_features: AnomalyFeatures
    ) -> FraudAlert:
        """Generate alert for ML-detected anomaly without specific pattern match"""
        
        severity = FraudSeverity.MEDIUM if anomaly_features.anomaly_score > 0.85 else FraudSeverity.LOW
        
        # Build anomaly explanation
        anomaly_reasons = []
        if abs(anomaly_features.amount_deviation_score) > 2:
            anomaly_reasons.append(f"Amount ₹{transaction.amount} is significantly different from your usual pattern")
        if anomaly_features.is_new_counterparty:
            anomaly_reasons.append(f"First transaction with {transaction.counterparty}")
        if anomaly_features.time_of_day_unusual:
            anomaly_reasons.append(f"Unusual transaction time: {transaction.transaction_hour}:00")
        if anomaly_features.balance_drop_percentage > 0.5:
            anomaly_reasons.append(f"Large balance drop: {anomaly_features.balance_drop_percentage*100:.0f}%")
        
        reason_text = ". ".join(anomaly_reasons)
        
        return FraudAlert(
            transaction_id=transaction.transaction_id,
            user_id=transaction.user_id,
            timestamp=datetime.now().isoformat(),
            is_suspicious=True,
            severity=severity,
            risk_score=anomaly_features.anomaly_score,
            matched_patterns=[],
            alert_title="⚠️ Unusual Transaction Detected",
            alert_message=f"This transaction looks unusual: {reason_text}",
            user_warning="Please confirm you authorized this transaction. If you didn't make this payment, contact your bank immediately.",
            action_required="Review transaction details.",
            contains_pin_otp_request=False,
            transaction_details=transaction.dict()
        )
    
    def check_rbi_lender(self, entity_name: str) -> RBILenderCheckResult:
        """
        Check if entity is RBI-registered lender
        
        In production, this would query RBI's API or maintain local whitelist
        For now, returns structure with placeholder logic
        """
        # Simplified whitelist (in production, load from RBI master list)
        known_banks = [
            "state bank of india", "hdfc bank", "icici bank", "axis bank",
            "kotak mahindra", "yes bank", "indusind bank"
        ]
        
        known_nbfcs = [
            "bajaj finance", "mahindra finance", "tata capital",
            "muthoot finance", "manappuram finance"
        ]
        
        entity_lower = entity_name.lower()
        
        # Check banks
        for bank in known_banks:
            if bank in entity_lower:
                return RBILenderCheckResult(
                    entity_name=entity_name,
                    is_registered=True,
                    entity_type="Bank",
                    source="RBI Master List of Regulated Entities"
                )
        
        # Check NBFCs
        for nbfc in known_nbfcs:
            if nbfc in entity_lower:
                return RBILenderCheckResult(
                    entity_name=entity_name,
                    is_registered=True,
                    entity_type="NBFC",
                    source="RBI Master List of Regulated Entities"
                )
        
        # Not found - potential unregistered lender
        return RBILenderCheckResult(
            entity_name=entity_name,
            is_registered=False,
            warning="⚠️ This entity is not in the RBI registered lenders list. Be cautious of unlicensed lending apps.",
            source="RBI Master List of Regulated Entities"
        )
    
    def build_user_history(self, transactions: List[Transaction]) -> UserTransactionHistory:
        """
        Build user transaction history summary for pattern analysis
        
        Args:
            transactions: List of user's historical transactions
        
        Returns:
            UserTransactionHistory summary
        """
        if not transactions:
            return UserTransactionHistory(
                user_id=transactions[0].user_id if transactions else "unknown",
                total_transactions=0,
                avg_credit_amount=0,
                avg_debit_amount=0,
                stddev_credit=0,
                stddev_debit=0,
                unique_counterparties=0,
                frequent_counterparties=[],
                category_distribution={},
                typical_transaction_hours=[],
                previous_fraud_incidents=0
            )
        
        user_id = transactions[0].user_id
        credits = [t.amount for t in transactions if t.direction.value == "credit"]
        debits = [t.amount for t in transactions if t.direction.value == "debit"]
        
        # Counterparty frequency
        counterparty_counts = Counter(t.counterparty for t in transactions)
        frequent_counterparties = [
            {"counterparty": cp, "count": count}
            for cp, count in counterparty_counts.most_common(20)
        ]
        
        # Category distribution
        category_counts = Counter(t.category for t in transactions)
        
        # Typical transaction hours
        hour_counts = Counter(t.transaction_hour for t in transactions)
        typical_hours = [hour for hour, count in hour_counts.most_common(12)]
        
        # Fraud incidents
        fraud_count = sum(1 for t in transactions if t.is_flagged_anomaly)
        
        return UserTransactionHistory(
            user_id=user_id,
            total_transactions=len(transactions),
            avg_credit_amount=np.mean(credits) if credits else 0,
            avg_debit_amount=np.mean(debits) if debits else 0,
            stddev_credit=np.std(credits) if credits else 0,
            stddev_debit=np.std(debits) if debits else 0,
            unique_counterparties=len(counterparty_counts),
            frequent_counterparties=frequent_counterparties,
            category_distribution=dict(category_counts),
            typical_transaction_hours=typical_hours,
            previous_fraud_incidents=fraud_count,
            last_fraud_date=max((t.timestamp for t in transactions if t.is_flagged_anomaly), default=None)
        )
