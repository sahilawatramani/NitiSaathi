from app.services.sms_parser_service import parse_bank_sms


def test_parse_debit_sms_success():
    sms = "Your A/C XXXX1234 is debited by INR 245.50 at SWIGGY on 24-03-2026 18:22. Avl bal INR 12000"
    parsed = parse_bank_sms(sms)

    assert parsed["is_transaction"] is True
    assert parsed["direction"] == "debit"
    assert parsed["amount"] == 245.50
    assert "Swiggy" in parsed["merchant"]


def test_parse_non_transaction_sms():
    sms = "Your OTP for login is 123456. Do not share with anyone."
    parsed = parse_bank_sms(sms)

    assert parsed["is_transaction"] is False
    assert parsed["reason"] == "No amount found"
