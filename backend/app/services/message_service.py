"""
Message Service — MVP version, builds context from flat customer model.
"""

from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.models import Customer, Recommendation, MessageLog, MessageType


def _get_customer_context(customer_id: int, db: Session) -> dict:
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise ValueError(f"Customer {customer_id} not found")

    rec = (
        db.query(Recommendation)
        .filter(Recommendation.customer_id == customer_id)
        .order_by(Recommendation.created_at.desc())
        .first()
    )

    ctx = {
        "customer_name": customer.customer_name,
        "city": customer.city or "N/A",
        "pv_kw": customer.pv_kw or "N/A",
        "battery_kwh": customer.battery_kwh or "N/A",
        "hybrid": customer.hybrid_flag or False,
        "panel_wattage": customer.panel_wattage,
    }

    if rec:
        ctx["recommendation_type"] = rec.recommendation_type
        ctx["reason"] = rec.recommendation_summary
        ctx["pv_addition"] = rec.recommended_pv_addition_kw
        ctx["battery_addition"] = rec.recommended_battery_addition_kwh
        ctx["panel_replacement"] = rec.recommend_panel_replacement
        ctx["priority"] = rec.priority_level.value if rec.priority_level else "medium"

    if customer.gl_expiry_date:
        ctx["gl_expiry"] = str(customer.gl_expiry_date)

    return ctx


def _build_prompt(ctx: dict, msg_type: str, tone: str, language: str, cta: bool) -> str:
    type_map = {
        "whatsapp": "Write a SHORT WhatsApp message (max 150 words). Concise, direct, emoji sparingly.",
        "sms": "Write a very SHORT SMS (max 70 words). No emoji. Direct.",
        "email": "Write a detailed professional email with subject, greeting, body, sign-off.",
        "call_script": "Write a call-center script with greeting, key points, objection handling, closing.",
    }

    prompt = f"""You are writing a {msg_type} for a solar energy customer upgrade campaign.

RULES:
- ONLY use facts below. Do NOT invent numbers or savings.
- {tone} tone. Write in {language}.
- {type_map.get(msg_type, type_map['email'])}

CUSTOMER:
- Name: {ctx.get('customer_name')}
- City: {ctx.get('city')}
- Current PV: {ctx.get('pv_kw')} kW
- Battery: {ctx.get('battery_kwh')} kWh
- Hybrid: {'Yes' if ctx.get('hybrid') else 'No'}
- Recommendation: {ctx.get('reason', 'System upgrade opportunity')}
"""
    if ctx.get('pv_addition'):
        prompt += f"- Suggested PV Addition: {ctx['pv_addition']} kW\n"
    if ctx.get('battery_addition'):
        prompt += f"- Suggested Battery Addition: {ctx['battery_addition']} kWh\n"
    if ctx.get('panel_replacement'):
        prompt += "- Panel Replacement: Recommended\n"
    if ctx.get('gl_expiry'):
        prompt += f"- GL Expiry: {ctx['gl_expiry']}\n"
    if cta:
        prompt += "\nInclude a clear call-to-action.\n"
    return prompt


def _generate_with_gemini(prompt: str) -> str:
    import google.generativeai as genai
    genai.configure(api_key=settings.GEMINI_API_KEY)
    model = genai.GenerativeModel(settings.GEMINI_MODEL)
    response = model.generate_content(prompt)
    return response.text


def _template_fallback(ctx: dict, msg_type: str) -> str:
    name = ctx.get("customer_name", "Valued Customer")
    reason = ctx.get("reason", "a system upgrade opportunity")

    if msg_type == "whatsapp":
        return (
            f"Hi {name}! 🌞\n\n"
            f"We've identified {reason} for your solar system"
            f"{' in ' + ctx['city'] if ctx.get('city') != 'N/A' else ''}.\n\n"
            f"Reply YES to schedule a free consultation!"
        )
    elif msg_type == "sms":
        return f"Hi {name}, upgrade opportunity for your solar system. Reply YES for details."
    elif msg_type == "call_script":
        lines = [
            f"=== Call Script ===",
            f"Greeting: 'Hello, may I speak with {name}?'",
            f"Intro: We've identified {reason}.",
        ]
        if ctx.get("pv_addition"):
            lines.append(f"- Recommend adding {ctx['pv_addition']} kW PV")
        if ctx.get("battery_addition"):
            lines.append(f"- Recommend adding {ctx['battery_addition']} kWh storage")
        if ctx.get("gl_expiry"):
            lines.append(f"- GL expires {ctx['gl_expiry']}")
        lines.append("Closing: 'Shall I arrange a consultation?'")
        return "\n".join(lines)
    else:
        return (
            f"Subject: Upgrade Opportunity for Your Solar System\n\n"
            f"Dear {name},\n\nWe've identified {reason}.\n\n"
            f"We'd be happy to schedule a consultation.\n\n"
            f"Best regards,\nSkyElectric Upgrade Team"
        )


def generate_customer_message(
    customer_id: int,
    message_type: MessageType,
    db: Session,
    tone: str = "professional",
    language: str = "english",
    include_cta: bool = True,
) -> MessageLog:
    ctx = _get_customer_context(customer_id, db)
    prompt = _build_prompt(ctx, message_type.value, tone, language, include_cta)

    if settings.GEMINI_API_KEY:
        text = _generate_with_gemini(prompt)
    else:
        text = _template_fallback(ctx, message_type.value)

    log = MessageLog(
        customer_id=customer_id,
        message_type=message_type,
        generated_prompt_version="v1",
        generated_message=text,
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    return log
