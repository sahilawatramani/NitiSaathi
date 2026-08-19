from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from datetime import timedelta
import app.services.llm_service as llm_service

from app.models.database import get_db
from app.models.schemas import User
from app.schemas.user import UserCreate, UserResponse, Token, UserLogin, PasswordResetRequest
from app.services.auth_service import (
    get_password_hash, verify_password, create_access_token,
    ACCESS_TOKEN_EXPIRE_MINUTES, get_current_user
)
from app.services.rate_limit_service import enforce_rate_limit

router = APIRouter()

@router.post("/signup", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(user: UserCreate, request: Request, db: Session = Depends(get_db)):
    enforce_rate_limit(request, key_prefix="auth_signup", limit=10, window_seconds=60)

    db_user = db.query(User).filter(User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed_password = get_password_hash(user.password)
    new_user = User(email=user.email, hashed_password=hashed_password)

    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.post("/login", response_model=Token)
def login(user_data: UserLogin, request: Request, db: Session = Depends(get_db)):
    enforce_rate_limit(request, key_prefix="auth_login", limit=20, window_seconds=60)

    # Now accepts JSON body {email, password} instead of form data
    user = db.query(User).filter(User.email == user_data.email).first()
    if not user or not verify_password(user_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=UserResponse)
def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.post("/reset-password")
def reset_password(payload: PasswordResetRequest, request: Request, db: Session = Depends(get_db)):
    enforce_rate_limit(request, key_prefix="auth_reset_password", limit=5, window_seconds=60)
    
    user = db.query(User).filter(User.email == payload.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    user.hashed_password = get_password_hash(payload.new_password)
    db.commit()
    return {"message": "Password reset successful"}

@router.get("/debug")
def debug_llm():
    return {
        "client_base_url": str(llm_service._ollama_client.base_url) if llm_service._ollama_client else "None",
        "env_var": llm_service.OLLAMA_API_BASE_URL
    }