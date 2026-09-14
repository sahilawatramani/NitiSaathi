# nitisaathi

AI-powered multi-agent financial assistant for gig & informal workers.

## Project Structure

```
nitisaathi/
├── agents/
│   ├── budget_agent/          # FinAssist — budget forecasting agent (FastAPI + React)
│   ├── scheme_agent/          # Welfare schemes eligibility engine (FastAPI)
│   ├── fraud_guard/           # UPI fraud & scam detector (FastAPI)
│   ├── nudge_agent/           # Proactive nudge daemon & outcome evaluator (FastAPI)
│   ├── accessibility_agent/   # Multilingual glossary, translation & TTS (FastAPI)
│   └── literacy_agent/        # Jargon simplification & advisory disclaimers (FastAPI)
├── data_pipeline/             # Synthetic data generation (1,000 users × 2yr transactions)
├── frontend/                  # Cross-platform Web & Mobile app (React Native / Expo)
├── mobile/                    # Native Mobile app (Expo)
└── docs/                      # Master project guide & local running documentation
```

## Agents (MVP)

| Agent | Status | Port | Location |
|---|---|---|---|
| Budget Agent | Integrated gateway | `8000` | `agents/budget_agent/backend/` |
| Scheme Agent | HTTP microservice | `8001` | `agents/scheme_agent/` |
| Fraud Guard | HTTP microservice | `8002` | `agents/fraud_guard/` |
| Nudge Agent | Proactive microservice | `8004` | `agents/nudge_agent/` |
| Accessibility Agent | Multilingual microservice | `8005` | `agents/accessibility_agent/` |
| Literacy Agent | Final-pass microservice | `8100` | `agents/literacy_agent/` |

## Quick Start

### All backend microservices

```bash
docker compose up --build
```

The Budget API is the gateway at `:8000`; it calls Scheme (`:8001`), Fraud
Guard (`:8002`), Nudge (`:8004`), Accessibility (`:8005`), and Literacy (`:8100`)
over their own HTTP contracts. The frontend can use `POST /api/chat/` and does not
need to know which specialist agents were invoked.

### Running with Helper Scripts (Linux / macOS)
```bash
./start_all.sh   # Background startup & health checks
./dev.sh         # Interactive frontend + background backends
./stop_all.sh    # Stop all services
```

### Full Setup Guide
See [docs/RUNNING_LOCALLY.md](docs/RUNNING_LOCALLY.md) for full manual startup, seed scripts, and port maps.
