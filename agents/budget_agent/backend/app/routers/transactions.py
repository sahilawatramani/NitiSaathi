import logging
import os
import time

from fastapi import APIRouter, Depends, File, UploadFile
from sqlalchemy.orm import Session
from typing import List

from app.models.database import get_db
from app.models.schemas import Transaction, User
from app.schemas.transaction import TransactionResponse
from app.services.auth_service import get_current_user
from app.services.ingestion_service import parse_csv_transactions
from app.agents.expense_agent import classify_expenses_batch
from app.agents.tax_agent import analyze_tax_batch

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/upload", response_model=List[TransactionResponse])
async def upload_transactions(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Upload CSV and classify transactions using batched AI processing.

    Instead of calling the LLM once per transaction (O(N) API calls), this
    endpoint:
    1. Applies instant rule-based classification to known merchants.
    2. Batches all unknown merchants into a *single* LLM prompt.
    3. Batches tax analysis the same way.
    4. Commits all rows in one DB transaction.
    """
    start = time.perf_counter()

    # --- 1. Save & parse CSV ------------------------------------------------
    file_location = f"temp_{file.filename}"
    with open(file_location, "wb+") as file_object:
        file_object.write(file.file.read())

    parsed_transactions = parse_csv_transactions(file_location)
    os.remove(file_location)

    if not parsed_transactions:
        return []

    # --- 2. Batch expense classification (rule-based + 1 LLM call) ----------
    txn_dicts = [
        {
            "merchant": p.merchant,
            "description": p.description,
            "amount": p.amount,
        }
        for p in parsed_transactions
    ]

    expense_results = classify_expenses_batch(txn_dicts)

    # --- 3. Batch tax analysis (rule-based + 1 LLM call) --------------------
    tax_dicts = [
        {
            "merchant": p.merchant,
            "description": p.description,
            "category": expense_results[i].get("category", "Miscellaneous"),
        }
        for i, p in enumerate(parsed_transactions)
    ]

    tax_results = analyze_tax_batch(tax_dicts)

    # --- 4. Single batch DB commit ------------------------------------------
    db_transactions = []
    for i, p_txn in enumerate(parsed_transactions):
        expense_info = expense_results[i]
        tax_info = tax_results[i]

        db_txn = Transaction(
            user_id=current_user.id,
            date=p_txn.date,
            amount=p_txn.amount,
            merchant=p_txn.merchant,
            description=p_txn.description,
            category=expense_info.get("category", "Miscellaneous"),
            confidence_score=expense_info.get("confidence_score", 0.0),
            is_tax_deductible=tax_info.get("is_tax_deductible", False),
            tax_category=tax_info.get("tax_category"),
        )
        db_transactions.append(db_txn)

    db.add_all(db_transactions)
    db.commit()

    # Refresh to get auto-generated IDs
    for txn in db_transactions:
        db.refresh(txn)

    elapsed = time.perf_counter() - start
    logger.info(
        "Processed %d transactions in %.2fs (user=%s)",
        len(db_transactions),
        elapsed,
        current_user.email,
    )

    return db_transactions


@router.get("/", response_model=List[TransactionResponse])
def get_transactions(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(Transaction)
        .filter(Transaction.user_id == current_user.id)
        .offset(skip)
        .limit(limit)
        .all()
    )
