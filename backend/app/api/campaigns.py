from typing import Optional, List
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.core.deps import get_current_user
from app.models.models import Campaign, Customer, User, CampaignStatus
from app.schemas.schemas import CampaignCreate, CampaignUpdate, CampaignResponse

router = APIRouter(prefix="/campaigns", tags=["Campaigns"])


@router.get("", response_model=dict)
def list_campaigns(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: Optional[CampaignStatus] = None,
    assigned_to: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Campaign)
    if status:
        query = query.filter(Campaign.campaign_status == status)
    if assigned_to:
        query = query.filter(Campaign.assigned_to_user_id == assigned_to)

    total = query.count()
    items = query.order_by(Campaign.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()

    return {
        "items": [CampaignResponse.model_validate(c) for c in items],
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size,
    }


@router.post("", response_model=CampaignResponse, status_code=201)
def create_campaign(
    data: CampaignCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    customer = db.query(Customer).filter(Customer.id == data.customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    campaign = Campaign(**data.model_dump())
    db.add(campaign)
    db.commit()
    db.refresh(campaign)
    return CampaignResponse.model_validate(campaign)


@router.put("/{campaign_id}", response_model=CampaignResponse)
def update_campaign(
    campaign_id: int,
    data: CampaignUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")

    update_data = data.model_dump(exclude_unset=True)

    # Track contact dates
    if "campaign_status" in update_data and update_data["campaign_status"] != campaign.campaign_status:
        campaign.last_contact_at = datetime.utcnow()

    for field, value in update_data.items():
        setattr(campaign, field, value)

    db.commit()
    db.refresh(campaign)
    return CampaignResponse.model_validate(campaign)


@router.post("/{campaign_id}/status", response_model=CampaignResponse)
def update_campaign_status(
    campaign_id: int,
    new_status: CampaignStatus,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")

    campaign.campaign_status = new_status
    campaign.last_contact_at = datetime.utcnow()
    db.commit()
    db.refresh(campaign)
    return CampaignResponse.model_validate(campaign)
