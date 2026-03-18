"""
Recommendation Engine — MVP version using flat customer model.
"""

from sqlalchemy.orm import Session

from app.models.models import Customer, OpportunityScore, Recommendation, PriorityLevel


HIGH_THRESHOLD = 60
MODERATE_THRESHOLD = 40


def generate_recommendation(customer_id: int, db: Session) -> Recommendation:
    """Generate recommendation from opportunity scores."""

    scores = db.query(OpportunityScore).filter(
        OpportunityScore.customer_id == customer_id
    ).first()
    if not scores:
        raise ValueError(f"No scores for customer {customer_id}. Run analysis first.")

    customer = db.query(Customer).filter(Customer.id == customer_id).first()

    pv = scores.pv_upsize_score
    battery = scores.battery_expansion_score
    panel = scores.panel_modernization_score
    gl = scores.gl_urgency_score

    rec_type = "no_action"
    pv_add = 0.0
    bat_add = 0.0
    panel_replace = False
    summary = ""
    reasoning = ""
    priority = PriorityLevel.low

    # GL urgency override
    if gl >= HIGH_THRESHOLD:
        priority = PriorityLevel.critical if gl >= 80 else PriorityLevel.high

    # Case C — Both PV and battery high
    if pv >= HIGH_THRESHOLD and battery >= HIGH_THRESHOLD:
        rec_type = "hybrid_upgrade"
        pv_add = 5.0
        bat_add = 10.0
        summary = "Full hybrid upgrade: add PV and expand battery storage."
        reasoning = (
            f"PV score ({pv}) and battery score ({battery}) both high. "
            f"Consumption growing beyond current system capacity with "
            f"insufficient battery for evening demand."
        )
        if priority == PriorityLevel.low:
            priority = PriorityLevel.high

    # Case A — PV only
    elif pv >= HIGH_THRESHOLD:
        rec_type = "pv_only"
        pv_add = 5.0 if (customer and customer.pv_kw and customer.pv_kw <= 10) else 3.0
        summary = f"Add {pv_add} kW PV to meet growing consumption."
        reasoning = f"PV score ({pv}) high, battery score ({battery}) moderate/low."
        if priority == PriorityLevel.low:
            priority = PriorityLevel.medium

    # Case B — Battery only
    elif battery >= HIGH_THRESHOLD:
        rec_type = "battery_only"
        bat_add = 10.0 if (customer and customer.battery_kwh and customer.battery_kwh <= 5) else 5.0
        summary = f"Add {bat_add} kWh battery storage for evening coverage."
        reasoning = f"Battery score ({battery}) high, PV score ({pv}) moderate/low."
        if priority == PriorityLevel.low:
            priority = PriorityLevel.medium

    # Case D — Panel modernization
    elif panel >= HIGH_THRESHOLD:
        rec_type = "panel_modernization"
        panel_replace = True
        summary = "Replace legacy panels with high-efficiency modules."
        reasoning = f"Panel score ({panel}) high — old low-wattage panels detected."
        if priority == PriorityLevel.low:
            priority = PriorityLevel.medium

    # Moderate signals
    elif pv >= MODERATE_THRESHOLD or battery >= MODERATE_THRESHOLD:
        if pv >= battery:
            rec_type = "pv_only"
            pv_add = 3.0
            summary = "Moderate PV expansion opportunity."
        else:
            rec_type = "battery_only"
            bat_add = 5.0
            summary = "Moderate battery expansion opportunity."
        reasoning = f"Moderate scores (PV: {pv}, Battery: {battery})."

    else:
        summary = "No strong upgrade signal at this time."
        reasoning = f"All scores below threshold (PV: {pv}, Bat: {battery}, Panel: {panel}, GL: {gl})."

    # GL urgency note
    if gl >= HIGH_THRESHOLD:
        reasoning += f" GL expiry urgency ({gl}) — high priority outreach window."

    rec = Recommendation(
        customer_id=customer_id,
        recommendation_type=rec_type,
        recommended_pv_addition_kw=pv_add if pv_add > 0 else None,
        recommended_battery_addition_kwh=bat_add if bat_add > 0 else None,
        recommend_panel_replacement=panel_replace,
        recommendation_summary=summary,
        detailed_reasoning=reasoning,
        priority_level=priority,
    )
    db.add(rec)
    db.commit()
    db.refresh(rec)
    return rec
