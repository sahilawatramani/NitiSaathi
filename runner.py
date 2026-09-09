import subprocess
import time
import os
import sys

REPO = "/home/amitkumar/Downloads/Nitisaathi"
LOGS = os.path.join(REPO, ".logs")
os.makedirs(LOGS, exist_ok=True)

commands = [
    ("scheme", ["uvicorn", "agents.scheme_agent.main:app", "--host", "0.0.0.0", "--port", "8001"], REPO),
    ("fraud", ["uvicorn", "agents.fraud_guard.main:app", "--host", "0.0.0.0", "--port", "8002"], REPO),
    ("nudge", ["uvicorn", "agents.nudge_agent.main:app", "--host", "0.0.0.0", "--port", "8004"], REPO),
    ("literacy", ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8100"], os.path.join(REPO, "agents/literacy_agent")),
    ("budget", ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"], os.path.join(REPO, "agents/budget_agent/backend")),
    ("frontend", ["npx", "expo", "start", "--web", "--port", "8081"], os.path.join(REPO, "frontend")),
]

processes = []
for name, cmd, cwd in commands:
    log_file = open(os.path.join(LOGS, f"{name}.log"), "w")
    p = subprocess.Popen(cmd, cwd=cwd, stdout=log_file, stderr=log_file, start_new_session=True)
    processes.append((name, p))
    print(f"Launched {name} (PID: {p.pid})")

time.sleep(4)
print("Processes launched successfully.")
