from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.core.deps import get_current_user
from app.models.models import User, Customer, MessageLog
from app.schemas.schemas import MessageGenerateRequest, MessageLogResponse
from app.services.message_service import generate_customer_message

router = APIRouter(prefix="/messages", tags=["Messages"])


@router.post("/customer/{customer_id}/generate", response_model=MessageLogResponse)
def generate_message(
    customer_id: int,
    request: MessageGenerateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    try:
        log = generate_customer_message(
            customer_id=customer_id,
            message_type=request.message_type,
            db=db,
            tone=request.tone or "professional",
            language=request.language or "english",
            include_cta=request.include_cta if request.include_cta is not None else True,
        )
        return MessageLogResponse.model_validate(log)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/customer/{customer_id}", response_model=List[MessageLogResponse])
def get_customer_messages(
    customer_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    messages = (
        db.query(MessageLog)
        .filter(MessageLog.customer_id == customer_id)
        .order_by(MessageLog.created_at.desc())
        .all()
    )
    return [MessageLogResponse.model_validate(m) for m in messages]
