import asyncio
from fastapi.testclient import TestClient
from agents.budget_agent.backend.app.main import app

client = TestClient(app)
resp = client.post('/api/auth/signup', json={'email': 'newuser_e2e@test.com', 'password': 'StrongPass123!'})
print("Signup status:", resp.status_code)
print("Signup body:", resp.text)
