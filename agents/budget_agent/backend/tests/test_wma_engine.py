"""
Unit tests for the WMA (Weighted Moving Average) computational engine.

Validates:
  - WMA weights [1, 2, 3, 4] are applied correctly
  - Volatility (CV) bounds and edge cases
  - Savings-rate recommendations against CV thresholds
  - Low-balance flag relative threshold (30% of WMA)
  - Safe-to-spend daily metric formula
"""
import math
import pytest

from app.services.wma_service import (
    compute_income_wma_4w,
    compute_volatility,
    savings_rate_recommendation,
    compute_low_balance_flag,
    calculate_safe_to_spend,
)


# ─── compute_income_wma_4w ────────────────────────────────────────────────────

class TestComputeIncomeWma4w:
    def test_exact_weights_four_weeks(self):
        """WMA with weights [1,2,3,4] on four equal values should equal that value."""
        incomes = [1000.0, 1000.0, 1000.0, 1000.0]
        assert compute_income_wma_4w(incomes) == 1000.0

    def test_weights_applied_correctly(self):
        """Most recent week (weight 4) should dominate."""
        # [1,2,3,4] applied to [100, 200, 300, 400]
        # = (1*100 + 2*200 + 3*300 + 4*400) / (1+2+3+4)
        # = (100 + 400 + 900 + 1600) / 10 = 3000 / 10 = 300.0
        incomes = [100.0, 200.0, 300.0, 400.0]
        assert compute_income_wma_4w(incomes) == 300.0

    def test_uses_last_four_when_more_available(self):
        """With > 4 weeks of data, only the last 4 should be used."""
        # older weeks (999) should be ignored
        incomes = [999.0, 999.0, 100.0, 200.0, 300.0, 400.0]
        expected = compute_income_wma_4w([100.0, 200.0, 300.0, 400.0])
        assert compute_income_wma_4w(incomes) == expected

    def test_fallback_simple_average_less_than_four(self):
        """Fewer than 4 weeks → simple average."""
        incomes = [600.0, 1200.0]
        assert compute_income_wma_4w(incomes) == 900.0

    def test_single_week(self):
        incomes = [5000.0]
        assert compute_income_wma_4w(incomes) == 5000.0

    def test_empty_returns_zero(self):
        assert compute_income_wma_4w([]) == 0.0

    def test_result_rounded_to_two_decimals(self):
        incomes = [333.33, 333.33, 333.33, 333.33]
        result = compute_income_wma_4w(incomes)
        assert result == round(result, 2)


# ─── compute_volatility ───────────────────────────────────────────────────────

class TestComputeVolatility:
    def test_zero_volatility_constant_income(self):
        """Identical weekly incomes → CV = 0."""
        incomes = [1000.0] * 8
        assert compute_volatility(incomes) == 0.0

    def test_volatility_positive_for_varying_income(self):
        incomes = [500.0, 1000.0, 750.0, 1250.0, 800.0, 600.0, 900.0, 1100.0]
        cv = compute_volatility(incomes)
        assert cv > 0.0

    def test_volatility_uses_trailing_window(self):
        """Only last 8 weeks (window) should be used."""
        # First two values are extreme outliers; if ignored, volatility should be low
        incomes = [0.001, 0.001, 1000.0, 1000.0, 1000.0, 1000.0, 1000.0, 1000.0, 1000.0, 1000.0]
        cv = compute_volatility(incomes, window=8)
        assert cv == 0.0  # last 8 are all 1000

    def test_empty_returns_zero(self):
        assert compute_volatility([]) == 0.0

    def test_zero_mean_returns_zero(self):
        assert compute_volatility([0.0, 0.0, 0.0]) == 0.0

    def test_cv_formula(self):
        """Manual CV check: std/mean for [100, 200]."""
        incomes = [100.0, 200.0]
        mean = 150.0
        variance = ((100 - mean) ** 2 + (200 - mean) ** 2) / 2
        expected_cv = round(math.sqrt(variance) / mean, 4)
        assert compute_volatility(incomes, window=2) == expected_cv

    def test_result_rounded_to_four_decimals(self):
        incomes = [100.0, 200.0, 150.0]
        cv = compute_volatility(incomes, window=3)
        assert cv == round(cv, 4)


# ─── savings_rate_recommendation ─────────────────────────────────────────────

class TestSavingsRateRecommendation:
    def test_stable_income_20_percent(self):
        """CV < 15% → 20% savings rate."""
        assert savings_rate_recommendation(0.10) == 0.20
        assert savings_rate_recommendation(0.0) == 0.20
        assert savings_rate_recommendation(0.149) == 0.20

    def test_moderate_volatility_10_percent(self):
        """15% ≤ CV ≤ 30% → 10% savings rate."""
        assert savings_rate_recommendation(0.15) == 0.10
        assert savings_rate_recommendation(0.22) == 0.10
        assert savings_rate_recommendation(0.30) == 0.10

    def test_high_volatility_5_percent(self):
        """CV > 30% → 5% savings rate."""
        assert savings_rate_recommendation(0.31) == 0.05
        assert savings_rate_recommendation(0.80) == 0.05
        assert savings_rate_recommendation(1.0) == 0.05

    def test_boundary_exactly_15_pct(self):
        assert savings_rate_recommendation(0.15) == 0.10

    def test_boundary_exactly_30_pct(self):
        assert savings_rate_recommendation(0.30) == 0.10


# ─── compute_low_balance_flag ─────────────────────────────────────────────────

class TestComputeLowBalanceFlag:
    def test_flag_true_below_30_pct(self):
        """Closing balance < 30% of WMA → True."""
        wma = 10_000.0
        assert compute_low_balance_flag(2_999.0, wma) is True

    def test_flag_false_above_30_pct(self):
        assert compute_low_balance_flag(3_001.0, 10_000.0) is False

    def test_flag_false_exactly_30_pct(self):
        """Exactly at threshold is NOT flagged (strict <)."""
        assert compute_low_balance_flag(3_000.0, 10_000.0) is False

    def test_flag_true_zero_balance(self):
        assert compute_low_balance_flag(0.0, 10_000.0) is True

    def test_flag_true_negative_balance(self):
        assert compute_low_balance_flag(-500.0, 10_000.0) is True

    def test_zero_wma_flags_nonpositive_balance(self):
        """If WMA is 0, flag is True only when balance ≤ 0."""
        assert compute_low_balance_flag(0.0, 0.0) is True
        assert compute_low_balance_flag(-1.0, 0.0) is True
        assert compute_low_balance_flag(1.0, 0.0) is False


# ─── calculate_safe_to_spend ──────────────────────────────────────────────────

class TestCalculateSafeToSpend:
    def test_basic_formula(self):
        """(WMA - mandatory - savings) / days_remaining."""
        wma = 10_000.0
        mandatory = 2_000.0
        savings_rate = 0.10  # 10% → ₹1000
        # available = 10000 - 2000 - 1000 = 7000; + closing_balance surplus
        closing = 0.0
        days = 7
        result = calculate_safe_to_spend(closing, wma, mandatory, savings_rate, days)
        assert result == round(7_000.0 / 7, 2)

    def test_surplus_closing_balance_added(self):
        """Positive closing balance is factored in."""
        wma = 10_000.0
        mandatory = 2_000.0
        savings_rate = 0.10
        closing = 1_000.0  # extra buffer
        days = 7
        result = calculate_safe_to_spend(closing, wma, mandatory, savings_rate, days)
        # available = max(7000, 0) + max(1000, 0) = 8000 / 7
        assert result == round(8_000.0 / 7, 2)

    def test_negative_closing_balance_excluded(self):
        """Negative closing balance doesn't decrease safe-to-spend."""
        wma = 10_000.0
        mandatory = 2_000.0
        savings_rate = 0.10
        closing = -500.0  # overdrawn — not added
        days = 7
        result = calculate_safe_to_spend(closing, wma, mandatory, savings_rate, days)
        assert result == round(7_000.0 / 7, 2)

    def test_result_zero_when_mandatory_exceeds_income(self):
        """No negative safe-to-spend — floors at zero."""
        wma = 1_000.0
        mandatory = 5_000.0  # mandatory > income
        result = calculate_safe_to_spend(0.0, wma, mandatory, 0.20, 7)
        assert result == 0.0

    def test_days_remaining_1_returns_full_amount(self):
        """On the last day of the week, all available spend is today's budget."""
        wma = 7_000.0
        result = calculate_safe_to_spend(0.0, wma, 0.0, 0.0, 1)
        assert result == 7_000.0

    def test_result_rounded_to_two_decimals(self):
        result = calculate_safe_to_spend(100.0, 9_000.0, 1_500.0, 0.10, 7)
        assert result == round(result, 2)
