"""
Scoring Engine — Rule-based scoring using MVP flat customer model.
Works from: pv_kw, battery_kwh, panel_wattage, install_year,
monthly_consumption (JSON array), gl_expiry_date.
"""

from datetime import date, datetime
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.models import Customer, OpportunityScore


def _cap_score(score: float) -> float:
    return max(0, min(100, score))


def calculate_pv_upsize_score(customer: Customer) -> float:
    """PV upsizing opportunity based on consumption trend and system size."""
    score = 0.0
    consumption = customer.monthly_consumption or []

    if len(consumption) < 3:
        return 0.0

    # Consumption growth > 20% (compare recent 3 vs older 3)
    if len(consumption) >= 6:
        older_avg = sum(consumption[:3]) / 3
        recent_avg = sum(consumption[-3:]) / 3
        if older_avg > 0 and (recent_avg - older_avg) / older_avg > settings.CONSUMPTION_GROWTH_THRESHOLD:
            score += 25

    # High average consumption relative to PV
    avg_consumption = sum(consumption) / len(consumption)

    if avg_consumption > settings.HIGH_IMPORT_THRESHOLD_KWH:
        score += 25

    # Consumption much higher than what PV can produce
    if customer.pv_kw:
        estimated_monthly_gen = customer.pv_kw * 120  # rough kWh/kW/month
        if avg_consumption > estimated_monthly_gen * 1.5:
            score += 20

    # Old small system with growing usage
    if customer.pv_kw and customer.pv_kw <= 10 and avg_consumption > 800:
        score += 15

    # General high consumption signal
    if avg_consumption > 1000:
        score += 15

    return _cap_score(score)


def calculate_battery_expansion_score(customer: Customer) -> float:
    """Battery expansion opportunity based on battery size and consumption."""
    score = 0.0
    consumption = customer.monthly_consumption or []

    # Hybrid with small battery
    if customer.hybrid_flag and customer.battery_kwh:
        if customer.battery_kwh <= settings.BATTERY_SIZE_THRESHOLD_KWH:
            score += 25

    # No battery but hybrid system
    if customer.hybrid_flag and (not customer.battery_kwh or customer.battery_kwh == 0):
        score += 30

    # High consumption suggests strong evening demand
    if consumption:
        avg = sum(consumption) / len(consumption)
        if avg > 800:
            score += 20
        if avg > 1200:
            score += 10

    # Small battery relative to PV
    if customer.pv_kw and customer.battery_kwh:
        ratio = customer.battery_kwh / customer.pv_kw
        if ratio < 1.0:  # less than 1 kWh per kW PV
            score += 15

    return _cap_score(score)


def calculate_panel_modernization_score(customer: Customer) -> float:
    """Panel modernization score based on wattage and age."""
    score = 0.0

    # Legacy panel wattage (≤400W)
    if customer.panel_wattage and customer.panel_wattage <= settings.LEGACY_PANEL_WATTAGE_MAX:
        score += 40
        if customer.panel_wattage <= 330:
            score += 10  # Extra for very old panels

    # Installation age
    if customer.install_year:
        years_old = date.today().year - customer.install_year
        if years_old >= 7:
            score += 20
        elif years_old >= 5:
            score += 10

    # Payback likely completed (>5 years)
    if customer.install_year and (date.today().year - customer.install_year) >= 5:
        score += 20

    # Small PV with old panels — modernization would increase capacity
    if customer.pv_kw and customer.pv_kw <= 10 and customer.panel_wattage and customer.panel_wattage <= 400:
        score += 10

    return _cap_score(score)


def calculate_gl_urgency_score(customer: Customer) -> float:
    """GL urgency based on expiry proximity."""
    if not customer.gl_expiry_date:
        return 0.0

    today = date.today()
    days_until = (customer.gl_expiry_date - today).days
    months_until = days_until / 30.44

    if months_until <= 0:
        return 100  # Expired
    elif months_until <= 6:
        return settings.GL_URGENCY_6MO
    elif months_until <= 12:
        return settings.GL_URGENCY_12MO
    elif months_until <= 24:
        return settings.GL_URGENCY_24MO
    elif months_until <= 36:
        return settings.GL_URGENCY_36MO
    else:
        return 0.0


def calculate_all_scores(customer_id: int, db: Session) -> OpportunityScore:
    """Calculate all scores and persist."""
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise ValueError(f"Customer {customer_id} not found")

    pv = calculate_pv_upsize_score(customer)
    battery = calculate_battery_expansion_score(customer)
    panel = calculate_panel_modernization_score(customer)
    gl = calculate_gl_urgency_score(customer)

    overall = round(
        pv * settings.PV_WEIGHT +
        battery * settings.BATTERY_WEIGHT +
        panel * settings.PANEL_WEIGHT +
        gl * settings.GL_WEIGHT,
        2
    )

    existing = db.query(OpportunityScore).filter(
        OpportunityScore.customer_id == customer_id
    ).first()

    if existing:
        existing.pv_upsize_score = pv
        existing.battery_expansion_score = battery
        existing.panel_modernization_score = panel
        existing.gl_urgency_score = gl
        existing.overall_opportunity_score = overall
        existing.score_version += 1
        existing.computed_at = datetime.utcnow()
        db.commit()
        db.refresh(existing)
        return existing
    else:
        record = OpportunityScore(
            customer_id=customer_id,
            pv_upsize_score=pv,
            battery_expansion_score=battery,
            panel_modernization_score=panel,
            gl_urgency_score=gl,
            overall_opportunity_score=overall,
            score_version=1,
            computed_at=datetime.utcnow(),
        )
        db.add(record)
        db.commit()
        db.refresh(record)
        return record
