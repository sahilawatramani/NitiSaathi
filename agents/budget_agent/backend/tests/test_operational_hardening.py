from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_health_endpoint_has_service_metadata():
    response = client.get("/health")
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"
    assert body["service"] == "finassist-backend"


def test_readiness_endpoint_reports_checks():
    response = client.get("/health/ready")
    assert response.status_code in [200, 503]

    body = response.json()
    assert "checks" in body
    assert "database" in body["checks"]
    assert "rag_index" in body["checks"]
    assert "ok" in body["checks"]["database"]
    assert "documents_indexed" in body["checks"]["rag_index"]


def test_security_headers_are_present():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.headers.get("x-content-type-options") == "nosniff"
    assert response.headers.get("x-frame-options") == "DENY"
    assert response.headers.get("referrer-policy") == "strict-origin-when-cross-origin"
    assert response.headers.get("content-security-policy") == "default-src 'none'; frame-ancestors 'none'"
    assert response.headers.get("x-request-id")
