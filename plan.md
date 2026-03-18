Below is a **complete implementation plan** for building this as a **manual-input-first web platform**, so your IDE AI can build it step by step without missing major pieces.

---

# Goal

Build an internal **AI Upgrade Intelligence Platform** for solar customers that:

* stores customer + system + energy data
* allows manual entry and CSV import first
* identifies upgrade opportunities
* prioritizes GL expiry customers
* detects old panel replacement candidates
* generates AI customer messages
* tracks campaign progress
* is designed so live data integrations can be added later

---

# 1. Product scope

## Core use cases

The first version should support these flows:

### Flow 1 — Add customer manually

Admin/sales user enters customer data, system configuration, consumption history, and GL expiry.

### Flow 2 — Bulk upload customers

Admin uploads CSV for customer/system/consumption data.

### Flow 3 — Analyze upgrade opportunity

System calculates:

* PV upgrade score
* battery expansion score
* panel modernization score
* GL urgency score
* overall priority

### Flow 4 — Generate recommendation

System explains:

* why the customer is a candidate
* what upgrade is suggested
* how urgent the opportunity is

### Flow 5 — Generate AI message

System creates WhatsApp/SMS/email text from verified customer fields.

### Flow 6 — Track sales campaign

User changes status:

* not contacted
* contacted
* interested
* quote sent
* converted
* not interested

### Flow 7 — View management dashboards

Dashboard shows:

* total opportunities
* GL expiry counts by year
* legacy panel counts
* hybrid customer opportunities
* estimated revenue pipeline

---

# 2. Best MVP architecture

Build a **web application**.

## Recommended stack

This is practical, scalable, and AI-friendly.

### Frontend

* Next.js
* TypeScript
* Tailwind CSS
* component library like shadcn/ui
* charting with Recharts

### Backend

Choose one:

* **FastAPI + Python** if AI/analytics is central
* or **NestJS** if your team is stronger in Node

For this product, I recommend:

* **FastAPI** backend
* Python for scoring, future forecasting, and AI logic

### Database

* PostgreSQL

### ORM / DB layer

* SQLAlchemy + Alembic for FastAPI
  or
* Prisma if using Node

### Background jobs

* Celery + Redis
  or
* simple cron/task queue later

### AI layer

* OpenAI-compatible LLM API for message generation
* rules/scoring implemented in Python

### File storage

* local storage for MVP
* S3-compatible storage later for CSVs/reports

### Auth

* JWT or session auth
* role-based access control

### Deployment

* Dockerized services
* Nginx reverse proxy
* deploy on internal VPS/cloud

---

# 3. High-level system modules

Build the app in these modules.

## Module A — Authentication and roles

Users:

* Admin
* Sales
* Analyst
* Manager

Permissions:

* Admin: everything
* Sales: view leads, edit campaign status, generate messages
* Analyst: upload data, run analysis
* Manager: dashboards, reports, read-only on customer details if needed

---

## Module B — Customer management

Store:

* customer profile
* contact details
* location
* installation details
* account owner

Features:

* add/edit/delete customer
* search customer
* filter by city / system type / hybrid flag
* view customer detail page

---

## Module C — System configuration

Store:

* PV size
* inverter size
* battery size
* panel wattage
* panel technology
* installation year
* hybrid or non-hybrid
* expansion history

---

## Module D — Consumption and performance data

Store:

* monthly consumption
* import/export
* solar generation
* bill amount
* battery performance indicators

For MVP, manual and CSV-based.

---

## Module E — GL registry

Store:

* generation license number
* issue date
* expiry date
* renewal status

Use for:

* filtering expiring customers
* campaign prioritization

---

## Module F — Opportunity engine

This is the core business logic.

Scores:

* PV Upsize Score
* Battery Expansion Score
* Panel Modernization Score
* GL Urgency Score
* Overall Upgrade Opportunity Score

---

## Module G — Recommendation engine

Transforms scores into:

* recommendation category
* suggested system expansion
* explanation text
* confidence label

---

## Module H — AI communication engine

Generates:

* WhatsApp draft
* SMS draft
* email draft
* call-center script

Important:
AI should only explain structured facts already computed by your engine.
Do not let the model invent numbers.

---

## Module I — Campaign tracker

Tracks:

* outreach status
* last contact date
* next follow-up date
* channel used
* assigned sales rep
* notes
* outcome

---

## Module J — Dashboard and reports

Shows:

* top opportunity segments
* expiring GL count by year
* old panel customers
* battery upsell candidates
* estimated pipeline value
* campaign funnel

---

# 4. Database design

Design the schema properly now so integrations can be added later.

## 4.1 users

Fields:

* id
* full_name
* email
* password_hash
* role
* is_active
* created_at
* updated_at

---

## 4.2 customers

Fields:

* id
* customer_code
* full_name
* phone
* email
* city
* region
* address
* install_date
* customer_type
* service_status
* assigned_to_user_id
* created_at
* updated_at

---

## 4.3 installed_systems

One customer may have one main system record for MVP.

Fields:

* id
* customer_id
* pv_kw
* inverter_kw
* battery_kwh
* inverter_model
* battery_model
* panel_brand
* panel_model
* panel_wattage
* panel_count
* panel_technology
* hybrid_flag
* install_year
* roof_capacity_estimate_kw
* has_previous_expansion
* created_at
* updated_at

---

## 4.4 monthly_energy_data

Fields:

* id
* customer_id
* reading_month
* total_consumption_kwh
* grid_import_kwh
* grid_export_kwh
* solar_generation_kwh
* bill_amount
* peak_units_kwh
* offpeak_units_kwh
* created_at
* updated_at

Unique constraint:

* customer_id + reading_month

---

## 4.5 battery_performance_data

Fields:

* id
* customer_id
* reading_month
* battery_cycles
* avg_soc_min
* avg_soc_max
* avg_evening_discharge_kwh
* estimated_battery_empty_time
* backup_events_supported
* created_at
* updated_at

---

## 4.6 generation_licenses

Fields:

* id
* customer_id
* gl_number
* issue_date
* expiry_date
* renewal_status
* net_billing_status
* remarks
* created_at
* updated_at

---

## 4.7 opportunity_scores

Store latest calculated results.

Fields:

* id
* customer_id
* pv_upsize_score
* battery_expansion_score
* panel_modernization_score
* gl_urgency_score
* net_billing_pressure_score
* overall_opportunity_score
* score_version
* computed_at

---

## 4.8 recommendations

Fields:

* id
* customer_id
* recommendation_type
* recommended_pv_addition_kw
* recommended_battery_addition_kwh
* recommend_panel_replacement
* recommendation_summary
* detailed_reasoning
* priority_level
* estimated_savings
* estimated_payback_years
* created_at
* updated_at

---

## 4.9 campaigns

Fields:

* id
* customer_id
* recommendation_id
* assigned_to_user_id
* campaign_status
* channel
* ai_message_draft
* sent_at
* last_contact_at
* next_followup_at
* response_status
* notes
* created_at
* updated_at

---

## 4.10 message_logs

Fields:

* id
* customer_id
* campaign_id
* message_type
* generated_prompt_version
* generated_message
* approved_by_user_id
* sent_flag
* created_at

---

## 4.11 csv_import_jobs

Fields:

* id
* file_name
* import_type
* uploaded_by_user_id
* status
* total_rows
* success_rows
* failed_rows
* error_report_path
* created_at
* completed_at

---

## 4.12 audit_logs

Fields:

* id
* user_id
* entity_type
* entity_id
* action
* old_values_json
* new_values_json
* created_at

---

# 5. Data input design

Since you are starting without live sources, build **two input methods**.

## Method 1 — Manual forms

Forms needed:

* customer form
* installed system form
* GL form
* monthly energy input form
* battery performance input form
* campaign notes form

## Method 2 — CSV upload

CSV types:

* customers.csv
* systems.csv
* monthly_energy.csv
* battery_data.csv
* gl_data.csv

Each import should support:

* preview before save
* field mapping
* validation
* row-level error reporting
* duplicate detection

---

# 6. Business logic for first version

Do not begin with complex ML.
Start with **rule-based intelligence**.

## 6.1 PV Upsize Score

Purpose:
identify customers whose current PV is likely insufficient.

Example rules:

* if consumption increased > 20% in last 12 months → +25
* if grid import remains high despite existing PV → +25
* if daytime usage seems higher than available solar → +20
* if export is low and import is high → +15
* if current PV is still 10 kW old standard system and customer usage has grown → +15

Cap score at 100.

---

## 6.2 Battery Expansion Score

Purpose:
find users needing more storage.

Example rules:

* hybrid customer and battery <= 10 kWh → +15
* evening/night import high → +30
* battery empties early in evening → +30
* outage backup need reported → +15
* load profile suggests stronger evening demand → +10

---

## 6.3 Panel Modernization Score

Purpose:
find legacy systems with low-efficiency modules.

Example rules:

* panel wattage between 250–400 W → +40
* installation older than 5–7 years → +20
* customer likely completed payback → +20
* roof space constraint and low-efficiency panels → +20

---

## 6.4 GL Urgency Score

Purpose:
identify customers to target ahead of expiry.

Example rules:

* GL expiry within 6 months → 100
* within 12 months → 80
* within 24 months → 60
* within 36 months → 40

You can weigh commercial value later.

---

## 6.5 Overall Opportunity Score

Weighted average example:

* PV Upsize Score: 30%
* Battery Expansion Score: 30%
* Panel Modernization Score: 20%
* GL Urgency Score: 20%

Adjust later based on business goals.

---

# 7. Recommendation logic

Convert scores into actionable recommendations.

## Example recommendation rules

### Case A — Add PV only

If:

* PV score high
* battery score low/moderate
  Then:
* recommend adding 3–5 kW PV

### Case B — Add battery only

If:

* battery score high
* PV score low/moderate
  Then:
* recommend increasing storage by 5–10 kWh

### Case C — Full hybrid upgrade

If:

* both PV and battery scores high
  Then:
* recommend both PV + battery expansion

### Case D — Panel modernization

If:

* panel modernization score high
  Then:
* recommend replacing existing panels with higher-efficiency modules
* optionally combine with battery expansion

### Case E — GL-triggered outreach

If:

* GL urgency high
  Then:
* set high campaign priority regardless of other score

---

# 8. AI message generation design

The AI should not decide the recommendation.
The **engine decides**, AI only explains.

## Input to AI

Pass structured fields only:

* customer name
* city
* existing system size
* key reason(s)
* suggested upgrade
* general benefit
* GL expiry urgency if relevant

## Output types

* WhatsApp short message
* SMS short message
* email detailed message
* call-center script

## Safety/quality rules

* no unsupported savings claims
* no made-up performance numbers
* no fabricated payback if not calculated
* use only known fields
* include business-approved tone

## Message templates

Store templates like:

* battery upsell
* PV upsell
* old panel modernization
* GL expiry advisory
* combo upgrade

---

# 9. UI / screen-by-screen plan

These are the screens IDE AI should build.

## 9.1 Login page

Fields:

* email
* password

---

## 9.2 Main dashboard

Cards:

* total customers
* total hybrid customers
* GL expiring this year
* legacy panel customers
* high-priority upgrade candidates
* campaign conversions

Charts:

* opportunities by type
* GL expiry by year
* campaign funnel
* region-wise opportunity count

Tables:

* top 20 urgent customers
* recent imports
* latest campaigns

---

## 9.3 Customers list page

Features:

* search
* filters
* sort
* export CSV

Columns:

* customer code
* name
* city
* hybrid flag
* PV kW
* battery kWh
* panel wattage
* GL expiry
* overall score
* status

---

## 9.4 Customer detail page

Sections:

* profile
* installed system
* monthly energy chart
* battery behavior
* GL details
* scores
* recommendation
* campaign history
* AI message drafts

Buttons:

* edit
* recalculate analysis
* generate message
* create campaign

---

## 9.5 Add/Edit customer page

Tabbed form:

* basic info
* system info
* GL info
* monthly data
* battery data

---

## 9.6 CSV import page

Blocks:

* upload file
* choose import type
* map columns
* preview rows
* validate
* import result
* download error report

---

## 9.7 Opportunities page

Filters:

* high PV score
* high battery score
* high panel modernization score
* GL expiring soon
* city / region
* hybrid only

Table:

* customer
* top reason
* recommendation type
* priority
* assigned rep

---

## 9.8 Campaigns page

Columns:

* customer
* recommendation
* channel
* status
* assigned rep
* last contact
* next follow-up
* response

Actions:

* update status
* add note
* generate new message

---

## 9.9 Message generation modal/page

Inputs:

* message type
* tone
* language
* include CTA checkbox

Outputs:

* preview
* regenerate
* copy
* approve and save

---

## 9.10 Reports page

Downloadable reports:

* GL expiry list
* legacy panel list
* top upsell candidates
* campaign performance
* region-wise opportunity summary

---

## 9.11 Settings page

Settings:

* score thresholds
* recommendation rules
* message templates
* user roles
* system config values

---

# 10. API design

Your IDE AI should build APIs cleanly.

## Auth

* POST /auth/login
* POST /auth/logout
* GET /auth/me

## Customers

* GET /customers
* POST /customers
* GET /customers/{id}
* PUT /customers/{id}
* DELETE /customers/{id}

## Installed systems

* POST /systems
* PUT /systems/{id}

## Monthly energy

* POST /energy/monthly
* PUT /energy/monthly/{id}
* GET /energy/customer/{customer_id}

## Battery performance

* POST /battery/performance
* GET /battery/customer/{customer_id}

## GL

* POST /gl
* PUT /gl/{id}
* GET /gl/customer/{customer_id}

## Scoring

* POST /analysis/customer/{id}/run
* POST /analysis/bulk/run
* GET /analysis/customer/{id}

## Recommendations

* GET /recommendations/customer/{id}
* POST /recommendations/customer/{id}/generate

## Messages

* POST /messages/customer/{id}/generate
* GET /messages/customer/{id}

## Campaigns

* GET /campaigns
* POST /campaigns
* PUT /campaigns/{id}
* POST /campaigns/{id}/status

## Imports

* POST /imports/upload
* GET /imports/{id}
* GET /imports

## Reports

* GET /reports/opportunities
* GET /reports/gl-expiry
* GET /reports/campaign-performance

---

# 11. Validation rules

These are important and often forgotten.

## Customer validations

* customer code unique
* valid phone format
* valid email if provided

## System validations

* PV kW cannot be negative
* battery kWh cannot be negative
* panel wattage must be within reasonable range
* install year cannot be in future

## Monthly energy validations

* one record per month per customer
* no negative kWh
* bill amount cannot be negative

## GL validations

* expiry date must be after issue date
* expiry date required if GL exists

## Import validations

* missing required columns should fail
* duplicate row detection
* row-level error report downloadable

---

# 12. Analytics logic details

## 12.1 Monthly consumption trend

Compute:

* average 12-month consumption
* latest 3-month average
* growth rate
* seasonality indicator

## 12.2 Import/export behavior

Compute:

* annual import total
* annual export total
* import/export ratio

## 12.3 Basic battery need signal

If:

* grid import remains high during evening
  or
* battery empty time is early
  then increase battery score

## 12.4 Legacy panel detection

If panel wattage <= 400:

* tag as legacy panel
* further prioritize older install years

## 12.5 GL cohort grouping

Group into:

* expired
* expiring within 6 months
* 6–12 months
* 12–24 months
* 24–36 months
* beyond 36 months

---

# 13. Future ML-ready design

Even though MVP is rule-based, prepare for ML later.

## Future models

* consumption forecasting
* upgrade conversion prediction
* lead priority scoring
* message response prediction

## What to store now for future ML

* all score snapshots
* campaign outcomes
* sent message variants
* final conversion results
* reasons for rejection
* accepted upgrade type

This will help train models later.

---

# 14. Integrations to support later

Do not build them now, but design placeholders.

Future sources:

* CRM
* billing/ERP
* inverter monitoring/IoT
* customer mobile app
* GL registry system
* WhatsApp/SMS gateways

Prepare:

* source system field in import tables
* external_id columns
* sync_status flags
* raw_data_json fields if useful

---

# 15. Development phases

## Phase 0 — Planning and setup

Tasks:

* finalize requirements
* choose stack
* create wireframes
* define schema
* define scoring rules
* define CSV templates

Deliverables:

* technical spec
* DB schema
* UI wireframes
* scoring config doc

---

## Phase 1 — Foundation

Build:

* auth
* role management
* base layout
* database
* customers CRUD
* installed systems CRUD
* GL CRUD

Deliverables:

* working admin app
* login
* customer and system management

---

## Phase 2 — Data entry and imports

Build:

* manual monthly energy form
* battery data form
* CSV import flow
* import validation
* error reports

Deliverables:

* users can populate system without live integrations

---

## Phase 3 — Opportunity engine

Build:

* score calculation service
* scoring persistence
* recommendation engine
* opportunity listing page

Deliverables:

* customer analysis page with scores and recommendations

---

## Phase 4 — AI messaging and campaigns

Build:

* message generation service
* campaign creation
* status tracking
* notes and follow-up dates

Deliverables:

* sales team can use platform to run outreach

---

## Phase 5 — Dashboard and reporting

Build:

* management dashboard
* charts
* exports
* top opportunity lists

Deliverables:

* management visibility into upgrade pipeline

---

## Phase 6 — Hardening

Build:

* audit logs
* permissions checks
* validation improvements
* performance tuning
* backup/restore

---

# 16. Testing plan

Your IDE AI should not skip testing.

## Unit tests

Test:

* score calculations
* recommendation rules
* validation functions
* CSV parser
* GL date grouping

## API tests

Test:

* create/update/read/delete flows
* auth protection
* import APIs
* analysis trigger
* campaign update

## UI tests

Test:

* forms
* filters
* charts
* pagination
* permissions

## Business scenario tests

Create sample customers for:

* rising consumption + old 10 kW system
* high evening demand + low battery
* old 330 W panels
* GL expiry in 6 months
* low-priority stable customer

Ensure recommendations match expectation.

---

# 17. Seed/demo data plan

Create realistic demo data so the product can be tested before real sources exist.

## Seed 100–300 fake customers

Include variation in:

* hybrid / non-hybrid
* panel wattage
* install years
* battery sizes
* GL expiry years
* different cities
* different consumption patterns

This is very important because it lets teams see the product working before live deployment.

---

# 18. Security and audit requirements

Since this is customer/business data, include:

* password hashing
* role-based access
* audit logs on changes
* import history logs
* deleted data soft delete where needed
* secure environment variables
* API authentication
* rate limit message generation endpoint
* no exposing secrets in frontend

---

# 19. Non-functional requirements

Do not forget these.

## Performance

* customer list pagination
* async import processing
* cache dashboard aggregates if needed

## Reliability

* DB backups
* import rollback on major failure
* logging and monitoring

## Maintainability

* modular services
* typed API contracts
* migration files
* config-driven scoring thresholds

## Scalability

* keep analysis engine separate
* use queues for bulk analysis later

---

# 20. Folder structure suggestion

For FastAPI + Next.js:

## Backend

* app/

  * main.py
  * core/
  * models/
  * schemas/
  * api/
  * services/
  * utils/
  * db/
  * workers/
  * tests/

Suggested services:

* customer_service.py
* system_service.py
* energy_service.py
* gl_service.py
* scoring_service.py
* recommendation_service.py
* message_service.py
* campaign_service.py
* import_service.py
* report_service.py

## Frontend

* app/
* components/
* lib/
* hooks/
* services/
* types/
* utils/

Pages/routes:

* /login
* /dashboard
* /customers
* /customers/[id]
* /imports
* /opportunities
* /campaigns
* /reports
* /settings

---

# 21. Exact MVP deliverables

At minimum, the first release should include:

## Backend

* auth
* customers CRUD
* systems CRUD
* GL CRUD
* monthly energy CRUD
* CSV upload/import
* score calculation
* recommendation generation
* AI message generation
* campaigns CRUD
* dashboards API

## Frontend

* login
* dashboard
* customers list
* customer detail
* add/edit customer
* import page
* opportunities page
* campaigns page
* reports page

## Business logic

* rules-based scoring
* recommendation templates
* GL expiry segmentation
* legacy panel detection

## Operations

* Docker setup
* env config
* sample CSV templates
* seed data
* README

---

# 22. What IDE AI should build first, in order

Give your IDE AI this exact build sequence:

## Step 1

Set up project structure:

* frontend
* backend
* database
* docker
* env files

## Step 2

Implement auth and RBAC

## Step 3

Implement customer, system, and GL schema + CRUD

## Step 4

Implement monthly energy and battery performance schema + CRUD

## Step 5

Implement CSV upload/import with validation and import history

## Step 6

Implement scoring engine with configurable thresholds

## Step 7

Implement recommendation engine and customer analysis page

## Step 8

Implement opportunities list with filtering and sorting

## Step 9

Implement AI message generation using structured recommendation output

## Step 10

Implement campaigns management and notes/follow-up tracking

## Step 11

Implement dashboards and reports

## Step 12

Add audit logging, tests, and seed/demo data

---

# 23. Configuration file ideas

Make business rules editable from config.

## Example config items

* GL urgency thresholds
* legacy panel wattage max
* battery size thresholds
* high import threshold
* consumption growth threshold
* recommendation templates
* score weights

This prevents code changes every time business wants adjustment.

---

# 24. Sample recommendation output shape

When a customer is analyzed, store output like:

* overall_score: 82
* priority: High
* top_reason: Rising consumption and undersized battery
* recommendation_type: PV + Battery Expansion
* suggested_pv_addition_kw: 5
* suggested_battery_addition_kwh: 10
* panel_upgrade: false
* gl_priority: Moderate
* explanation:
  “Customer consumption trend has increased significantly over the last 12 months, and current battery size appears insufficient for evening demand. A combined PV and battery expansion is recommended.”

This structured output will power UI, reports, and AI messages.

---

# 25. Biggest things people forget

Make sure IDE AI does not miss these:

* CSV column mapping screen
* duplicate detection on import
* row-level import errors
* audit logs
* role-based permissions
* score recalculation button
* editable score thresholds
* campaign follow-up dates
* notes per customer
* demo seed data
* exportable reports
* recommendation versioning
* storing AI message drafts separately
* customer detail page showing all related data together

---

# 26. Final recommended implementation strategy

Do **not** tell IDE AI to build “full AI system” first.

Tell it to build:

### Version 1

* manual data entry
* CSV imports
* rules engine
* recommendation engine
* AI messaging
* campaign tracking
* dashboard

### Version 2

* smarter financial calculations
* semi-automated syncs
* approval workflows
* better reporting

### Version 3

* live integrations
* forecasting models
* conversion prediction
* automated campaign triggers

---

# 27. One-line product definition for your team

Use this internally:

**An internal web platform that identifies solar customer upgrade opportunities using manually entered or imported data, prioritizes customers by energy and GL-expiry signals, generates AI-assisted personalized outreach, and tracks campaign conversions.**

---

If you want, I can next turn this into a **developer-ready PRD + task breakdown with frontend pages, backend endpoints, DB schema, and prompts for IDE AI**.
