FROM python:3.11-slim

WORKDIR /app
COPY agents/budget_agent/backend/requirements.txt /tmp/budget-requirements.txt
COPY agents/scheme_agent/requirements.txt /tmp/scheme-requirements.txt
COPY agents/fraud_guard/requirements.txt /tmp/fraud-requirements.txt
COPY agents/nudge_agent/requirements.txt /tmp/nudge-requirements.txt
COPY agents/literacy_agent/requirements.txt /tmp/literacy-requirements.txt
RUN pip install --no-cache-dir -r /tmp/budget-requirements.txt -r /tmp/scheme-requirements.txt -r /tmp/fraud-requirements.txt -r /tmp/nudge-requirements.txt -r /tmp/literacy-requirements.txt
COPY . /app

# The compose service command selects the independently deployable agent.
