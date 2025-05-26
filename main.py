from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import sys
import os

# Add backend to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from backend.claude_finance_tool import generate_response_with_rag_claude
from backend.rag_pipeline import initialize_rag_system

app = FastAPI(title="FinTastic API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Query(BaseModel):
    question: str

# Initialize RAG system on startup
@app.on_event("startup")
async def startup_event():
    print("Initializing FinTastic RAG system...")
    success = initialize_rag_system("data")  # Adjust path as needed
    if not success:
        print("Warning: RAG system initialization failed")

@app.get("/")
async def root():
    return {"message": "FinTastic API is running!", "status": "healthy"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "FinTastic"}

@app.post("/api/ask")
async def ask(query: Query):
    try:
        if not query.question or not query.question.strip():
            raise HTTPException(status_code=400, detail="Question cannot be empty")
        
        print(f"Received question: {query.question}")
        response = generate_response_with_rag_claude(query.question)
        
        if not response:
            raise HTTPException(status_code=500, detail="Failed to generate response")
        
        return {"answer": response}
    
    except Exception as e:
        print(f"API Error: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)