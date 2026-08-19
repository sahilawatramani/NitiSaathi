# nitisaathi

AI-powered multi-agent financial assistant for gig & informal workers.

## Project Structure

```
nitisaathi/
├── agents/
│   └── budget_agent/          # FinAssist — budget forecasting agent (FastAPI + React)
│       ├── backend/           # FastAPI + LangGraph backend
│       ├── frontend/          # React + Vite dashboard UI
│       └── run.ps1            # Fast start (Windows)
├── data_pipeline/             # Synthetic data generation (Krisha's pipeline)
│   ├── generate_mock_data.py  # Step 1: 1,000 users × 2yr transactions
│   ├── preprocessing.py       # Step 2: weekly rollup
│   ├── feature_engineering.py # Step 3: WMA, savings rate, nudge flags → features.csv
│   ├── INTERFACE.md           # Schema reference for all agents
│   └── data/                  # Pipeline outputs (user_profiles.json, features.csv, etc.)
└── docs/
    └── sahai_updated_docs.md  # SRS + literature review + architecture
```

## Agents (MVP)

| Agent | Status | Location |
|---|---|---|
| Budget Agent | In progress | `agents/budget_agent/` |
| Scheme Agent | Planned | `agents/scheme_agent/` (TBD) |
| Fraud Guard | Planned | `agents/fraud_guard/` (TBD) |
| Literacy Agent | Planned | `agents/literacy_agent/` (TBD) |
| Nudge Agent | Planned | `agents/nudge_agent/` (TBD) |

## Quick Start

### Data Pipeline (run once to generate synthetic data)
```bash
cd data_pipeline
python generate_mock_data.py
python preprocessing.py
python feature_engineering.py
```

### Budget Agent
```bash
cd agents/budget_agent
.\run.ps1
```
Or manually:
- Backend: `cd backend && uvicorn app.main:app --reload` → http://localhost:8000
- Frontend: `cd frontend && npm run dev` → http://localhost:5173
