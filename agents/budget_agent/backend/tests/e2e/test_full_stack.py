"""
End-to-end integration tests for NitiSaathi.
These tests use an in-memory test DB and mock external services.
"""
import pytest
import time
import uuid
from unittest.mock import patch, AsyncMock
from fastapi.testclient import TestClient


MOCK_SCHEME_RESPONSE = {
    'eligible_schemes': [{'scheme_code': 'PMSYM_001', 'name': 'PM-SYM', 'contribution_required': 55}],
    'priority_recommendations': ['Consider PM-SYM pension scheme for ₹55/month contribution.'],
    'timestamp': '2026-09-09'
}

MOCK_FRAUD_RESPONSE = {
    'contains_pin_otp_request': False,
    'alert': None,
    'risk_score': 0.1,
    'reason': 'No suspicious pattern detected'
}

MOCK_NUDGE_RESPONSE = {
    'nudges': [{'id': 'test-nudge-1', 'trigger_id': 'low_balance', 'message': 'Balance low', 'status': 'pending'}],
    'suppressed_trigger_ids': []
}

MOCK_LITERACY_RESPONSE = {
    'rewritten_text': 'आपकी बचत दर 20% रखें। This is the final response.'
}


def _mock_httpx_client():
    """Mock all external specialist agent calls."""
    mock = AsyncMock()
    mock.get = AsyncMock(return_value=AsyncMock(status_code=200, json=AsyncMock(return_value={})))
    mock.post = AsyncMock(return_value=AsyncMock(status_code=200, json=AsyncMock(return_value=MOCK_LITERACY_RESPONSE)))
    return mock


class TestAuthentication:
    def test_register_new_user(self, client):
        unique_email = f"newuser_e2e_{uuid.uuid4().hex[:8]}@test.com"
        resp = client.post('/api/auth/signup', json={
            'email': unique_email, 'password': 'StrongPass123!'
        })
        assert resp.status_code in (200, 201)
        data = resp.json()
    
    def test_login_returns_token(self, client, test_user):
        resp = client.post('/api/auth/login', json={'email': 'testuser@nitisaathi.com', 'password': 'testpass123'})
        assert resp.status_code == 200
        assert 'access_token' in resp.json()
    
    def test_protected_route_without_token(self, client):
        resp = client.get('/api/profile/')
        assert resp.status_code == 401


class TestProfile:
    def test_get_profile(self, client, auth_headers, test_user):
        resp = client.get('/api/profile/', headers=auth_headers)
        assert resp.status_code == 200


class TestConsent:
    def test_set_consent(self, client, auth_headers):
        resp = client.put('/api/privacy/consents', headers=auth_headers, json={
            'purpose': 'nudges', 'granted': True, 'language': 'hi'
        })
        assert resp.status_code == 200
    
    def test_list_consents(self, client, auth_headers):
        resp = client.get('/api/privacy/consents', headers=auth_headers)
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)
    
    def test_invalid_consent_purpose(self, client, auth_headers):
        resp = client.put('/api/privacy/consents', headers=auth_headers, json={
            'purpose': 'invalid_purpose', 'granted': True
        })
        assert resp.status_code == 400


class TestChat:
    @patch('app.orchestration.clients.AgentServiceClient.scheme', new_callable=AsyncMock)
    @patch('app.orchestration.clients.AgentServiceClient.fraud', new_callable=AsyncMock)
    @patch('app.orchestration.clients.AgentServiceClient.nudge', new_callable=AsyncMock)
    @patch('app.orchestration.clients.AgentServiceClient.literacy', new_callable=AsyncMock)
    def test_chat_general_question(self, mock_lit, mock_nudge, mock_fraud, mock_scheme, client, auth_headers, test_user):
        mock_scheme.return_value = MOCK_SCHEME_RESPONSE
        mock_fraud.return_value = MOCK_FRAUD_RESPONSE
        mock_nudge.return_value = MOCK_NUDGE_RESPONSE
        mock_lit.return_value = MOCK_LITERACY_RESPONSE
        
        resp = client.post('/api/chat/', headers=auth_headers, json={
            'message': 'How much should I save this week?'
        })
        assert resp.status_code == 200
        data = resp.json()
        assert 'response' in data
        assert isinstance(data['response'], str)
        assert len(data['response']) > 0
    
    @patch('app.orchestration.clients.AgentServiceClient.scheme', new_callable=AsyncMock)
    @patch('app.orchestration.clients.AgentServiceClient.fraud', new_callable=AsyncMock)
    @patch('app.orchestration.clients.AgentServiceClient.nudge', new_callable=AsyncMock)
    @patch('app.orchestration.clients.AgentServiceClient.literacy', new_callable=AsyncMock)
    def test_chat_fraud_keyword_triggers_fraud_guard(self, mock_lit, mock_nudge, mock_fraud, mock_scheme, client, auth_headers, test_user):
        # Set fraud consent
        client.put('/api/privacy/consents', headers=auth_headers, json={'purpose': 'fraud_detection', 'granted': True, 'language': 'en'})
        mock_fraud.return_value = {'contains_pin_otp_request': True, 'alert_message': 'Never share your UPI PIN!', 'risk_score': 1.0}
        mock_lit.return_value = MOCK_LITERACY_RESPONSE
        mock_nudge.return_value = {'nudges': []}
        mock_scheme.return_value = MOCK_SCHEME_RESPONSE
        
        resp = client.post('/api/chat/', headers=auth_headers, json={
            'message': 'Someone asked for my UPI PIN'
        })
        assert resp.status_code == 200
        data = resp.json()
        assert 'fraud' in data.get('active_agents', [])
    
    def test_chat_returns_trust_metadata(self, client, auth_headers, test_user):
        with patch('app.orchestration.clients.AgentServiceClient.scheme', new_callable=AsyncMock) as ms, \
             patch('app.orchestration.clients.AgentServiceClient.fraud', new_callable=AsyncMock) as mf, \
             patch('app.orchestration.clients.AgentServiceClient.nudge', new_callable=AsyncMock) as mn, \
             patch('app.orchestration.clients.AgentServiceClient.literacy', new_callable=AsyncMock) as ml:
            ms.return_value = MOCK_SCHEME_RESPONSE
            mf.return_value = MOCK_FRAUD_RESPONSE
            mn.return_value = {'nudges': []}
            ml.return_value = MOCK_LITERACY_RESPONSE
            
            resp = client.post('/api/chat/', headers=auth_headers, json={'message': 'budget advice'})
            assert resp.status_code == 200
            data = resp.json()
            # trust_metadata should be present (may be empty dict if no weekly features)
            assert 'trust_metadata' in data


class TestLatency:
    @patch('app.orchestration.clients.AgentServiceClient.scheme', new_callable=AsyncMock)
    @patch('app.orchestration.clients.AgentServiceClient.fraud', new_callable=AsyncMock)
    @patch('app.orchestration.clients.AgentServiceClient.nudge', new_callable=AsyncMock)
    @patch('app.orchestration.clients.AgentServiceClient.literacy', new_callable=AsyncMock)
    def test_chat_latency_under_3s(self, mock_lit, mock_nudge, mock_fraud, mock_scheme, client, auth_headers, test_user):
        mock_scheme.return_value = MOCK_SCHEME_RESPONSE
        mock_fraud.return_value = MOCK_FRAUD_RESPONSE
        mock_nudge.return_value = {'nudges': []}
        mock_lit.return_value = MOCK_LITERACY_RESPONSE
        
        start = time.time()
        resp = client.post('/api/chat/', headers=auth_headers, json={'message': 'save money tips'})
        elapsed = time.time() - start
        
        assert resp.status_code == 200
        assert elapsed < 3.0, f'Chat took {elapsed:.2f}s (> 3s limit)'


class TestReports:
    def test_weekly_report_download(self, client, auth_headers):
        resp = client.get('/api/reports/weekly/download', headers=auth_headers)
        # Should return 200 with PDF or text content
        assert resp.status_code == 200
        assert 'application/pdf' in resp.headers.get('content-type') or 'text/plain' in resp.headers.get('content-type')
    
    def test_weekly_report_email_queued(self, client, auth_headers):
        resp = client.post('/api/reports/weekly/email', headers=auth_headers)
        assert resp.status_code == 200
        assert resp.json().get('status') == 'queued'


class TestHealth:
    def test_health_endpoint(self, client):
        resp = client.get('/health')
        assert resp.status_code == 200
        assert resp.json()['status'] == 'ok'
    
    def test_readiness_endpoint(self, client):
        resp = client.get('/health/ready')
        assert resp.status_code in (200, 503)  # 503 is ok if DB not ready
