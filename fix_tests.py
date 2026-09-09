import os
path = "agents/budget_agent/backend/tests/e2e/test_full_stack.py"
with open(path, "r") as f:
    content = f.read()

content = content.replace("data={\n            'username': 'testuser@nitisaathi.test', 'password': 'testpass123'\n        }", "json={'email': 'testuser@nitisaathi.test', 'password': 'testpass123'}")
content = content.replace("data={", "json={")
content = content.replace("'username':", "'email':")

with open(path, "w") as f:
    f.write(content)
