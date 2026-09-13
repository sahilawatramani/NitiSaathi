# NitiSaathi — Literacy Agent

Microservice that adapts and simplifies financial content and disclosures based on user literacy levels (`low`, `medium`, `high`) and language preferences (`en`, `hi`, `mr`).

## Port & Endpoints
- **Port**: `8100`
- **Health Check**: `GET /health` or `GET /literacy/health`
- **Rewrite Endpoint**: `POST /literacy/rewrite`

## Running Locally

From repository root:
```bash
uvicorn agents.literacy_agent.main:app --host 0.0.0.0 --port 8100 --reload
```

Or from this directory:
```bash
cd agents/literacy_agent
uvicorn main:app --host 0.0.0.0 --port 8100 --reload
```

## Running Tests
```bash
python -m pytest tests
```
