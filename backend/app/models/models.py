"""
MVP Models — Simplified to minimum viable dataset:
customer_id, customer_name, phone, pv_kw, battery_kwh,
panel_wattage, install_year, monthly_consumption_last_12_months,
gl_expiry_date
"""

import enum
from datetime import datetime

from sqlalchemy import (
    Column, Integer, String, Boolean, DateTime, Enum, Float,
    ForeignKey, Text, Date, JSON
)
from sqlalchemy.orm import relationship

from app.db.base import Base


# ──────────────── Enums ────────────────

class UserRole(str, enum.Enum):
    admin = "admin"
    sales = "sales"
    analyst = "analyst"
    manager = "manager"


class CampaignStatus(str, enum.Enum):
    not_contacted = "not_contacted"
    contacted = "contacted"
    interested = "interested"
    quote_sent = "quote_sent"
    converted = "converted"
    not_interested = "not_interested"


class ImportStatus(str, enum.Enum):
    pending = "pending"
    processing = "processing"
    completed = "completed"
    failed = "failed"


class MessageType(str, enum.Enum):
    whatsapp = "whatsapp"
    sms = "sms"
    email = "email"
    call_script = "call_script"


class PriorityLevel(str, enum.Enum):
    low = "low"
    medium = "medium"
    high = "high"
    critical = "critical"


# ──────────────── Models ────────────────

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), nullable=False, default=UserRole.sales)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    assigned_customers = relationship("Customer", back_populates="assigned_user")
    assigned_campaigns = relationship("Campaign", back_populates="assigned_user")


class Customer(Base):
    """
    MVP Customer — flat structure with all key fields for scoring.
    monthly_consumption is stored as JSON array of 12 floats (last 12 months).
    Maps to existing SkyElectric table fields where applicable.
    """
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True)
    customer_code = Column(String(50), unique=True, nullable=False, index=True)
    customer_name = Column(String(255), nullable=False)
    phone = Column(String(20))
    email = Column(String(255))
    city = Column(String(100))
    region = Column(String(100))

    # System info (flattened — no separate table for MVP)
    pv_kw = Column(Float)
    battery_kwh = Column(Float)
    panel_wattage = Column(Integer)
    install_year = Column(Integer)
    hybrid_flag = Column(Boolean, default=False)

    # Consumption: JSON array of last 12 months [oldest → newest]
    monthly_consumption = Column(JSON, default=list)

    # GL
    gl_expiry_date = Column(Date)

    # Tracking
    assigned_to_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    service_status = Column(String(50), default="active")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # External system reference (for future SkyElectric integration)
    external_system_id = Column(Integer, nullable=True)

    # Relationships
    assigned_user = relationship("User", back_populates="assigned_customers")
    opportunity_score = relationship("OpportunityScore", back_populates="customer", uselist=False)
    recommendations = relationship("Recommendation", back_populates="customer")
    campaigns = relationship("Campaign", back_populates="customer")
    message_logs = relationship("MessageLog", back_populates="customer")


class OpportunityScore(Base):
    __tablename__ = "opportunity_scores"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False, unique=True)
    pv_upsize_score = Column(Float, default=0)
    battery_expansion_score = Column(Float, default=0)
    panel_modernization_score = Column(Float, default=0)
    gl_urgency_score = Column(Float, default=0)
    overall_opportunity_score = Column(Float, default=0)
    score_version = Column(Integer, default=1)
    computed_at = Column(DateTime, default=datetime.utcnow)

    customer = relationship("Customer", back_populates="opportunity_score")


class Recommendation(Base):
    __tablename__ = "recommendations"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    recommendation_type = Column(String(100))
    recommended_pv_addition_kw = Column(Float)
    recommended_battery_addition_kwh = Column(Float)
    recommend_panel_replacement = Column(Boolean, default=False)
    recommendation_summary = Column(Text)
    detailed_reasoning = Column(Text)
    priority_level = Column(Enum(PriorityLevel), default=PriorityLevel.medium)
    estimated_savings = Column(Float)
    estimated_payback_years = Column(Float)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    customer = relationship("Customer", back_populates="recommendations")
    campaigns = relationship("Campaign", back_populates="recommendation")


class Campaign(Base):
    __tablename__ = "campaigns"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    recommendation_id = Column(Integer, ForeignKey("recommendations.id"), nullable=True)
    assigned_to_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    campaign_status = Column(Enum(CampaignStatus), default=CampaignStatus.not_contacted)
    channel = Column(String(50))
    ai_message_draft = Column(Text)
    sent_at = Column(DateTime)
    last_contact_at = Column(DateTime)
    next_followup_at = Column(DateTime)
    response_status = Column(String(50))
    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    customer = relationship("Customer", back_populates="campaigns")
    recommendation = relationship("Recommendation", back_populates="campaigns")
    assigned_user = relationship("User", back_populates="assigned_campaigns")
    message_logs = relationship("MessageLog", back_populates="campaign")


class MessageLog(Base):
    __tablename__ = "message_logs"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    campaign_id = Column(Integer, ForeignKey("campaigns.id"), nullable=True)
    message_type = Column(Enum(MessageType), nullable=False)
    generated_prompt_version = Column(String(50))
    generated_message = Column(Text, nullable=False)
    approved_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    sent_flag = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    customer = relationship("Customer", back_populates="message_logs")
    campaign = relationship("Campaign", back_populates="message_logs")


class CSVImportJob(Base):
    __tablename__ = "csv_import_jobs"

    id = Column(Integer, primary_key=True, index=True)
    file_name = Column(String(255), nullable=False)
    import_type = Column(String(50), nullable=False)
    uploaded_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    status = Column(Enum(ImportStatus), default=ImportStatus.pending)
    total_rows = Column(Integer, default=0)
    success_rows = Column(Integer, default=0)
    failed_rows = Column(Integer, default=0)
    error_report_path = Column(String(500))
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime)


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    entity_type = Column(String(100), nullable=False)
    entity_id = Column(Integer)
    action = Column(String(50), nullable=False)
    old_values_json = Column(JSON)
    new_values_json = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow)
