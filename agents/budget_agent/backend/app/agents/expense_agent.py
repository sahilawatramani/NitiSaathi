import json
import re
from app.services.llm_service import generate_chat_completion, generate_json_completion

# Standardized Indian expense categories
CATEGORIES = [
    "Food & Dining", "Grocery", "Transport", "Shopping",
    "Utilities", "Healthcare", "Entertainment", "Education",
    "Investment", "Insurance", "Rent", "EMI & Loans",
    "Salary & Income", "Transfer", "Miscellaneous"
]

# Rule-based keyword map for fast, offline classification of known merchants
KEYWORD_RULES = {
    "Food & Dining": ["swiggy", "zomato", "dominos", "mcdonald", "kfc", "pizza hut", "starbucks",
                       "cafe coffee day", "barbeque nation", "chai point", "faasos", "biryani",
                       "restaurant", "food", "dining", "burger king", "subway"],
    "Grocery": ["bigbasket", "blinkit", "zepto", "dmart", "big bazaar", "bigbazaar", "reliance fresh",
                "jiomart", "grofers", "spencer", "nature's basket", "more supermarket", "d-mart"],
    "Transport": ["uber", "ola", "rapido", "metro", "irctc", "indigo", "spicejet", "vistara",
                  "petrol", "diesel", "indian oil", "bharat petroleum", "hp petrol", "makemytrip",
                  "redbus", "blusmart", "air india"],
    "Shopping": ["amazon", "flipkart", "myntra", "ajio", "nykaa", "croma", "reliance digital",
                 "shoppers stop", "westside", "meesho", "tata cliq", "decathlon", "ikea", "pepperfry"],
    "Utilities": ["tata power", "bses", "jio", "airtel", "vodafone", "vi ", "act fibernet",
                  "bsnl", "mahanagar gas", "indane", "jal board", "hathway", "tata sky",
                  "electricity", "broadband", "recharge", "water bill"],
    "Healthcare": ["apollo", "apollo pharmacy", "practo", "pharmeasy", "1mg", "medplus", "narayana health",
                   "max healthcare", "fortis", "lenskart", "dr. lal", "netmeds", "medicine",
                   "hospital", "clinic", "pharmacy"],
    "Entertainment": ["netflix", "amazon prime", "hotstar", "spotify", "bookmyshow", "pvr",
                      "inox", "sony liv", "youtube premium", "jiocinema", "audible", "playstation"],
    "Education": ["unacademy", "byju", "coursera", "udemy", "vedantu", "upgrad", "chegg",
                  "kindle", "great learning", "simplilearn", "tuition", "school fee"],
    "Investment": ["zerodha", "groww", "paytm money", "mutual fund", "sip", "ppf", "nsc",
                   "nps", "elss", "kotak amc", "axis mutual"],
    "Insurance": ["lic", "lic premium", "hdfc life", "icici lombard", "star health", "bajaj allianz",
                  "max life", "sbi life", "policybazaar", "care health", "digit insurance",
                  "insurance premium", "life insurance"],
    "Rent": ["house rent", "nobroker", "magicbricks", "pg accommodation", "co-living", "rent pay"],
    "EMI & Loans": ["emi", "home loan", "car loan", "personal loan", "education loan",
                    "bajaj finserv", "loan installment"],
}

CONFIDENCE_THRESHOLD = 0.6

def _rule_based_classify(merchant: str, description: str) -> dict:
    """Fast, offline classification using keyword matching."""
    text = f"{merchant} {description}".lower()
    
    for category, keywords in KEYWORD_RULES.items():
        for kw in keywords:
            if kw in text:
                return {"category": category, "confidence_score": 0.92, "reasoning": f"Rule match: '{kw}'"}
    
    return None  # No rule matched

def _llm_classify(merchant: str, description: str, amount: float) -> dict:
    """Fallback to LLM for unknown merchants."""
    categories_str = ", ".join(CATEGORIES)
    prompt = f"""You are FinAssist AI Expense Classifier for Indian users.

Transaction:
- Merchant: {merchant}
- Description: {description}  
- Amount: ₹{amount}

Classify into EXACTLY one of these categories: {categories_str}

Return ONLY valid JSON:
{{"category": "category_name", "confidence_score": 0.9, "reasoning": "brief reason"}}"""

    result = generate_json_completion(
        system_prompt="You classify Indian personal finance transactions.",
        user_prompt=prompt,
        temperature=0.0,
    )

    if not result:
        return {"category": "Miscellaneous", "confidence_score": 0.5, "reasoning": "LLM unavailable"}

    if result.get("category") not in CATEGORIES:
        result["category"] = "Miscellaneous"
        result["confidence_score"] = 0.4
    return result

def classify_expense(merchant: str, description: str, amount: float) -> dict:
    """Hybrid classifier: tries rule-based first, falls back to LLM."""
    # Step 1: Try fast rule-based matching
    result = _rule_based_classify(merchant, description)
    if result and result["confidence_score"] >= CONFIDENCE_THRESHOLD:
        return result
    
    # Step 2: Fall back to LLM
    return _llm_classify(merchant, description, amount)


def classify_expenses_batch(transactions: list[dict]) -> list[dict]:
    """Batch-classify transactions: rule-based first, then batch-LLM for unknowns.

    Each item in *transactions* must have keys: merchant, description, amount.
    Returns a list of classification dicts in the same order as input.
    """
    results: list[dict | None] = [None] * len(transactions)
    llm_indices: list[int] = []

    # Phase 1 — instant rule-based classification
    for i, txn in enumerate(transactions):
        rule_result = _rule_based_classify(txn["merchant"], txn["description"])
        if rule_result and rule_result["confidence_score"] >= CONFIDENCE_THRESHOLD:
            results[i] = rule_result
        else:
            llm_indices.append(i)

    # Phase 2 — chunked batched LLM calls for all unknowns
    if llm_indices:
        categories_str = ", ".join(CATEGORIES)
        chunk_size = 40
        
        # We need these imports inside or at the top
        from app.services.llm_service import generate_chat_completion
        import json as _json

        for chunk_offset in range(0, len(llm_indices), chunk_size):
            chunk_indices = llm_indices[chunk_offset : chunk_offset + chunk_size]
            
            txn_lines = []
            for idx, i in enumerate(chunk_indices):
                txn = transactions[i]
                txn_lines.append(
                    f"{idx + 1}. Merchant: {txn['merchant']} | "
                    f"Description: {txn['description']} | Amount: ₹{txn['amount']}"
                )

            batch_prompt = f"""You are FinAssist AI Expense Classifier for Indian users.

Classify EACH of the following transactions into EXACTLY one of these categories:
{categories_str}

Transactions:
{chr(10).join(txn_lines)}

Return ONLY a valid JSON array with one object per transaction, in the same order:
[{{"index": 1, "category": "category_name", "confidence_score": 0.9, "reasoning": "brief reason"}}, ...]"""

            raw = generate_chat_completion(
                system_prompt="You classify Indian personal finance transactions. Always return valid JSON.",
                user_prompt=batch_prompt,
                temperature=0.0,
            )

            parsed_list = None
            if raw:
                raw = raw.strip()
                try:
                    parsed_list = _json.loads(raw)
                except _json.JSONDecodeError:
                    start = raw.find("[")
                    end = raw.rfind("]")
                    if start != -1 and end != -1 and end > start:
                        try:
                            parsed_list = _json.loads(raw[start : end + 1])
                        except _json.JSONDecodeError:
                            parsed_list = None

            if isinstance(parsed_list, list) and len(parsed_list) >= len(chunk_indices):
                for idx, i in enumerate(chunk_indices):
                    item = parsed_list[idx] if idx < len(parsed_list) else {}
                    cat = (item.get("category") or "").strip()
                    if cat not in CATEGORIES:
                        cat = "Miscellaneous"
                    results[i] = {
                        "category": cat,
                        "confidence_score": float(item.get("confidence_score", 0.7)),
                        "reasoning": item.get("reasoning", "Batch LLM classification"),
                    }
            else:
                # Fallback: individual LLM calls if batch parsing failed
                for i in chunk_indices:
                    txn = transactions[i]
                    results[i] = _llm_classify(txn["merchant"], txn["description"], txn["amount"])

    return results


def suggest_expense_categories(merchant: str, description: str, amount: float, top_k: int = 4) -> list:
    """Generate short, user-friendly category suggestions for human confirmation."""
    prediction = classify_expense(merchant, description, amount)
    primary = prediction.get("category", "Miscellaneous")

    suggestions = [primary]
    text = f"{merchant} {description}".lower()

    # Add category hints based on overlapping rule keywords.
    for category, keywords in KEYWORD_RULES.items():
        if category == primary:
            continue
        if any(kw in text for kw in keywords):
            suggestions.append(category)
        if len(suggestions) >= top_k:
            break

    # Fill remaining slots with common categories to keep UX consistent.
    for category in CATEGORIES:
        if category not in suggestions:
            suggestions.append(category)
        if len(suggestions) >= top_k:
            break

    suggestions.append("Others")
    return suggestions

