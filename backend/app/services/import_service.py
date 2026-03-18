"""
CSV Import Service — processes uploaded CSV files into flat Customer records.
"""

import io
import pandas as pd
from sqlalchemy.orm import Session
from datetime import datetime

from app.models.models import Customer, CSVImportJob, ImportStatus


REQUIRED_COLUMNS = [
    "customer_code", "customer_name",
]

OPTIONAL_COLUMNS = [
    "phone", "email", "city", "region",
    "pv_kw", "battery_kwh", "panel_wattage", "install_year",
    "hybrid_flag", "gl_expiry_date",
    "month_1", "month_2", "month_3", "month_4", "month_5", "month_6",
    "month_7", "month_8", "month_9", "month_10", "month_11", "month_12",
]


def process_csv_import(
    content: bytes,
    filename: str,
    import_type: str,
    user_id: int,
    db: Session,
) -> CSVImportJob:
    job = CSVImportJob(
        file_name=filename,
        import_type=import_type,
        status=ImportStatus.processing,
        uploaded_by_user_id=user_id,
        total_rows=0,
        success_rows=0,
        failed_rows=0,
    )
    db.add(job)
    db.flush()

    try:
        df = pd.read_csv(io.BytesIO(content))
        df.columns = [c.strip().lower().replace(" ", "_") for c in df.columns]

        # Validate required columns
        missing = [c for c in REQUIRED_COLUMNS if c not in df.columns]
        if missing:
            job.status = ImportStatus.failed
            job.error_report_path = f"Missing required columns: {', '.join(missing)}"
            db.commit()
            return job

        job.total_rows = len(df)
        success = 0
        errors = []

        for idx, row in df.iterrows():
            try:
                code = str(row["customer_code"]).strip()

                # Check for existing customer (update) or new (insert)
                existing = db.query(Customer).filter(
                    Customer.customer_code == code
                ).first()

                # Build monthly consumption from month_1..month_12
                consumption = []
                for m in range(1, 13):
                    col = f"month_{m}"
                    if col in df.columns and pd.notna(row.get(col)):
                        consumption.append(float(row[col]))

                data = {
                    "customer_code": code,
                    "customer_name": str(row["customer_name"]).strip(),
                    "phone": _safe_str(row, "phone"),
                    "email": _safe_str(row, "email"),
                    "city": _safe_str(row, "city"),
                    "region": _safe_str(row, "region"),
                    "pv_kw": _safe_float(row, "pv_kw"),
                    "battery_kwh": _safe_float(row, "battery_kwh"),
                    "panel_wattage": _safe_int(row, "panel_wattage"),
                    "install_year": _safe_int(row, "install_year"),
                    "hybrid_flag": _safe_bool(row, "hybrid_flag"),
                    "gl_expiry_date": _safe_str(row, "gl_expiry_date"),
                    "monthly_consumption": consumption if consumption else None,
                }

                if existing:
                    for k, v in data.items():
                        if v is not None:
                            setattr(existing, k, v)
                else:
                    customer = Customer(**{k: v for k, v in data.items() if v is not None})
                    db.add(customer)

                success += 1

            except Exception as e:
                errors.append(f"Row {idx + 2}: {str(e)}")

        job.success_rows = success
        job.failed_rows = len(errors)
        job.error_report_path = "; ".join(errors[:20]) if errors else None
        job.status = ImportStatus.completed
        job.completed_at = datetime.utcnow()
        db.commit()

    except Exception as e:
        job.status = ImportStatus.failed
        job.error_report_path = str(e)
        db.commit()

    return job


def _safe_str(row, col):
    if col in row.index and pd.notna(row[col]):
        return str(row[col]).strip()
    return None


def _safe_float(row, col):
    if col in row.index and pd.notna(row[col]):
        try:
            return float(row[col])
        except (ValueError, TypeError):
            return None
    return None


def _safe_int(row, col):
    if col in row.index and pd.notna(row[col]):
        try:
            return int(float(row[col]))
        except (ValueError, TypeError):
            return None
    return None


def _safe_bool(row, col):
    if col in row.index and pd.notna(row[col]):
        val = str(row[col]).strip().lower()
        return val in ("true", "1", "yes", "y")
    return None
