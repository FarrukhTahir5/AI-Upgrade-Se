# AI Upgrade Intelligence Platform

Internal platform for solar customer upgrade intelligence.

## Features

- **Customer Management**: Add/edit/delete customer profiles and system configurations.
- **CSV Import**: Bulk upload customer, system, energy, and GL data.
- **Scoring Engine**: Automated scoring for PV Upsell, Battery Expansion, and Panel Modernization.
- **Recommendation Engine**: Intelligent upgrade suggestions based on data analysis.
- **System Lookup**: Real-time lookup of system data from SkyElectric Cloud, PostgreSQL, and ScyllaDB.
- **Bill Scraping**: Automatic extraction of bill units from utility websites.
- **Campaign Tracking**: Manage outreach status and track sales progress.
- **AI Messaging**: Generate personalized WhatsApp/Email drafts using AI.
- **Dashboards**: Comprehensive view of opportunities and campaign performance.

## Tech Stack

- **Frontend**: Next.js, Tailwind CSS, shadcn/ui, Recharts.
- **Backend**: FastAPI (Python), SQLAlchemy, PostgreSQL.
- **Integrations**: SkyElectric GraphQL, ScyllaDB, Web Scraping.

## Getting Started

### Prerequisites

- Docker and Docker Compose
- SSH Tunnels for ScyllaDB and PostgreSQL (if running locally)

### Installation

1. Clone the repository.
2. Configure `.env` file (see `.env.example`).
3. Build and start services:
   ```bash
   docker-compose up --build
   ```
4. Access the platform at `http://localhost:3000`.

## System Lookup Data Sources

| Source | Data Points |
| :--- | :--- |
| **SkyElectric Cloud** | Status, metadata, 360-degree info, real-time telemetry. |
| **PostgreSQL** | Registration details, maintenance logs, customer profiles. |
| **ScyllaDB (Old/New)** | Historical energy data, units consumed/produced. |
| **Web Scraping** | Accurate bill units from utility (IESCO/LESCO/etc) sites. |

## License

Internal Use Only.
