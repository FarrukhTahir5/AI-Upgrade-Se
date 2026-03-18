---
description: How to manage Docker containers for the AI Upgrade project
---

# Docker Management

## Day-to-day Development
Code changes are picked up **automatically** — no restart needed!
- Backend: uvicorn `--reload` watches `./backend`
- Frontend: Next.js dev server watches `./frontend`

## Start Everything
// turbo
```bash
cd "/home/farrukhtahir/AI Upgrade" && docker compose up -d
```

## View Logs (all services)
// turbo
```bash
cd "/home/farrukhtahir/AI Upgrade" && docker compose logs -f --tail=50
```

## View Logs (one service)
// turbo
```bash
cd "/home/farrukhtahir/AI Upgrade" && docker compose logs -f backend
# or: docker compose logs -f frontend
# or: docker compose logs -f db
```

## After Adding npm/pip Packages (rebuild needed)
```bash
cd "/home/farrukhtahir/AI Upgrade" && docker compose up -d --build frontend
# or: docker compose up -d --build backend
# or: docker compose up -d --build  (both)
```

## Restart a Container (keeps same code)
```bash
docker compose restart frontend
docker compose restart backend
```

## Full Reset (nuclear option)
```bash
cd "/home/farrukhtahir/AI Upgrade" && docker compose down && docker compose up -d --build
```

## Seed Database
```bash
docker exec aiupgrade-backend-1 python -m app.db.seed
```
