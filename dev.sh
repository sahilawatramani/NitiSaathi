#!/bin/bash
set -e

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_DIR="$REPO_ROOT/.logs"
mkdir -p "$LOG_DIR"

echo "=== Stopping Any Existing Services ==="
cd "$REPO_ROOT"
./stop_all.sh

echo "=== Starting All Backend Services in Background ==="

# 1. Scheme Agent
cd "$REPO_ROOT"
nohup uvicorn agents.scheme_agent.main:app --host 0.0.0.0 --port 8001 > "$LOG_DIR/scheme_agent.log" 2>&1 &
echo $! > "$LOG_DIR/scheme_agent.pid"

# 2. Fraud Guard
nohup uvicorn agents.fraud_guard.main:app --host 0.0.0.0 --port 8002 > "$LOG_DIR/fraud_guard.log" 2>&1 &
echo $! > "$LOG_DIR/fraud_guard.pid"

# 3. Nudge Agent
nohup uvicorn agents.nudge_agent.main:app --host 0.0.0.0 --port 8004 > "$LOG_DIR/nudge_agent.log" 2>&1 &
echo $! > "$LOG_DIR/nudge_agent.pid"

# 4. Literacy Agent
cd "$REPO_ROOT/agents/literacy_agent"
nohup uvicorn main:app --host 0.0.0.0 --port 8100 > "$LOG_DIR/literacy_agent.log" 2>&1 &
echo $! > "$LOG_DIR/literacy_agent.pid"

# 5. Accessibility Agent
cd "$REPO_ROOT"
nohup uvicorn agents.accessibility_agent.main:app --host 0.0.0.0 --port 8005 > "$LOG_DIR/accessibility_agent.log" 2>&1 &
echo $! > "$LOG_DIR/accessibility_agent.pid"

# 6. Budget API Gateway
cd "$REPO_ROOT/agents/budget_agent/backend"
nohup uvicorn app.main:app --host 0.0.0.0 --port 8000 > "$LOG_DIR/budget_api.log" 2>&1 &
echo $! > "$LOG_DIR/budget_api.pid"

echo "Waiting for backends to initialize..."
sleep 5

echo "=== Starting Interactive Frontend (Expo + Web) ==="
cd "$REPO_ROOT/frontend"

# Get local IP for physical mobile devices to be able to hit the API
LOCAL_IP=$(hostname -I 2>/dev/null | awk '{print $1}')
if [ -z "$LOCAL_IP" ]; then
  LOCAL_IP="127.0.0.1"
fi

# Pass the local IP dynamically to the Expo app
export EXPO_PUBLIC_API_URL="http://$LOCAL_IP:8000"
export EXPO_PUBLIC_SCHEME_URL="http://$LOCAL_IP:8001"
export EXPO_PUBLIC_FRAUD_URL="http://$LOCAL_IP:8002"

echo "Backend APIs are mapped to $LOCAL_IP. Launching Expo..."

# Execute interactive Expo (Replaces the current shell process with Expo)
exec npx expo start --lan --web
