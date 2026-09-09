import os
path = "agents/budget_agent/backend/tests/e2e/test_full_stack.py"
with open(path, "r") as f:
    content = f.read()

content = content.replace("assert resp.headers.get('content-type') in ('application/pdf', 'text/plain')", "assert 'application/pdf' in resp.headers.get('content-type') or 'text/plain' in resp.headers.get('content-type')")

with open(path, "w") as f:
    f.write(content)
