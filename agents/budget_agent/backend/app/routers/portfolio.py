from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from typing import Any, Dict
from app.services.cams_parser import parse_cas_statement
from app.services.auth_service import get_current_user
from app.models.schemas import User

router = APIRouter()

@router.post("/upload")
async def upload_cas_statement(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """Upload and parse a CAMS/KFintech CAS statement."""
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Only CSV files are supported for CAS statements.")
        
    contents = await file.read()
    try:
        portfolio_data = parse_cas_statement(contents)
        return {"status": "success", "data": portfolio_data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to parse statement: {str(e)}")
