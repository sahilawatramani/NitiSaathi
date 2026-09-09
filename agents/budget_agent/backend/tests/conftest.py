import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from unittest.mock import patch, AsyncMock

from app.main import app
from app.models.database import get_db, Base
from app.models.schemas import User, UserProfile, UserWeeklyFeatures
from app.services.auth_service import get_password_hash
from datetime import date
import os

TEST_DATABASE_URL = 'sqlite:///./test_nitisaathi.db'

engine = create_engine(TEST_DATABASE_URL, connect_args={'check_same_thread': False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope='session', autouse=True)
def create_test_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)
    if os.path.exists('./test_nitisaathi.db'):
        os.remove('./test_nitisaathi.db')

@pytest.fixture
def db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

@pytest.fixture
def client(db):
    def override_get_db():
        try:
            yield db
        finally:
            pass
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()

@pytest.fixture
def test_user(db):
    user = db.query(User).filter_by(email='testuser@nitisaathi.com').first()
    if not user:
        user = User(email='testuser@nitisaathi.com', hashed_password=get_password_hash('testpass123'))
        db.add(user); db.flush()
        profile = UserProfile(
            user_id=user.id, age=28, monthly_income=15000, monthly_expenses=10000,
            monthly_emi=0, language_pref='hi', literacy_level='medium',
            e_shram_registered=False, epfo_esic_status=False,
            savings_bank_account=True, aadhaar_linked=True, days_active_with_aggregator=90
        )
        db.add(profile)
        # Add a weekly feature row
        wf = UserWeeklyFeatures(
            user_id=user.id, week_start=date.today(),
            total_income=15000, total_expense=10000, closing_balance=5000,
            net_cashflow=5000, income_wma_4w=14000, income_volatility_pct=12.5,
            savings_rate_recommendation=0.20, low_balance_flag=False
        )
        db.add(wf)
        db.commit(); db.refresh(user)
    return user

@pytest.fixture
def auth_headers(client, test_user):
    resp = client.post('/api/auth/login', json={'email': 'testuser@nitisaathi.com', 'password': 'testpass123'})
    if resp.status_code != 200:
        # Try register first
        client.post('/api/auth/signup', json={'email': 'testuser@nitisaathi.com', 'password': 'testpass123'})
        resp = client.post('/api/auth/login', json={'email': 'testuser@nitisaathi.com', 'password': 'testpass123'})
    token = resp.json().get('access_token', '')
    return {'Authorization': f'Bearer {token}'}
