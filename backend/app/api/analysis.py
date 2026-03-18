from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.db.session import get_db
from app.core.deps import get_current_user
from app.models.models import User, Customer, OpportunityScore
from app.schemas.schemas import OpportunityScoreResponse
from app.services.scoring_service import calculate_all_scores
from app.services.recommendation_service import generate_recommendation
from app.schemas.schemas import RecommendationResponse

router = APIRouter(prefix="/analysis", tags=["Analysis & Scoring"])


@router.post("/customer/{customer_id}/run", response_model=OpportunityScoreResponse)
def run_customer_analysis(
    customer_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    score = calculate_all_scores(customer_id, db)
    return OpportunityScoreResponse.model_validate(score)


@router.post("/bulk/run")
def run_bulk_analysis(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    customers = db.query(Customer).all()
    results = {"total": len(customers), "success": 0, "failed": 0, "errors": []}

    for customer in customers:
        try:
            calculate_all_scores(customer.id, db)
            results["success"] += 1
        except Exception as e:
            results["failed"] += 1
            results["errors"].append({"customer_id": customer.id, "error": str(e)})

    return results


@router.get("/customer/{customer_id}", response_model=OpportunityScoreResponse)
def get_customer_scores(
    customer_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    score = db.query(OpportunityScore).filter(
        OpportunityScore.customer_id == customer_id
    ).first()
    if not score:
        raise HTTPException(status_code=404, detail="No scores found. Run analysis first.")
    return OpportunityScoreResponse.model_validate(score)


@router.post("/customer/{customer_id}/recommend", response_model=RecommendationResponse)
def generate_customer_recommendation(
    customer_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    try:
        rec = generate_recommendation(customer_id, db)
        return RecommendationResponse.model_validate(rec)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
