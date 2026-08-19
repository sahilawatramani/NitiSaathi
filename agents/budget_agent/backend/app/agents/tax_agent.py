import json
from app.services.rag_service import rag_service
from app.services.llm_service import generate_json_completion

# Rule-based tax deduction map for Indian context
TAX_RULES_MAP = {
    "Insurance": {"is_tax_deductible": True, "tax_category": "Section 80C / 80D", "reasoning": "Insurance premiums are deductible under 80C (life) or 80D (health)"},
    "Healthcare": {"is_tax_deductible": True, "tax_category": "Section 80D", "reasoning": "Medical expenses and health insurance qualify under Section 80D"},
    "Education": {"is_tax_deductible": True, "tax_category": "Section 80C / 80E", "reasoning": "Tuition fees under 80C, education loan interest under 80E"},
    "Investment": {"is_tax_deductible": True, "tax_category": "Section 80C / 80CCD", "reasoning": "PPF, ELSS, NPS contributions qualify for tax deductions"},
    "Rent": {"is_tax_deductible": True, "tax_category": "Section 10(13A) / 80GG", "reasoning": "House rent qualifies for HRA exemption or 80GG deduction"},
    "EMI & Loans": {"is_tax_deductible": True, "tax_category": "Section 24(b) / 80E", "reasoning": "Home loan interest under 24(b), education loan under 80E"},
}

def analyze_tax_deductibility(merchant: str, description: str, category: str) -> dict:
    """Determines if an expense is likely tax deductible using rules + RAG + LLM."""
    
    # Step 1: Direct rule-based lookup
    if category in TAX_RULES_MAP:
        return TAX_RULES_MAP[category]
    
    # Step 2: Check keywords for common deductible items
    text = f"{merchant} {description}".lower()
    deductible_keywords = {
        "donation": ("Section 80G", "Donations to eligible charities are deductible under 80G"),
        "nps": ("Section 80CCD(1B)", "NPS contributions get additional ₹50,000 deduction"),
        "ppf": ("Section 80C", "PPF contributions deductible up to ₹1.5 lakh"),
        "elss": ("Section 80C", "ELSS mutual fund investments qualify under 80C"),
        "lic": ("Section 80C", "Life insurance premiums deductible under 80C"),
        "health insurance": ("Section 80D", "Health insurance premiums deductible under 80D"),
        "home loan": ("Section 24(b)", "Home loan interest deductible up to ₹2 lakh"),
    }
    
    for keyword, (section, reason) in deductible_keywords.items():
        if keyword in text:
            return {"is_tax_deductible": True, "tax_category": section, "reasoning": reason}
    
    # Step 3: Use RAG + LLM for ambiguous cases
    rag_results = rag_service.search(f"{merchant} {description} {category} tax deduction india", k=3)
    kb_context = "\n".join([res["document"] for res in rag_results]) if rag_results else "No relevant tax rules found."
    
    prompt = f"""You are an Indian Tax Advisor AI.

Transaction:
- Merchant: {merchant}
- Description: {description}
- Category: {category}

Relevant Tax Rules from Knowledge Base:
{kb_context}

Based on Indian Income Tax Act, determine if this is tax-deductible.
Return ONLY valid JSON:
{{"is_tax_deductible": true/false, "tax_category": "Section XX", "reasoning": "brief reason"}}"""
    
    result = generate_json_completion(
        system_prompt="You are an expert Indian tax deduction assistant.",
        user_prompt=prompt,
        temperature=0.0,
    )
    if not result:
        return {
            "is_tax_deductible": False,
            "tax_category": None,
            "reasoning": "LLM unavailable; defaulting to conservative non-deductible decision",
        }
    return result


def analyze_tax_batch(transactions: list[dict]) -> list[dict]:
    """Batch tax analysis: rule-based first, then single LLM call for ambiguous cases.

    Each item must have keys: merchant, description, category.
    Returns a list of tax-info dicts in the same order as input.
    """
    results: list[dict | None] = [None] * len(transactions)
    llm_indices: list[int] = []

    for i, txn in enumerate(transactions):
        category = txn["category"]
        merchant = txn.get("merchant", "")
        description = txn.get("description", "")

        # Direct rule-based lookup
        if category in TAX_RULES_MAP:
            results[i] = TAX_RULES_MAP[category]
            continue

        # Keyword lookup
        text = f"{merchant} {description}".lower()
        deductible_keywords = {
            "donation": ("Section 80G", "Donations to eligible charities are deductible under 80G"),
            "nps": ("Section 80CCD(1B)", "NPS contributions get additional ₹50,000 deduction"),
            "ppf": ("Section 80C", "PPF contributions deductible up to ₹1.5 lakh"),
            "elss": ("Section 80C", "ELSS mutual fund investments qualify under 80C"),
            "lic": ("Section 80C", "Life insurance premiums deductible under 80C"),
            "health insurance": ("Section 80D", "Health insurance premiums deductible under 80D"),
            "home loan": ("Section 24(b)", "Home loan interest deductible up to ₹2 lakh"),
        }
        matched = False
        for keyword, (section, reason) in deductible_keywords.items():
            if keyword in text:
                results[i] = {"is_tax_deductible": True, "tax_category": section, "reasoning": reason}
                matched = True
                break
        if matched:
            continue

        # Fast non-deductible shortcut: these categories are definitively NOT tax-deductible
        NON_DEDUCTIBLE_CATEGORIES = {
            "Food & Dining", "Grocery", "Transport", "Shopping",
            "Entertainment", "Utilities", "Miscellaneous", "Salary & Income", "Transfer"
        }
        if category in NON_DEDUCTIBLE_CATEGORIES:
            results[i] = {
                "is_tax_deductible": False,
                "tax_category": None,
                "reasoning": f"{category} expenses are not tax-deductible under Indian IT Act"
            }
        else:
            llm_indices.append(i)

    # Batch LLM call for ambiguous transactions using chunks
    if llm_indices:
        chunk_size = 40
        from app.services.llm_service import generate_chat_completion
        import json as _json

        for chunk_offset in range(0, len(llm_indices), chunk_size):
            chunk_indices = llm_indices[chunk_offset : chunk_offset + chunk_size]
            
            txn_lines = []
            for idx, i in enumerate(chunk_indices):
                txn = transactions[i]
                txn_lines.append(
                    f"{idx + 1}. Merchant: {txn.get('merchant', '')} | "
                    f"Description: {txn.get('description', '')} | Category: {txn['category']}"
                )

            batch_prompt = f"""You are an Indian Tax Advisor AI.

For EACH transaction below, determine if the expense is tax-deductible under the Indian Income Tax Act.

Transactions:
{chr(10).join(txn_lines)}

Return ONLY a valid JSON array with one object per transaction, in the same order:
[{{"index": 1, "is_tax_deductible": true/false, "tax_category": "Section XX", "reasoning": "brief reason"}}, ...]"""

            raw = generate_chat_completion(
                system_prompt="You are an expert Indian tax deduction assistant. Always return valid JSON.",
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
                    results[i] = {
                        "is_tax_deductible": bool(item.get("is_tax_deductible", False)),
                        "tax_category": item.get("tax_category"),
                        "reasoning": item.get("reasoning", "Batch LLM analysis"),
                    }
            else:
                # Fallback: individual calls
                for i in chunk_indices:
                    txn = transactions[i]
                    results[i] = analyze_tax_deductibility(
                        txn.get("merchant", ""), txn.get("description", ""), txn["category"]
                    )

    return results

