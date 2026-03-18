from datetime import date
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, extract

from app.db.session import get_db
from app.core.deps import get_current_user
from app.models.models import Customer, OpportunityScore, Campaign, CampaignStatus, User
from app.core.config import settings
from app.schemas.schemas import DashboardStats

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/stats", response_model=DashboardStats)
def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    total = db.query(Customer).count()
    hybrid = db.query(Customer).filter(Customer.hybrid_flag == True).count()

    current_year = date.today().year
    gl_expiring = db.query(Customer).filter(
        extract("year", Customer.gl_expiry_date) == current_year
    ).count()

    legacy = db.query(Customer).filter(
        Customer.panel_wattage <= settings.LEGACY_PANEL_WATTAGE_MAX,
        Customer.panel_wattage.isnot(None),
    ).count()

    high_pri = db.query(OpportunityScore).filter(
        OpportunityScore.overall_opportunity_score >= 60
    ).count()

    conversions = db.query(Campaign).filter(
        Campaign.campaign_status == CampaignStatus.converted
    ).count()

    return DashboardStats(
        total_customers=total,
        total_hybrid_customers=hybrid,
        gl_expiring_this_year=gl_expiring,
        legacy_panel_customers=legacy,
        high_priority_candidates=high_pri,
        campaign_conversions=conversions,
    )


@router.get("/gl-expiry-by-year")
def gl_expiry_by_year(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    results = (
        db.query(
            extract("year", Customer.gl_expiry_date).label("year"),
            func.count().label("count"),
        )
        .filter(Customer.gl_expiry_date.isnot(None))
        .group_by(extract("year", Customer.gl_expiry_date))
        .order_by(extract("year", Customer.gl_expiry_date))
        .all()
    )
    return [{"year": int(r.year), "count": r.count} for r in results]


@router.get("/opportunities-by-type")
def opportunities_by_type(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    scores = db.query(OpportunityScore).filter(
        OpportunityScore.overall_opportunity_score > 0
    ).all()

    types = {"pv_upsize": 0, "battery_expansion": 0, "panel_modernization": 0, "gl_urgency": 0}
    for s in scores:
        mx = max(s.pv_upsize_score, s.battery_expansion_score, s.panel_modernization_score, s.gl_urgency_score)
        if mx == s.pv_upsize_score:
            types["pv_upsize"] += 1
        elif mx == s.battery_expansion_score:
            types["battery_expansion"] += 1
        elif mx == s.panel_modernization_score:
            types["panel_modernization"] += 1
        else:
            types["gl_urgency"] += 1

    return [{"type": k, "count": v} for k, v in types.items()]


@router.get("/campaign-funnel")
def campaign_funnel(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    results = (
        db.query(Campaign.campaign_status, func.count().label("count"))
        .group_by(Campaign.campaign_status)
        .all()
    )
    return [{"status": r.campaign_status.value, "count": r.count} for r in results]


@router.get("/top-urgent-customers")
def top_urgent_customers(
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    results = (
        db.query(Customer, OpportunityScore)
        .join(OpportunityScore)
        .order_by(OpportunityScore.overall_opportunity_score.desc())
        .limit(limit)
        .all()
    )

    return [
        {
            "customer_id": c.id,
            "customer_code": c.customer_code,
            "customer_name": c.customer_name,
            "city": c.city,
            "pv_kw": c.pv_kw,
            "battery_kwh": c.battery_kwh,
            "overall_score": s.overall_opportunity_score,
            "pv_score": s.pv_upsize_score,
            "battery_score": s.battery_expansion_score,
            "panel_score": s.panel_modernization_score,
            "gl_score": s.gl_urgency_score,
        }
        for c, s in results
    ]


@router.get("/region-opportunities")
def region_opportunities(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    results = (
        db.query(
            Customer.city,
            func.count().label("count"),
            func.avg(OpportunityScore.overall_opportunity_score).label("avg_score"),
        )
        .join(OpportunityScore)
        .filter(Customer.city.isnot(None))
        .group_by(Customer.city)
        .order_by(func.count().desc())
        .all()
    )
    return [
        {"city": r.city, "count": r.count, "avg_score": round(float(r.avg_score), 1)}
        for r in results
    ]
