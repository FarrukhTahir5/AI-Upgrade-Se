"""
MVP Pydantic Schemas — Simplified flat customer model.
"""

from datetime import datetime, date
from typing import Optional, List
from pydantic import BaseModel

from app.models.models import (
    UserRole, CampaignStatus, MessageType, PriorityLevel,
)


# ──────────────── Auth ────────────────

class LoginRequest(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserResponse"


# ──────────────── Users ────────────────

class UserCreate(BaseModel):
    full_name: str
    email: str
    password: str
    role: UserRole = UserRole.sales


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[str] = None
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None


class UserResponse(BaseModel):
    id: int
    full_name: str
    email: str
    role: UserRole
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


# ──────────────── Customers (MVP flat) ────────────────

class CustomerCreate(BaseModel):
    customer_code: str
    customer_name: str
    phone: Optional[str] = None
    email: Optional[str] = None
    city: Optional[str] = None
    region: Optional[str] = None
    pv_kw: Optional[float] = None
    battery_kwh: Optional[float] = None
    panel_wattage: Optional[int] = None
    install_year: Optional[int] = None
    hybrid_flag: Optional[bool] = False
    monthly_consumption: Optional[List[float]] = None  # last 12 months
    gl_expiry_date: Optional[date] = None
    assigned_to_user_id: Optional[int] = None
    service_status: Optional[str] = "active"
    external_system_id: Optional[int] = None


class CustomerUpdate(BaseModel):
    customer_code: Optional[str] = None
    customer_name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    city: Optional[str] = None
    region: Optional[str] = None
    pv_kw: Optional[float] = None
    battery_kwh: Optional[float] = None
    panel_wattage: Optional[int] = None
    install_year: Optional[int] = None
    hybrid_flag: Optional[bool] = None
    monthly_consumption: Optional[List[float]] = None
    gl_expiry_date: Optional[date] = None
    assigned_to_user_id: Optional[int] = None
    service_status: Optional[str] = None


class CustomerResponse(BaseModel):
    id: int
    customer_code: str
    customer_name: str
    phone: Optional[str]
    email: Optional[str]
    city: Optional[str]
    region: Optional[str]
    pv_kw: Optional[float]
    battery_kwh: Optional[float]
    panel_wattage: Optional[int]
    install_year: Optional[int]
    hybrid_flag: Optional[bool]
    monthly_consumption: Optional[List[float]]
    gl_expiry_date: Optional[date]
    assigned_to_user_id: Optional[int]
    service_status: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class CustomerDetailResponse(CustomerResponse):
    opportunity_score: Optional["OpportunityScoreResponse"] = None
    recommendations: List["RecommendationResponse"] = []

    class Config:
        from_attributes = True


# ──────────────── Opportunity Scores ────────────────

class OpportunityScoreResponse(BaseModel):
    id: int
    customer_id: int
    pv_upsize_score: float
    battery_expansion_score: float
    panel_modernization_score: float
    gl_urgency_score: float
    overall_opportunity_score: float
    score_version: int
    computed_at: datetime

    class Config:
        from_attributes = True


# ──────────────── Recommendations ────────────────

class RecommendationResponse(BaseModel):
    id: int
    customer_id: int
    recommendation_type: Optional[str]
    recommended_pv_addition_kw: Optional[float]
    recommended_battery_addition_kwh: Optional[float]
    recommend_panel_replacement: Optional[bool]
    recommendation_summary: Optional[str]
    detailed_reasoning: Optional[str]
    priority_level: Optional[PriorityLevel]
    estimated_savings: Optional[float]
    estimated_payback_years: Optional[float]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ──────────────── Campaigns ────────────────

class CampaignCreate(BaseModel):
    customer_id: int
    recommendation_id: Optional[int] = None
    assigned_to_user_id: Optional[int] = None
    channel: Optional[str] = None
    notes: Optional[str] = None


class CampaignUpdate(BaseModel):
    assigned_to_user_id: Optional[int] = None
    campaign_status: Optional[CampaignStatus] = None
    channel: Optional[str] = None
    ai_message_draft: Optional[str] = None
    next_followup_at: Optional[datetime] = None
    notes: Optional[str] = None
    response_status: Optional[str] = None


class CampaignResponse(BaseModel):
    id: int
    customer_id: int
    recommendation_id: Optional[int]
    assigned_to_user_id: Optional[int]
    campaign_status: CampaignStatus
    channel: Optional[str]
    ai_message_draft: Optional[str]
    sent_at: Optional[datetime]
    last_contact_at: Optional[datetime]
    next_followup_at: Optional[datetime]
    response_status: Optional[str]
    notes: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ──────────────── Messages ────────────────

class MessageGenerateRequest(BaseModel):
    message_type: MessageType
    tone: Optional[str] = "professional"
    language: Optional[str] = "english"
    include_cta: Optional[bool] = True


class MessageLogResponse(BaseModel):
    id: int
    customer_id: int
    campaign_id: Optional[int]
    message_type: MessageType
    generated_message: str
    sent_flag: bool
    created_at: datetime

    class Config:
        from_attributes = True


# ──────────────── CSV Imports ────────────────

class CSVImportResponse(BaseModel):
    id: int
    file_name: str
    import_type: str
    status: str
    total_rows: int
    success_rows: int
    failed_rows: int
    error_report_path: Optional[str]
    created_at: datetime
    completed_at: Optional[datetime]

    class Config:
        from_attributes = True


# ──────────────── Dashboard ────────────────

class DashboardStats(BaseModel):
    total_customers: int
    total_hybrid_customers: int
    gl_expiring_this_year: int
    legacy_panel_customers: int
    high_priority_candidates: int
    campaign_conversions: int


# Forward references
TokenResponse.model_rebuild()
CustomerDetailResponse.model_rebuild()
