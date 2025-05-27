from backend.claude_client import client_ant
from backend.rag_pipeline import search_docs_st
import json

# Step 1: Define the tools
tools = [
    {
        "name": "search_similar_financials",
        "description": "Search for companies with similar financial profiles or trends based on a financial feature.",
        "input_schema": {
            "type": "object",
            "properties": {
                "company_name": {
                    "type": "string",
                    "description": "Name of the company being analyzed"
                },
                "feature": {
                    "type": "string",
                    "description": "The specific financial metric or trend to compare (e.g., revenue growth, profitability, debt ratio)"
                }
            },
            "required": ["company_name", "feature"]
        }
    }
]

def process_tool_call(tool_name, tool_input):
    """Process tool calls based on the tool name"""
    if tool_name == "search_similar_financials":
        result = web_search_similar_financials(
            tool_input["company_name"],
            tool_input["feature"]
        )
        return "\n".join(result["similar_companies"])
    return "Tool not found"

def web_search_similar_financials(company_name, feature):
    """Mock financial web search for similar companies"""
    print(f"Searching for companies similar to {company_name} based on {feature}...")

    mock_results = {
        "revenue growth": [
            {"name": "Amazon", "description": "Strong YoY revenue growth with diversified income streams"},
            {"name": "Tesla", "description": "High revenue growth fueled by innovation and global demand"},
            {"name": "Nvidia", "description": "Surging revenue due to AI and data center demand"}
        ],
        "profitability": [
            {"name": "Apple", "description": "Consistent gross margins and high net income"},
            {"name": "Microsoft", "description": "Robust operating profit and recurring revenue"},
            {"name": "Visa", "description": "High margins with predictable cash flow"}
        ],
        "debt ratio": [
            {"name": "Intel", "description": "Conservative debt strategy with strong credit"},
            {"name": "Cisco", "description": "Low debt-to-equity ratio"},
            {"name": "Adobe", "description": "Healthy balance sheet with minimal debt"}
        ]
    }

    category = "revenue growth"  # default
    if "debt" in feature.lower():
        category = "debt ratio"
    elif "profit" in feature.lower() or "margin" in feature.lower():
        category = "profitability"

    results = [
        f"{company['name']}: {company['description']}"
        for company in mock_results[category]
    ]
    return {"similar_companies": results}

def is_query_finance_related(query):
    """Filter out irrelevant queries based on financial keywords"""
    finance_keywords = [
        "revenue", "profit", "loss", "debt", "finance", "financial",
        "earnings", "cash flow", "income", "valuation", "stock",
        "balance sheet", "income statement", "quarter", "report",
        "metric", "trend", "ratio", "company", "analysis", "performance",
        "amazon", "apple", "microsoft", "tesla", "google", "meta", "netflix",
        "doing", "business", "market", "sales", "growth", "forecast"
    ]
    
    query_lower = query.lower()
    return any(keyword in query_lower for keyword in finance_keywords)

def generate_response_with_rag_claude(query, k=50):
    """Run RAG + Claude with tool support for financial questions"""
    try:
        if not is_query_finance_related(query):
            return "This query seems unrelated to finance. Please ask about financial topics like company performance, financial metrics, or market analysis."

        # Get relevant documents from RAG
        try:
            relevant_docs = search_docs_st(query, k=k)
            context = "\n---\n".join(relevant_docs["combined"].tolist())
            print(f'\nRelevant Documents Retrieved: {len(relevant_docs["documents"])} docs')
        except Exception as e:
            print(f"RAG search failed: {e}")
            context = "No relevant financial data found in the database."

        system_prompt = f"""You are a helpful financial assistant. Use the following financial reports and summaries to answer the user's question.

If the user asks for companies with similar financial trends (e.g., revenue growth, profitability), use the search_similar_financials() tool.

Context:
{context}

Provide clear, concise financial analysis based on the available data."""

        # First Claude API call - UPDATED MODEL
        message = client_ant.messages.create(
            model="claude-3-haiku-20240307",  # Updated to Claude Sonnet 4
            system=system_prompt,
            max_tokens=500,
            messages=[{"role": "user", "content": query}],
            tools=tools,
            temperature=0.3
        )

        print(f"Claude Response Stop Reason: {message.stop_reason}")

        # Handle tool use
        if message.stop_reason == "tool_use":
            tool_use = next(block for block in message.content if block.type == "tool_use")
            tool_name = tool_use.name
            tool_input = tool_use.input

            print(f"Tool Used: {tool_name} with input: {tool_input}")

            # Execute tool
            tool_result = process_tool_call(tool_name, tool_input)
            print(f"Tool Result: {tool_result}")

            # Second Claude API call with tool result - UPDATED MODEL
            response = client_ant.messages.create(
                model="claude-3-haiku-20240307",  # Updated to Claude Sonnet 4
                system=system_prompt,
                max_tokens=500,
                messages=[
                    {"role": "user", "content": query},
                    {"role": "assistant", "content": message.content},
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "tool_result",
                                "tool_use_id": tool_use.id,
                                "content": tool_result,
                            }
                        ],
                    },
                ],
                tools=tools,
                temperature=0.3
            )
        else:
            response = message

        # Extract final response text
        final_response = None
        for block in response.content:
            if hasattr(block, "text"):
                final_response = block.text
                break

        if not final_response:
            final_response = "I apologize, but I couldn't generate a proper response. Please try rephrasing your question."

        print(f"Final Response Generated: {len(final_response)} characters")
        return final_response

    except Exception as e:
        print(f"Error in generate_response_with_rag_claude: {e}")
        return f"I encountered an error while processing your request: {str(e)}. Please try again or contact support if the issue persists."