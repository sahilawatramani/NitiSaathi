from sqlalchemy import Boolean, Column, DateTime, Float, ForeignKey, Integer, String, Text, UniqueConstraint
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

    owner = relationship("User", back_populates="profile")


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    date = Column(DateTime, default=utcnow)
    amount = Column(Float, nullable=False)
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
