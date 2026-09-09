import asyncio
from fastapi.testclient import TestClient
from agents.budget_agent.backend.app.main import app

client = TestClient(app)
resp = client.post('/api/auth/login', json={'email': 'testuser@nitisaathi.test', 'password': 'testpass123'})
print("Login status:", resp.status_code)
print("Login body:", resp.text)
