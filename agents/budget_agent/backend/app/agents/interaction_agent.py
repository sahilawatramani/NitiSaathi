from app.services.rag_service import rag_service
from app.services.llm_service import generate_chat_completion

def handle_user_query(query: str, context: str) -> str:
    """RAG-powered conversational AI for finance questions."""
    
    # Step 1: Search knowledge base for relevant info
    rag_results = rag_service.search(query, k=5)
    kb_context = "\n".join([res["document"] for res in rag_results]) if rag_results else ""
    
    if not kb_context:
        kb_context = "No matching knowledge base snippets found."

    prompt = f"""You are FinAssist, an expert Indian personal finance assistant.

User's Financial Summary:
{context}

Relevant Knowledge Base Information:
{kb_context}

User Question: {query}

Instructions:
- You are an expert Life Event Financial Advisor and AI Planner for Indian users.
- Use the User's Financial Profile (Age, Income, Savings, Goals) to give hyper-personalized advice.
- When they ask about a Life Event (Marriage, New Baby, Bonus, Inheritance), explicitly mention how it impacts their FIRE goals and suggest tax-efficient investments (e.g. SIPs).
- Answer specifically for Indian context (INR, Indian tax laws like 80C/80D).
- IMPORTANT: Format your response using Markdown. Use **bolding**, line breaks, and bullet points to make the advice incredibly easy to read. Never return a huge block of text."""
    
    response = generate_chat_completion(
        system_prompt="You are FinAssist, an expert Indian personal finance AI assistant.",
        user_prompt=prompt,
        temperature=0.3,
    )

    if response and not response.startswith("LLM provider error"):
        return response

    return generate_fallback_advice(query, context, kb_context)


def generate_fallback_advice(query: str, context: str, kb_context: str) -> str:
    q_lower = query.lower()

    if "bonus" in q_lower or "lakh" in q_lower or "windfall" in q_lower or "inheritance" in q_lower:
        return (
            "### 💰 **Smart Allocation Plan for Your Bonus**\n\n"
            "Congratulations on your bonus! Here is a recommended **70-20-10 allocation rule** for optimal financial growth in India:\n\n"
            "- 📈 **70% Wealth Accumulation (₹70,000)**: Allocate towards **Direct Flexi-Cap or Nifty 50 Index Mutual Funds** via an STP/SIP over 3 to 6 months. Consider **ELSS Tax Saver Funds** if you need tax deductions under Section 80C.\n"
            "- 🛡️ **20% Safety Net / Debt Clearance (₹20,000)**: Top up your Emergency Fund in a Liquid/FD account or payoff high-interest loans.\n"
            "- 🎉 **10% Personal Reward (₹10,000)**: Enjoy or fund a short-term personal goal guilt-free!\n\n"
            "💡 *Pro Tip: Avoid lump-sum equity deployment in peak valuations—stagger your investments via monthly SIP/STP installments.*"
        )
    elif "baby" in q_lower or "child" in q_lower:
        return (
            "### 👶 **Financial Planning for a New Baby**\n\n"
            "Preparing for a newborn requires expanding safety nets and starting early education funds:\n\n"
            "1. 🏥 **Health Insurance Upgrade**: Increase health cover to at least ₹10-15 Lakhs and check maternity waiting periods.\n"
            "2. 🎓 **Dedicated Education SIP**: Start an equity mutual fund SIP dedicated to long-term goals (15+ years horizon).\n"
            "3. 🛡️ **Emergency Cushion**: Expand your emergency fund to **6-9 months of family living expenses**.\n"
            "4. 📄 **Term Insurance**: Ensure term life coverage equal to **10x to 15x annual income**."
        )
    elif "wedding" in q_lower or "marriage" in q_lower:
        return (
            "### 💒 **Wedding Allocation & Portfolio Rebalancing**\n\n"
            "For short-term major life events (< 3 years):\n\n"
            "- 🔒 **Capital Protection**: Shift planned wedding funds from equity to **Arbitrage Funds, Low Duration Debt, or High-Yield FDs**.\n"
            "- 📊 **Expense Cap**: Fix a budget ceiling early to avoid taking high-interest personal loans.\n"
            "- 💳 **Vendor Liquidity**: Keep vendor milestone payments liquid and easily accessible."
        )
    elif "retire" in q_lower or "fire" in q_lower:
        return (
            "### 🎯 **Retirement & FIRE Strategy**\n\n"
            "- 📊 **Corpus Goal**: Target 25x–30x of annual projected living expenses.\n"
            "- ⚖️ **Asset Mix**: Maintain 60-70% Equity (Index / Flexi Cap) and 30-40% Fixed Income (PPF / EPF / NPS) during accumulation.\n"
            "- 🧾 **NPS Tax Saver**: Claim extra ₹50,000 deduction under Section 80CCD(1B)."
        )
    else:
        output = "### 💡 **FinAssist Financial Guidance**\n\n"
        if kb_context and "No matching" not in kb_context:
            output += f"**Knowledge Base Reference:**\n{kb_context}\n\n"
        output += (
            "**Core Recommendations:**\n"
            "- 🛡️ **Emergency Fund**: Maintain 6 months of expenses in a liquid savings account or liquid fund.\n"
            "- 📈 **Investments**: Build long-term wealth using low-cost Index Funds and tax-efficient PPF/EPF.\n"
            "- 📋 **Insurance**: Ensure term life and comprehensive health insurance are in place before aggressive investing."
        )
        return output

