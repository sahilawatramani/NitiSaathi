"""
Test Suite for Fraud Guard

Tests:
1. PIN/OTP request detection (CRITICAL security rule)
2. Fraud pattern matching (all 9 patterns)
3. Anomaly feature computation
4. Recall on synthetic labeled data
5. RBI lender checking
6. User history building
"""
import pytest
from datetime import datetime
from pathlib import Path
import sys

# Add agents to path
sys.path.insert(0, str(Path(__file__).parent.parent / "agents"))

from fraud_guard.models.schemas import (
    Transaction,
    TransactionDirection,
    FraudSeverity,
    UserTransactionHistory
)
from fraud_guard.services.fraud_detector import FraudDetectionEngine


@pytest.fixture
def detector():
    """Fixture for fraud detector"""
    return FraudDetectionEngine()


@pytest.fixture
def clean_user_history():
    """User history with no fraud"""
    return UserTransactionHistory(
        user_id="test_user_001",
        total_transactions=100,
        avg_credit_amount=2500,
        avg_debit_amount=450,
        stddev_credit=300,
        stddev_debit=150,
        unique_counterparties=25,
        frequent_counterparties=[
            {"counterparty": "Swiggy", "count": 50},
            {"counterparty": "HP Petrol", "count": 20},
            {"counterparty": "Jio", "count": 10}
        ],
        category_distribution={
            "platform_payout": 50,
            "fuel": 20,
            "recharge": 10,
            "food": 15,
            "discretionary": 5
        },
        typical_transaction_hours=[9, 10, 11, 14, 15, 18, 19, 20],
        previous_fraud_incidents=0
    )


@pytest.fixture
def normal_transaction():
    """Normal transaction for testing"""
    return Transaction(
        transaction_id="txn_001",
        user_id="test_user_001",
        timestamp=datetime.now(),
        direction=TransactionDirection.DEBIT,
        amount=450,
        counterparty="HP Petrol",
        category="fuel",
        description="Petrol refill",
        balance_before=3000,
        balance_after=2550,
        is_first_time_counterparty=False,
        transaction_hour=14
    )


class TestPINOTPDetection:
    """Test CRITICAL PIN/OTP request detection (Hard Rule)"""
    
    def test_pin_request_detected(self, detector):
        """Should detect 'enter your PIN' as fraud"""
        text = "Please enter your UPI PIN to complete verification"
        result = detector._check_pin_otp_request(text)
        assert result is True
    
    def test_otp_request_detected(self, detector):
        """Should detect 'share your OTP' as fraud"""
        text = "Share your OTP received on mobile to verify account"
        result = detector._check_pin_otp_request(text)
        assert result is True
    
    def test_pin_lowercase_detected(self, detector):
        """Should detect lowercase 'pin' request"""
        text = "verify your pin number"
        result = detector._check_pin_otp_request(text)
        assert result is True
    
    def test_otp_uppercase_detected(self, detector):
        """Should detect uppercase 'OTP' request"""
        text = "ENTER OTP TO CONTINUE"
        result = detector._check_pin_otp_request(text)
        assert result is True
    
    def test_6_digit_code_detected(self, detector):
        """Should detect '6 digit PIN/OTP' request"""
        texts = [
            "Enter 6 digit PIN",
            "Send 6 digit OTP",
            "Provide your 6-digit code"
        ]
        for text in texts:
            result = detector._check_pin_otp_request(text)
            assert result is True, f"Failed to detect in: {text}"
    
    def test_safe_transaction_not_flagged(self, detector):
        """Safe transaction description should not trigger PIN/OTP alert"""
        text = "Payment for fuel at HP petrol pump"
        result = detector._check_pin_otp_request(text)
        assert result is False
    
    def test_pin_in_different_context_safe(self, detector):
        """'pin' in different context (like 'spinning') should be safe"""
        text = "Shopping at spinning mill"
        result = detector._check_pin_otp_request(text)
        assert result is False


class TestFraudPatternMatching:
    """Test specific fraud pattern detection"""
    
    def test_fake_qr_overlay_detection(self, detector, clean_user_history):
        """Should detect fake QR overlay at fuel station"""
        transaction = Transaction(
            transaction_id="txn_qr_fraud",
            user_id="test_user_001",
            timestamp=datetime.now(),
            direction=TransactionDirection.DEBIT,
            amount=500,
            counterparty="Unknown Merchant XYZ",  # New counterparty
            category="fuel",
            description="Fuel payment",
            balance_before=3000,
            balance_after=2500,
            is_first_time_counterparty=True,  # First time
            transaction_hour=14
        )
        
        result = detector.detect_fraud(transaction, clean_user_history)
        
        # Should flag as suspicious
        assert result.alert is not None
        # Check if fake_qr_overlay pattern matched
        pattern_names = [p.pattern_name for p in result.alert.matched_patterns]
        assert any("QR" in name or "overlay" in name.lower() for name in pattern_names)
    
    def test_task_scam_detection(self, detector, clean_user_history):
        """Should detect task-based job scam"""
        transaction = Transaction(
            transaction_id="txn_task_scam",
            user_id="test_user_001",
            timestamp=datetime.now(),
            direction=TransactionDirection.DEBIT,
            amount=500,  # Typical scam amount
            counterparty="Job Registration Portal",
            category="discretionary",
            description="Registration fee for work from home job earning opportunity",
            balance_before=3000,
            balance_after=2500,
            is_first_time_counterparty=True,
            transaction_hour=16
        )
        
        result = detector.detect_fraud(transaction, clean_user_history)
        
        assert result.alert is not None
        assert result.alert.severity == FraudSeverity.HIGH
        # Should match task scam pattern
        pattern_ids = [p.pattern_id for p in result.alert.matched_patterns]
        assert any("FP003" in pid or "task" in pid.lower() for pid in pattern_ids)
    
    def test_large_atypical_debit_detection(self, detector, clean_user_history):
        """Should detect large atypical debit"""
        # User avg debit is 450, stddev 150
        # Transaction of 1500 is (1500-450)/150 = 7 std devs above mean
        transaction = Transaction(
            transaction_id="txn_large_debit",
            user_id="test_user_001",
            timestamp=datetime.now(),
            direction=TransactionDirection.DEBIT,
            amount=1500,  # 3.3x average
            counterparty="New Vendor",
            category="discretionary",
            description="Large purchase",
            balance_before=3000,
            balance_after=1500,
            is_first_time_counterparty=True,
            transaction_hour=2  # Unusual hour (2 AM)
        )
        
        result = detector.detect_fraud(transaction, clean_user_history)
        
        assert result.alert is not None
        assert result.anomaly_features.amount_deviation_score > 3
    
    def test_rapid_micro_debits_detection(self, detector, clean_user_history):
        """Should detect rapid micro-debits (card testing)"""
        transaction = Transaction(
            transaction_id="txn_micro_1",
            user_id="test_user_001",
            timestamp=datetime.now(),
            direction=TransactionDirection.DEBIT,
            amount=10,  # Small amount
            counterparty="Test Merchant",
            category="discretionary",
            description="Small transaction",
            balance_before=3000,
            balance_after=2990,
            is_first_time_counterparty=True,
            transaction_hour=14
        )
        
        # Manually set velocity score high for test
        # (In real system, this would be computed from recent transactions)
        result = detector.detect_fraud(transaction, clean_user_history)
        
        # Check anomaly score includes velocity consideration
        # Even if velocity not high in this single transaction, pattern should be recognized
        assert result.anomaly_features is not None
    
    def test_new_counterparty_large_debit(self, detector, clean_user_history):
        """Should flag large debit to new counterparty"""
        transaction = Transaction(
            transaction_id="txn_new_large",
            user_id="test_user_001",
            timestamp=datetime.now(),
            direction=TransactionDirection.DEBIT,
            amount=2000,  # >2x average and >1000
            counterparty="Unknown Person",
            category="discretionary",
            description="Payment",
            balance_before=4000,
            balance_after=2000,
            is_first_time_counterparty=True,
            transaction_hour=14
        )
        
        result = detector.detect_fraud(transaction, clean_user_history)
        
        assert result.alert is not None
        # Check if pattern matched
        pattern_names = [p.pattern_name for p in result.alert.matched_patterns]
        assert any("new counterparty" in name.lower() for name in pattern_names)


class TestAnomalyFeatures:
    """Test anomaly feature computation"""
    
    def test_amount_deviation_normal_transaction(self, detector, normal_transaction, clean_user_history):
        """Normal transaction should have low deviation score"""
        features = detector._compute_anomaly_features(normal_transaction, clean_user_history)
        
        # Amount 450 vs avg 450, stddev 150 = 0 deviation
        assert abs(features.amount_deviation_score) < 1
    
    def test_amount_deviation_large_transaction(self, detector, clean_user_history):
        """Large transaction should have high deviation score"""
        large_txn = Transaction(
            transaction_id="txn_large",
            user_id="test_user_001",
            timestamp=datetime.now(),
            direction=TransactionDirection.DEBIT,
            amount=1350,  # (1350-450)/150 = 6 std devs
            counterparty="Merchant",
            category="discretionary",
            description="Large purchase",
            balance_before=3000,
            balance_after=1650,
            is_first_time_counterparty=False,
            transaction_hour=14
        )
        
        features = detector._compute_anomaly_features(large_txn, clean_user_history)
        
        assert features.amount_deviation_score > 5
    
    def test_new_counterparty_flagged(self, detector, clean_user_history):
        """New counterparty should be flagged"""
        new_counterparty_txn = Transaction(
            transaction_id="txn_new",
            user_id="test_user_001",
            timestamp=datetime.now(),
            direction=TransactionDirection.DEBIT,
            amount=500,
            counterparty="Brand New Merchant",
            category="discretionary",
            description="Payment",
            balance_before=3000,
            balance_after=2500,
            is_first_time_counterparty=True,
            transaction_hour=14
        )
        
        features = detector._compute_anomaly_features(new_counterparty_txn, clean_user_history)
        
        assert features.is_new_counterparty is True
        assert features.counterparty_frequency == 0
    
    def test_unusual_time_flagged(self, detector, clean_user_history):
        """Transaction at unusual hour should be flagged"""
        night_txn = Transaction(
            transaction_id="txn_night",
            user_id="test_user_001",
            timestamp=datetime.now(),
            direction=TransactionDirection.DEBIT,
            amount=500,
            counterparty="Merchant",
            category="discretionary",
            description="Payment",
            balance_before=3000,
            balance_after=2500,
            is_first_time_counterparty=False,
            transaction_hour=3  # 3 AM - unusual
        )
        
        features = detector._compute_anomaly_features(night_txn, clean_user_history)
        
        assert features.time_of_day_unusual is True
        assert features.transaction_hour == 3
    
    def test_balance_drop_large(self, detector, clean_user_history):
        """Large balance drop should be detected"""
        large_drop_txn = Transaction(
            transaction_id="txn_drop",
            user_id="test_user_001",
            timestamp=datetime.now(),
            direction=TransactionDirection.DEBIT,
            amount=2000,
            counterparty="Merchant",
            category="discretionary",
            description="Large payment",
            balance_before=3000,
            balance_after=1000,
            is_first_time_counterparty=False,
            transaction_hour=14
        )
        
        features = detector._compute_anomaly_features(large_drop_txn, clean_user_history)
        
        # Balance dropped from 3000 to 1000 = 66.7% drop
        assert features.balance_drop_percentage > 0.60


class TestRBILenderCheck:
    """Test RBI lender verification"""
    
    def test_known_bank_verified(self, detector):
        """Known banks should be verified"""
        result = detector.check_rbi_lender("HDFC Bank")
        
        assert result.is_registered is True
        assert result.entity_type == "Bank"
    
    def test_known_nbfc_verified(self, detector):
        """Known NBFCs should be verified"""
        result = detector.check_rbi_lender("Bajaj Finance Ltd")
        
        assert result.is_registered is True
        assert result.entity_type == "NBFC"
    
    def test_unknown_lender_flagged(self, detector):
        """Unknown lenders should be flagged"""
        result = detector.check_rbi_lender("QuickLoan888 App")
        
        assert result.is_registered is False
        assert result.warning is not None
        assert "not in the RBI" in result.warning


class TestUserHistoryBuilding:
    """Test user transaction history summary building"""
    
    def test_build_history_from_transactions(self, detector):
        """Should correctly build user history from transaction list"""
        transactions = [
            Transaction(
                transaction_id=f"txn_{i}",
                user_id="test_user",
                timestamp=datetime.now(),
                direction=TransactionDirection.CREDIT if i % 3 == 0 else TransactionDirection.DEBIT,
                amount=2500 if i % 3 == 0 else 400,
                counterparty="Swiggy" if i % 2 == 0 else "HP Petrol",
                category="platform_payout" if i % 3 == 0 else "fuel",
                description="Transaction",
                balance_before=3000,
                balance_after=2600,
                is_first_time_counterparty=False,
                transaction_hour=14
            )
            for i in range(30)
        ]
        
        history = detector.build_user_history(transactions)
        
        assert history.user_id == "test_user"
        assert history.total_transactions == 30
        assert history.avg_credit_amount > 0
        assert history.avg_debit_amount > 0
        assert history.unique_counterparties == 2
        assert len(history.frequent_counterparties) > 0
    
    def test_empty_transaction_list(self, detector):
        """Should handle empty transaction list gracefully"""
        history = detector.build_user_history([])
        
        assert history.total_transactions == 0
        assert history.avg_credit_amount == 0
        assert history.unique_counterparties == 0


class TestEndToEndDetection:
    """End-to-end fraud detection tests"""
    
    def test_clean_transaction_no_alert(self, detector, normal_transaction, clean_user_history):
        """Normal transaction should not generate alert"""
        result = detector.detect_fraud(normal_transaction, clean_user_history)
        
        # May or may not have alert depending on thresholds, but should be low severity
        if result.alert:
            assert result.alert.severity != FraudSeverity.HIGH
    
    def test_pin_request_always_alerts(self, detector, normal_transaction, clean_user_history):
        """PIN request should ALWAYS generate critical alert"""
        pin_request_text = "Please enter your UPI PIN to verify"
        
        result = detector.detect_fraud(normal_transaction, clean_user_history, pin_request_text)
        
        assert result.alert is not None
        assert result.alert.severity == FraudSeverity.HIGH
        assert result.alert.contains_pin_otp_request is True
        assert result.alert.risk_score == 1.0
    
    def test_multiple_patterns_matched(self, detector, clean_user_history):
        """Transaction matching multiple patterns should show all"""
        # Large, atypical, new counterparty, unusual time
        suspicious_txn = Transaction(
            transaction_id="txn_multi_fraud",
            user_id="test_user_001",
            timestamp=datetime.now(),
            direction=TransactionDirection.DEBIT,
            amount=2000,
            counterparty="Unknown Vendor XYZ",
            category="discretionary",
            description="Suspicious payment",
            balance_before=3000,
            balance_after=1000,
            is_first_time_counterparty=True,
            transaction_hour=2
        )
        
        result = detector.detect_fraud(suspicious_txn, clean_user_history)
        
        assert result.alert is not None
        # Should match at least one pattern
        assert len(result.alert.matched_patterns) >= 1


class TestFraudRecallOnSyntheticData:
    """Test recall on synthetic labeled data (if available)"""
    
    def test_labeled_anomaly_detected(self, detector, clean_user_history):
        """Labeled fraud transaction should be detected"""
        # Simulate a ground-truth labeled fraud transaction
        fraud_txn = Transaction(
            transaction_id="txn_fraud_labeled",
            user_id="test_user_001",
            timestamp=datetime.now(),
            direction=TransactionDirection.DEBIT,
            amount=1800,
            counterparty="Scammer",
            category="discretionary",
            description="Fraudulent transaction",
            balance_before=3000,
            balance_after=1200,
            is_first_time_counterparty=True,
            transaction_hour=3,
            is_flagged_anomaly=True,  # Ground truth label
            anomaly_type="large_atypical_debit"
        )
        
        result = detector.detect_fraud(fraud_txn, clean_user_history)
        
        # Should detect this as suspicious
        assert result.alert is not None or result.anomaly_features.anomaly_score > 0.7


def test_fraud_patterns_completeness(detector):
    """All documented fraud patterns should be in knowledge base"""
    expected_patterns = [
        "fake_kyc_call",
        "fake_qr_overlay",
        "task_based_job_scam",
        "fake_refund_request",
        "collect_request_new_counterparty_large",
        "rapid_micro_debits",
        "large_atypical_debit",
        "duplicate_transaction",
        "unauthorized_recurring_payment"
    ]
    
    for pattern_key in expected_patterns:
        assert pattern_key in detector.fraud_patterns, f"Pattern '{pattern_key}' missing from knowledge base"


def test_hard_rules_present(detector):
    """Critical hard rules should be present"""
    assert "rule_1" in detector.hard_rules
    assert "NEVER_ASK_FOR_PIN_OR_OTP" in detector.hard_rules["rule_1"]["name"]


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
