"""
MVP Seed Data — 150 customers with realistic variation using flat model.
"""

import random
from datetime import date, timedelta
from app.db.session import SessionLocal
from app.core.security import get_password_hash
from app.models.models import User, UserRole, Customer

CITIES = [
    "Lahore", "Karachi", "Islamabad", "Rawalpindi", "Faisalabad",
    "Multan", "Peshawar", "Quetta", "Sialkot", "Gujranwala",
    "Hyderabad", "Bahawalpur", "Sargodha", "Abbottabad", "Mardan",
]

REGIONS = {
    "Lahore": "Punjab", "Karachi": "Sindh", "Islamabad": "ICT",
    "Rawalpindi": "Punjab", "Faisalabad": "Punjab", "Multan": "Punjab",
    "Peshawar": "KPK", "Quetta": "Balochistan", "Sialkot": "Punjab",
    "Gujranwala": "Punjab", "Hyderabad": "Sindh", "Bahawalpur": "Punjab",
    "Sargodha": "Punjab", "Abbottabad": "KPK", "Mardan": "KPK",
}


def seed_data():
    db = SessionLocal()
    try:
        # ─── Default users ───
        if not db.query(User).filter(User.email == "admin@skyelectric.com").first():
            for u in [
                {"full_name": "Admin User", "email": "admin@skyelectric.com", "role": UserRole.admin},
                {"full_name": "Sales Rep 1", "email": "sales1@skyelectric.com", "role": UserRole.sales},
                {"full_name": "Sales Rep 2", "email": "sales2@skyelectric.com", "role": UserRole.sales},
                {"full_name": "Analyst User", "email": "analyst@skyelectric.com", "role": UserRole.analyst},
                {"full_name": "Manager User", "email": "manager@skyelectric.com", "role": UserRole.manager},
            ]:
                db.add(User(
                    full_name=u["full_name"], email=u["email"],
                    password_hash=get_password_hash("password123"),
                    role=u["role"],
                ))
            db.flush()

        sales_ids = [u.id for u in db.query(User).filter(User.role == UserRole.sales).all()]

        if db.query(Customer).count() >= 100:
            print("Customers already seeded.")
            return

        for i in range(1, 151):
            city = random.choice(CITIES)
            is_hybrid = random.random() < 0.6
            pv_kw = random.choice([5, 7, 10, 10, 15, 20, 25])
            install_year = random.randint(2016, 2024)
            panel_wattage = random.choice([270, 330, 370, 400, 440, 450, 540, 550, 580])
            battery_kwh = random.choice([0, 5, 7.5, 10, 15, 20]) if is_hybrid else 0

            # Monthly consumption — slight variation month-to-month
            base = random.uniform(400, 1500)
            growth = random.uniform(0.99, 1.03)
            consumption = [round(base * (growth ** m) + random.uniform(-50, 50), 1) for m in range(12)]

            # GL expiry
            gl_years = random.choice([3, 5, 5, 7, 10])
            gl_expiry = date(install_year + gl_years, random.randint(1, 12), random.randint(1, 28))

            customer = Customer(
                customer_code=f"SE-{10000 + i}",
                customer_name=f"Customer {i}",
                phone=f"+9230{random.randint(10000000, 99999999)}",
                email=f"customer{i}@example.com",
                city=city,
                region=REGIONS.get(city, ""),
                pv_kw=pv_kw,
                battery_kwh=battery_kwh,
                panel_wattage=panel_wattage,
                install_year=install_year,
                hybrid_flag=is_hybrid,
                monthly_consumption=consumption,
                gl_expiry_date=gl_expiry,
                assigned_to_user_id=random.choice(sales_ids) if sales_ids else None,
                service_status="active",
            )
            db.add(customer)

        db.commit()
        print("✅ Seed: 5 users + 150 customers created.")

    except Exception as e:
        db.rollback()
        print(f"❌ Seed error: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_data()
