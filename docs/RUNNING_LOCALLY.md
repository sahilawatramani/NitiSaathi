# NitiSaathi — Local Development & Setup Guide

This guide provides instructions to run, develop, and test the entire NitiSaathi multi-agent platform locally on your machine (macOS, Linux, and Windows).

---

## 1. System Architecture & Port Map

NitiSaathi consists of **6 FastAPI agent microservices**, a **Web frontend (Expo Web)**, and a **Mobile frontend (React Native / Expo)**.

| Service / App | Directory | Default Port | Health Check Endpoint | Description |
|---|---|---|---|---|
| **Budget Agent & Orchestrator** | `agents/budget_agent/backend/` | `8000` | `http://localhost:8000/api/health` | Central API Gateway, LangGraph orchestrator, Auth & User DB |
| **Scheme Agent** | `agents/scheme_agent/` | `8001` | `http://localhost:8001/api/v1/schemes/health` | Welfare schemes eligibility engine (e-Shram, PMSYM, PMJJBY, etc.) |
| **Fraud Guard Agent** | `agents/fraud_guard/` | `8002` | `http://localhost:8002/api/v1/fraud-guard/health` | SMS / UPI payment scam detector & transaction analyzer |
| **Nudge Agent** | `agents/nudge_agent/` | `8004` | `http://localhost:8004/nudges/health` | Proactive behavioral nudges & SQLite evaluation storage |
| **Accessibility Agent** | `agents/accessibility_agent/` | `8005` | `http://localhost:8005/api/v1/accessibility/health` | Multilingual glossary (Hindi, Marathi, English), translation & TTS |
| **Literacy Agent** | `agents/literacy_agent/` | `8100` | `http://localhost:8100/health` | Financial literacy flashcards, micro-lessons & audio-first explainers |
| **Web Frontend** | `frontend/` | `8081` (or `3000`) | `http://localhost:8081` | Web client with glassmorphic UI & accessibility support |
| **Mobile Frontend** | `mobile/` | `8081` | Metro Bundler | React Native (Expo) mobile app for gig workers |

---

## 2. Prerequisites

- **Python 3.11+** installed
- **Node.js 18+** & **npm** installed
- **Git** installed
- *(Optional)* **Docker & Docker Compose**

---

## 3. Environment Variables Configuration

Copy the example environment files or create `.env` in each agent folder:

### A. Budget Agent (`agents/budget_agent/backend/.env`)
```ini
ENVIRONMENT=development
DATABASE_URL=sqlite:///./data/finassist.db
JWT_SECRET=dev_jwt_secret_key_change_in_production_32char
ACCESS_TOKEN_EXPIRE_MINUTES=10080
GEMINI_API_KEY=your_gemini_api_key_here
SCHEME_AGENT_URL=http://localhost:8001
FRAUD_GUARD_URL=http://localhost:8002
NUDGE_AGENT_URL=http://localhost:8004
ACCESSIBILITY_AGENT_URL=http://localhost:8005
LITERACY_AGENT_URL=http://localhost:8100
```

### B. Accessibility Agent (`agents/accessibility_agent/.env`)
```ini
GOOGLE_TRANSLATE_API_KEY=your_google_cloud_api_key_here
PORT=8005
```

### C. Literacy Agent (`agents/literacy_agent/.env`)
```ini
GEMINI_API_KEY=your_gemini_api_key_here
PORT=8100
```

---

## 4. Starting Backend Services

You can start the backend services using **Docker Compose**, **Shell Scripts**, or **Manual Commands**.

### Option 1: Docker Compose (Recommended for Containerized Setup)
```bash
docker compose up --build
```
This boots all 6 microservices in isolated containers with port forwarding enabled.

### Option 2: Linux / macOS Helper Scripts
```bash
# Make executable
chmod +x ./start_all.sh ./stop_all.sh ./dev.sh

# Start all microservices in the background
./start_all.sh

# Or start all microservices with live reload in one terminal
./dev.sh

# Stop all running agents
./stop_all.sh
```

### Option 3: Manual Startup (Windows PowerShell / Standalone)

Open separate terminals for each agent:

```powershell
# 1. Budget Agent (Port 8000)
cd agents/budget_agent/backend
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# 2. Scheme Agent (Port 8001)
cd agents/scheme_agent
uvicorn main:app --host 0.0.0.0 --port 8001 --reload

# 3. Fraud Guard Agent (Port 8002)
cd agents/fraud_guard
uvicorn main:app --host 0.0.0.0 --port 8002 --reload

# 4. Nudge Agent (Port 8004)
cd agents/nudge_agent
uvicorn main:app --host 0.0.0.0 --port 8004 --reload

# 5. Accessibility Agent (Port 8005)
cd agents/accessibility_agent
uvicorn main:app --host 0.0.0.0 --port 8005 --reload

# 6. Literacy Agent (Port 8100)
cd agents/literacy_agent
uvicorn main:app --host 0.0.0.0 --port 8100 --reload
```

---

## 5. Seeding Demo Data

To populate the database with a pre-configured gig worker profile (Rajesh), sample bank accounts, income streams, and transaction histories:

```bash
# From the repository root
python scripts/seed_demo_data.py
```

---

## 6. Running Frontends

### A. Web Frontend (`frontend/`)
```bash
cd frontend
npm install
npm run web
```
The web dashboard will open in your browser at `http://localhost:8081` (or your configured port).

### B. Mobile App (`mobile/`)
```bash
cd mobile
npm install
npm run start
```
- Press `a` for Android Emulator (requires Android Studio).
- Press `i` for iOS Simulator (macOS only).
- Press `w` for Web preview.
- Or scan the QR code with the **Expo Go** app on your physical mobile device.

> **Note for Mobile Device Testing:**
> If testing on a physical phone via Expo Go, ensure `mobile/src/services/api.ts` points to your machine's LAN IP (e.g. `http://192.168.1.50:8000/api`) or your ngrok tunnel URL rather than `localhost`.

---

## 7. Running the Automated Test Suite

To run all integration and unit tests across all agents:

```bash
# 1. Budget Agent Tests
pytest agents/budget_agent/backend/tests/ -v

# 2. Scheme Agent Tests
pytest agents/scheme_agent/tests/ -v

# 3. Fraud Guard Tests
pytest agents/fraud_guard/tests/ -v

# 4. Accessibility Agent Tests
pytest agents/accessibility_agent/tests/ -v

# 5. Nudge Agent Tests
pytest agents/nudge_agent/tests/ -v

# 6. Root Integration Tests (Nudge Orchestration & Cross-Agent Flows)
pytest tests/ -v
```

---

## 8. Common Troubleshooting & FAQs

1. **Windows SQLite File Lock (`PermissionError: [WinError 32]` in tests)**:
   - Always call `engine.dispose()` prior to deleting temporary SQLite database files in pytest fixtures.
2. **Windows Unicode / Console Character Encoding**:
   - Set `PYTHONIOENCODING=utf-8` in your environment when printing Devanagari (Hindi / Marathi) characters.
3. **Android Emulator Connection Refused**:
   - In Android emulator, `localhost` maps to the virtual device itself. Use `http://10.0.2.2:8000` to reach the host machine.
4. **CORS Issues on Web**:
   - The FastAPI backend has CORS middleware configured to allow origins `http://localhost:3000`, `http://localhost:8081`, `http://localhost:19006`, and `*` in development mode.
5. **Missing API Keys**:
   - When external LLM / Translation API keys are not supplied, all agents gracefully degrade to local offline deterministic dictionaries and rule-based fallback responses.
