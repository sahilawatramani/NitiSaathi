from sqlalchemy import Boolean, Column, Date, DateTime, Float, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import relationship
from app.models.database import Base
from app.utils.time import utcnow

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    
    transactions = relationship("Transaction", back_populates="owner")
    pending_events = relationship("RealtimeTransactionEvent", back_populates="owner")
    notifications = relationship("UserNotification", back_populates="owner")
    profile = relationship("UserProfile", back_populates="owner", uselist=False)
    goals = relationship("UserGoal", back_populates="owner")
    custom_categories = relationship("UserCategory", back_populates="owner")
    weekly_features = relationship("UserWeeklyFeatures", back_populates="owner")
    temporal_events = relationship("TemporalMemoryEvent", back_populates="owner")
    recurring_debits = relationship("RecurringDebit", back_populates="owner")

class UserProfile(Base):
    __tablename__ = "user_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    
    age = Column(Integer, nullable=False, default=30)
    monthly_income = Column(Float, nullable=False, default=0)
    monthly_expenses = Column(Float, nullable=False, default=0)
    monthly_emi = Column(Float, nullable=False, default=0)
    current_savings = Column(Float, nullable=False, default=0)
    has_health_insurance = Column(Boolean, nullable=False, default=False)
    target_retirement_age = Column(Integer, nullable=False, default=60)
    risk_tolerance = Column(String, nullable=False, default="moderate") # low, moderate, high
    
    # Couple's Planning Fields
    is_couple = Column(Boolean, nullable=False, default=False)
    partner_age = Column(Integer, nullable=True)
    partner_income = Column(Float, nullable=True)

    # Nitisaathi Gig-Worker Extensions
    financial_persona = Column(String, nullable=False, default="moderate")  # conservative, moderate, growth
    current_savings_streak = Column(Integer, nullable=False, default=0)
    highest_savings_streak = Column(Integer, nullable=False, default=0)

    owner = relationship("User", back_populates="profile")


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    date = Column(DateTime, default=utcnow)
    amount = Column(Float, nullable=False)
    direction = Column(String, nullable=False, default="debit")  # credit / debit
    merchant = Column(String, index=True)
    description = Column(String)
    
    # AI Classified fields
    category = Column(String, index=True, nullable=True) 
    confidence_score = Column(Float, nullable=True)
    
    # Tax Insights fields
    is_tax_deductible = Column(Boolean, default=False)
    tax_category = Column(String, nullable=True)

    owner = relationship("User", back_populates="transactions")

class UserFeedback(Base):
    __tablename__ = "user_feedback"
    
    id = Column(Integer, primary_key=True, index=True)
    transaction_id = Column(Integer, index=True)
    source_event_id = Column(Integer, ForeignKey("realtime_transaction_events.id"), nullable=True, index=True)
    predicted_category = Column(String, nullable=True)
    corrected_category = Column(String)
    corrected_tax_status = Column(Boolean)
    reason_type = Column(String, nullable=True)
    created_at = Column(DateTime, default=utcnow, nullable=False)


class RealtimeTransactionEvent(Base):
    __tablename__ = "realtime_transaction_events"
    __table_args__ = (
        UniqueConstraint("user_id", "provider", "external_txn_id", name="uq_realtime_user_provider_external"),
    )

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    provider = Column(String, nullable=False, index=True)
    external_txn_id = Column(String, nullable=False, index=True)
    amount = Column(Float, nullable=False)
    merchant = Column(String, nullable=False)
    description = Column(String, nullable=True)
    txn_date = Column(DateTime, default=utcnow, nullable=False)
    status = Column(String, default="pending", nullable=False, index=True)
    suggested_categories = Column(Text, nullable=False)
    selected_category = Column(String, nullable=True)
    confidence_score = Column(Float, nullable=True)
    reminder_count = Column(Integer, default=0, nullable=False)
    last_notified_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=utcnow, nullable=False)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow, nullable=False)

    owner = relationship("User", back_populates="pending_events")


class UserNotification(Base):
    __tablename__ = "user_notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    notification_type = Column(String, nullable=False, index=True)
    title = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    payload = Column(Text, nullable=True)
    is_read = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=utcnow, nullable=False)

    owner = relationship("User", back_populates="notifications")


# ---------------------------------------------------------------------------
# Nitisaathi Budget Agent — New Models
# ---------------------------------------------------------------------------

class UserGoal(Base):
    """Tracks user saving goals with progress."""
    __tablename__ = "user_goals"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    name = Column(String, nullable=False)  # e.g. "Emergency Fund", "Bike Repair"
    target_amount = Column(Float, nullable=False)
    saved_amount = Column(Float, nullable=False, default=0)
    category = Column(String, nullable=True)  # optional grouping
    target_date = Column(Date, nullable=True)
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime, default=utcnow, nullable=False)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow, nullable=False)

    owner = relationship("User", back_populates="goals")


class UserCategory(Base):
    """Custom user-defined transaction categories."""
    __tablename__ = "user_categories"
    __table_args__ = (
        UniqueConstraint("user_id", "name", name="uq_user_category_name"),
    )

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    name = Column(String, nullable=False)
    direction = Column(String, nullable=False, default="debit")  # credit / debit
    icon = Column(String, nullable=True)  # emoji or icon name
    color = Column(String, nullable=True)  # hex color for frontend
    created_at = Column(DateTime, default=utcnow, nullable=False)

    owner = relationship("User", back_populates="custom_categories")


class UserWeeklyFeatures(Base):
    """Cached weekly financial features for WMA, volatility, and LangGraph state bridge."""
    __tablename__ = "user_weekly_features"
    __table_args__ = (
        UniqueConstraint("user_id", "week_start", name="uq_user_week"),
    )

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    week_start = Column(Date, nullable=False, index=True)

    # Income & expense aggregates
    total_income = Column(Float, nullable=False, default=0)
    total_expense = Column(Float, nullable=False, default=0)
    closing_balance = Column(Float, nullable=False, default=0)
    net_cashflow = Column(Float, nullable=False, default=0)

    # Category-level expense breakdown
    exp_rent = Column(Float, nullable=False, default=0)
    exp_fuel = Column(Float, nullable=False, default=0)
    exp_recharge = Column(Float, nullable=False, default=0)
    exp_food = Column(Float, nullable=False, default=0)
    exp_discretionary = Column(Float, nullable=False, default=0)
    exp_family_support = Column(Float, nullable=False, default=0)
    exp_insurance_premium = Column(Float, nullable=False, default=0)
    exp_loan_emi = Column(Float, nullable=False, default=0)

    # Computed features (WMA engine output)
    income_wma_4w = Column(Float, nullable=True)
    predicted_next_week_income = Column(Float, nullable=True)
    income_volatility_pct = Column(Float, nullable=True)
    savings_rate_recommendation = Column(Float, nullable=True)
    savings_rate_actual = Column(Float, nullable=True)  # actual savings / income
    low_balance_flag = Column(Boolean, nullable=False, default=False)

    # PMSBY / debit countdown
    days_to_next_pmsby_debit = Column(Float, nullable=True)
    pmsby_debit_due_soon = Column(Boolean, nullable=False, default=False)
    nudge_trigger_low_balance_before_debit = Column(Boolean, nullable=False, default=False)

    # EMI
    has_active_emi = Column(Boolean, nullable=False, default=False)
    monthly_emi_amount = Column(Float, nullable=False, default=0)
    emi_burden_pct = Column(Float, nullable=False, default=0)

    # Persona snapshot
    financial_persona = Column(String, nullable=True)

    # Premium metrics
    safe_to_spend_daily = Column(Float, nullable=True)
    discretionary_pct = Column(Float, nullable=True)
    had_informal_borrowing = Column(Boolean, nullable=False, default=False)

    created_at = Column(DateTime, default=utcnow, nullable=False)

    owner = relationship("User", back_populates="weekly_features")


class TemporalMemoryEvent(Base):
    """Significance-weighted temporal memory for financial events.

    Events decay exponentially over time but maintain a non-zero floor
    for high-significance events (e.g. missed EMI, emergency borrowing).
    """
    __tablename__ = "temporal_memory_events"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    event_type = Column(String, nullable=False, index=True)  # income_spike, low_balance, missed_emi, emergency_borrow, goal_achieved
    description = Column(Text, nullable=True)
    impact_score = Column(Float, nullable=False, default=1.0)  # base significance (1-10)
    amount = Column(Float, nullable=True)  # associated monetary amount
    timestamp = Column(DateTime, default=utcnow, nullable=False, index=True)

    owner = relationship("User", back_populates="temporal_events")


class RecurringDebit(Base):
    """Tracks discovered recurring debits (EMI, rent, subscriptions, PMSBY).

    Used by the Smart Subscription/EMI Radar to alert users before debits hit.
    """
    __tablename__ = "recurring_debits"
    __table_args__ = (
        UniqueConstraint("user_id", "name", name="uq_user_recurring_name"),
    )

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    name = Column(String, nullable=False)  # e.g. "Room Rent", "Bike EMI", "PMSBY"
    amount = Column(Float, nullable=False)
    category = Column(String, nullable=False)  # rent, loan_emi, insurance_premium
    frequency = Column(String, nullable=False, default="monthly")  # monthly, weekly, yearly
    due_day_of_month = Column(Integer, nullable=True)  # 1-31 for monthly debits
    next_due_date = Column(Date, nullable=True)
    is_active = Column(Boolean, nullable=False, default=True)
    auto_detected = Column(Boolean, nullable=False, default=False)  # True if discovered by pattern scan
    created_at = Column(DateTime, default=utcnow, nullable=False)

    owner = relationship("User", back_populates="recurring_debits")
