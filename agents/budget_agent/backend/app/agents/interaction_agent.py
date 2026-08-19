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

    if response:
        return response

    if kb_context:
        return f"Based on our knowledge base:\n{kb_context}\n\n(AI provider unavailable; returning retrieved context.)"
    return "I am unable to connect to the AI service. Please check your LLM provider configuration."

