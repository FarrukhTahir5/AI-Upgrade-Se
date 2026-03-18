from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from typing import List
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.core.deps import get_current_user
from app.models.models import User, CSVImportJob
from app.schemas.schemas import CSVImportResponse
from app.services.import_service import process_csv_import

router = APIRouter(prefix="/imports", tags=["CSV Imports"])


@router.post("/upload", response_model=CSVImportResponse)
async def upload_csv(
    file: UploadFile = File(...),
    import_type: str = Form(default="customers"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are supported")

    content = await file.read()
    job = process_csv_import(content, file.filename, import_type, current_user.id, db)
    return CSVImportResponse.model_validate(job)


@router.get("/{import_id}", response_model=CSVImportResponse)
def get_import(
    import_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    job = db.query(CSVImportJob).filter(CSVImportJob.id == import_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Import job not found")
    return CSVImportResponse.model_validate(job)


@router.get("", response_model=List[CSVImportResponse])
def list_imports(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    jobs = db.query(CSVImportJob).order_by(CSVImportJob.created_at.desc()).limit(50).all()
    return [CSVImportResponse.model_validate(j) for j in jobs]
