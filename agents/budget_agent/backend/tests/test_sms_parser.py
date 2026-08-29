"""
Tests for the enhanced SMS parser covering all major Indian banks,
UPI apps, gig platform payouts, and edge cases.
"""
import pytest
from app.services.sms_parser_service import parse_bank_sms


# ─── Debit SMS — Major Banks ──────────────────────────────────────────────────

class TestDebitSMS:

    def test_hdfc_upi_debit(self):
        sms = "Rs.500.00 debited from HDFC Bank A/C X1234 to swiggy@icici on 15-Jan-2024. Avl Bal:Rs.12,340.00"
        r = parse_bank_sms(sms, sender="HDFCBK")
        assert r["is_transaction"]
        assert r["direction"] == "debit"
        assert r["amount"] == 500.00
        assert r["balance"] == 12340.00
        assert r["bank"] == "HDFC Bank"

    def test_sbi_debit(self):
        sms = "Your SBI A/c XX9876 is debited by INR 1,200.00 on 20/03/2024. UPI Ref No: 123456789012"
        r = parse_bank_sms(sms, sender="SBIINB")
        assert r["is_transaction"]
        assert r["direction"] == "debit"
        assert r["amount"] == 1200.00
        assert r["bank"] == "SBI"
        assert r["upi_ref"] is not None

    def test_icici_debit(self):
        sms = "ICICI Bank: INR 750 debited from A/c XX5678 at ZOMATO on 01 Feb 2024 14:30:00. Avl bal: INR 8,900"
        r = parse_bank_sms(sms, sender="ICICIB")
        assert r["is_transaction"]
        assert r["direction"] == "debit"
        assert r["amount"] == 750.0
        assert r["bank"] == "ICICI Bank"

    def test_axis_upi_debit(self):
        sms = "Axis Bank: Rs 299 debited from A/c no. XX3421 to PhonePe UPI/user@ybl on 12-Mar-2024."
        r = parse_bank_sms(sms, sender="AXISBK")
        assert r["is_transaction"]
        assert r["direction"] == "debit"
        assert r["amount"] == 299.0
        assert r["bank"] == "Axis Bank"

    def test_kotak_debit(self):
        sms = "Dear Customer, Rs. 2500.00 has been debited from your Kotak Bank A/c ending 7890 on 05-Apr-2024."
        r = parse_bank_sms(sms, sender="KOTAKB")
        assert r["is_transaction"]
        assert r["direction"] == "debit"
        assert r["amount"] == 2500.0
        assert r["bank"] == "Kotak Bank"

    def test_amount_with_commas(self):
        sms = "Rs.12,500.00 debited from your account via UPI on 10-01-2024"
        r = parse_bank_sms(sms)
        assert r["is_transaction"]
        assert r["amount"] == 12500.0

    def test_account_last4_extracted(self):
        sms = "INR 300 debited from A/c XXXX1234 at petrol pump on 05-05-2024"
        r = parse_bank_sms(sms)
        assert r["account_last4"] == "1234"


# ─── Credit SMS — Bank Transfers ─────────────────────────────────────────────

class TestCreditSMS:

    def test_hdfc_credit(self):
        sms = "Rs.15,000.00 credited to HDFC Bank A/C X1234 by NEFT from EMPLOYER CO on 01-Feb-2024."
        r = parse_bank_sms(sms, sender="HDFCBK")
        assert r["is_transaction"]
        assert r["direction"] == "credit"
        assert r["amount"] == 15000.0

    def test_upi_received(self):
        sms = "Rs.500 received in your A/c via UPI from friend@oksbi on 20-Mar-2024. Avl Bal: Rs.6,500"
        r = parse_bank_sms(sms)
        assert r["is_transaction"]
        assert r["direction"] == "credit"
        assert r["amount"] == 500.0
        assert r["balance"] == 6500.0

    def test_imps_credit(self):
        sms = "IMPS CR: INR 8000.00 credited to your account from JOHN DOE on 15/04/2024 12:00:00"
        r = parse_bank_sms(sms)
        assert r["is_transaction"]
        assert r["direction"] == "credit"
        assert r["amount"] == 8000.0

    def test_refund_credit(self):
        sms = "Refund of Rs.199 credited to your A/c from AMAZON PAY on 03-Jan-2024."
        r = parse_bank_sms(sms)
        assert r["is_transaction"]
        assert r["direction"] == "credit"
        assert r["amount"] == 199.0


# ─── Gig Platform Payouts ─────────────────────────────────────────────────────

class TestGigPlatformCredits:

    def test_swiggy_payout(self):
        sms = "Rs.3,450.00 credited to your bank account from SWIGGY DELIVERY SERVICES on 25-Jan-2024"
        r = parse_bank_sms(sms, sender="SWIGGY")
        assert r["is_transaction"]
        assert r["direction"] == "credit"
        assert r["amount"] == 3450.0

    def test_ola_payout(self):
        sms = "INR 1,200 received in your A/c via UPI from ola.partner@okaxis on 18-Feb-2024"
        r = parse_bank_sms(sms, sender="OLAMONY")
        assert r["is_transaction"]
        assert r["direction"] == "credit"
        assert r["amount"] == 1200.0

    def test_zomato_payout(self):
        sms = "Rs.2,890 credited to A/c XX5678 from ZOMATO MEDIA PVT LTD on 28-Mar-2024. Avl Bal: Rs.5,200"
        r = parse_bank_sms(sms, sender="ZOMATO")
        assert r["is_transaction"]
        assert r["direction"] == "credit"
        assert r["amount"] == 2890.0


# ─── Date Parsing ─────────────────────────────────────────────────────────────

class TestDateParsing:

    def test_dd_mon_yyyy_format(self):
        """HDFC/ICICI style: 15 Jan 2024"""
        sms = "Rs.500 debited on 15 Jan 2024 at merchant"
        r = parse_bank_sms(sms)
        assert r["is_transaction"]
        assert r["txn_date"].month == 1
        assert r["txn_date"].day == 15
        assert r["txn_date"].year == 2024

    def test_dd_slash_mm_yyyy_format(self):
        sms = "INR 1000 debited from your account on 25/12/2024"
        r = parse_bank_sms(sms)
        assert r["is_transaction"]
        assert r["txn_date"].month == 12
        assert r["txn_date"].day == 25

    def test_dd_dash_mon_yyyy_format(self):
        """15-Jan-2024 format"""
        sms = "Rs.300 debited at grocery on 15-Mar-2024 10:30:00"
        r = parse_bank_sms(sms)
        assert r["is_transaction"]
        assert r["txn_date"].month == 3

    def test_iso_format(self):
        sms = "Rs.750 debited from account on 2024-06-15 09:00:00"
        r = parse_bank_sms(sms)
        assert r["is_transaction"]
        assert r["txn_date"].year == 2024
        assert r["txn_date"].month == 6


# ─── Non-Transaction SMS ──────────────────────────────────────────────────────

class TestNonTransactionSMS:

    def test_otp_sms_ignored(self):
        sms = "Your OTP for login is 123456. Valid for 10 minutes. Do not share."
        r = parse_bank_sms(sms)
        assert not r["is_transaction"]

    def test_no_amount_ignored(self):
        sms = "Your account has been successfully registered for net banking."
        r = parse_bank_sms(sms)
        assert not r["is_transaction"]

    def test_promo_sms_ignored(self):
        sms = "Special offer! Get Rs.200 cashback earned on your next transaction. Valid till 31 Dec."
        r = parse_bank_sms(sms)
        assert not r["is_transaction"]

    def test_minimum_due_ignored(self):
        sms = "Your minimum due of Rs.500 for credit card is due on 15-Jan-2024. Pay now."
        r = parse_bank_sms(sms)
        assert not r["is_transaction"]

    def test_zero_amount_ignored(self):
        sms = "Rs.0 debited from your account on 15-Jan-2024"
        r = parse_bank_sms(sms)
        assert not r["is_transaction"]


# ─── Merchant Extraction ──────────────────────────────────────────────────────

class TestMerchantExtraction:

    def test_upi_vpa_merchant(self):
        sms = "Rs.150 debited to swiggy.123@icici via UPI on 10-Jan-2024"
        r = parse_bank_sms(sms)
        assert r["is_transaction"]
        assert "swiggy" in r["merchant"].lower()

    def test_at_merchant_pattern(self):
        sms = "Rs.500 spent at RELIANCE PETROL on 15-Feb-2024"
        r = parse_bank_sms(sms)
        assert r["is_transaction"]
        assert "Reliance Petrol" in r["merchant"] or "Reliance" in r["merchant"]

    def test_to_merchant_pattern(self):
        sms = "INR 200 paid to RATION SHOP via UPI on 20-Mar-2024"
        r = parse_bank_sms(sms)
        assert r["is_transaction"]
        # merchant should not be a stopword
        assert r["merchant"] != "Unknown Merchant"


# ─── Balance Extraction ───────────────────────────────────────────────────────

class TestBalanceExtraction:

    def test_avl_bal_extracted(self):
        sms = "Rs.500 debited. Avl Bal:Rs.4,500.00"
        r = parse_bank_sms(sms)
        assert r["balance"] == 4500.0

    def test_available_balance_extracted(self):
        sms = "INR 1000 debited. Available Balance: INR 9,200.50"
        r = parse_bank_sms(sms)
        assert r["balance"] == 9200.50

    def test_no_balance_returns_none(self):
        sms = "Rs.300 debited from your account via UPI on 10-Jan-2024"
        r = parse_bank_sms(sms)
        assert r["balance"] is None


# ─── Bank Detection ───────────────────────────────────────────────────────────

class TestBankDetection:

    def test_hdfc_detected_from_sender(self):
        r = parse_bank_sms("Rs.500 debited via UPI on 01-Jan-2024", sender="HDFCBK")
        assert r["bank"] == "HDFC Bank"

    def test_sbi_detected_from_text(self):
        r = parse_bank_sms("Your SBI account has been debited by Rs.200 on 01-Jan-2024")
        assert r["bank"] == "SBI"

    def test_phonepe_detected(self):
        r = parse_bank_sms("Rs.150 debited via PhonePe UPI on 01-Jan-2024")
        assert r["bank"] == "PhonePe"
