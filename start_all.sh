#!/bin/bash
set -e

REPO_ROOT="/home/amitkumar/Downloads/Nitisaathi"
LOG_DIR="$REPO_ROOT/.logs"
mkdir -p "$LOG_DIR"

echo "=== Starting NitiSaathi Services ==="

# 1. Start Scheme Agent (8001)
echo "Starting Scheme Agent on port 8001..."
cd "$REPO_ROOT"
nohup uvicorn agents.scheme_agent.main:app --host 0.0.0.0 --port 8001 > "$LOG_DIR/scheme_agent.log" 2>&1 &
echo $! > "$LOG_DIR/scheme_agent.pid"

# 2. Start Fraud Guard (8002)
echo "Starting Fraud Guard on port 8002..."
cd "$REPO_ROOT"
nohup uvicorn agents.fraud_guard.main:app --host 0.0.0.0 --port 8002 > "$LOG_DIR/fraud_guard.log" 2>&1 &
echo $! > "$LOG_DIR/fraud_guard.pid"

# 3. Start Nudge Agent (8004)
echo "Starting Nudge Agent on port 8004..."
cd "$REPO_ROOT"
nohup uvicorn agents.nudge_agent.main:app --host 0.0.0.0 --port 8004 > "$LOG_DIR/nudge_agent.log" 2>&1 &
echo $! > "$LOG_DIR/nudge_agent.pid"

# 4. Start Literacy Agent (8100)
echo "Starting Literacy Agent on port 8100..."
cd "$REPO_ROOT/agents/literacy_agent"
nohup uvicorn main:app --host 0.0.0.0 --port 8100 > "$LOG_DIR/literacy_agent.log" 2>&1 &
echo $! > "$LOG_DIR/literacy_agent.pid"

# 5. Start Budget Agent Gateway (8000)
echo "Starting Budget API Gateway on port 8000..."
cd "$REPO_ROOT/agents/budget_agent/backend"
nohup uvicorn app.main:app --host 0.0.0.0 --port 8000 > "$LOG_DIR/budget_api.log" 2>&1 &
echo $! > "$LOG_DIR/budget_api.pid"

# 6. Start Accessibility Agent (8005)
echo "Starting Accessibility Agent on port 8005..."
cd "$REPO_ROOT"
nohup uvicorn agents.accessibility_agent.main:app --host 0.0.0.0 --port 8005 > "$LOG_DIR/accessibility_agent.log" 2>&1 &
echo $! > "$LOG_DIR/accessibility_agent.pid"

# 7. Start Frontend Expo Web (8081)
echo "Starting Frontend Expo Web on port 8081..."
cd "$REPO_ROOT/frontend"
nohup npx expo start --web --port 8081 > "$LOG_DIR/frontend.log" 2>&1 &
echo $! > "$LOG_DIR/frontend.pid"

echo "=== All services launched in background. Waiting for health checks... ==="
sleep 5

echo "Health checks:"
curl -s http://localhost:8001/api/v1/schemes/health && echo " -> Scheme Agent: OK" || echo " -> Scheme Agent: FAILED"
curl -s http://localhost:8002/api/v1/fraud-guard/health && echo " -> Fraud Guard: OK" || echo " -> Fraud Guard: FAILED"
curl -s http://localhost:8004/nudges/health && echo " -> Nudge Agent: OK" || echo " -> Nudge Agent: FAILED"
curl -s http://localhost:8100/health && echo " -> Literacy Agent: OK" || echo " -> Literacy Agent: FAILED"
curl -s http://localhost:8000/api/health && echo " -> Budget API: OK" || echo " -> Budget API: FAILED"
curl -s http://localhost:8005/api/v1/accessibility/health && echo " -> Accessibility Agent: OK" || echo " -> Accessibility Agent: FAILED"

echo "=== NitiSaathi is Ready! ==="
