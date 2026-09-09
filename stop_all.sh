#!/bin/bash

LOG_DIR="/home/amitkumar/Downloads/Nitisaathi/.logs"

echo "=== Stopping NitiSaathi Services ==="

for PID_FILE in budget_api.pid scheme_agent.pid fraud_guard.pid nudge_agent.pid literacy_agent.pid accessibility_agent.pid frontend.pid; do
  if [ -f "$LOG_DIR/$PID_FILE" ]; then
    PID=$(cat "$LOG_DIR/$PID_FILE")
    if ps -p $PID > /dev/null; then
      echo "Stopping $PID_FILE (PID: $PID)..."
      kill $PID
    else
      echo "$PID_FILE process not running."
    fi
    rm "$LOG_DIR/$PID_FILE"
  fi
done

# Fallback killer
echo "Cleaning up stray processes..."
pkill -f "uvicorn agents.scheme_agent.main:app" || true
pkill -f "uvicorn agents.fraud_guard.main:app" || true
pkill -f "uvicorn agents.nudge_agent.main:app" || true
pkill -f "uvicorn main:app" || true
pkill -f "uvicorn app.main:app" || true
pkill -f "uvicorn agents.accessibility_agent.main:app" || true
pkill -f "expo start" || true

echo "=== All services stopped ==="
