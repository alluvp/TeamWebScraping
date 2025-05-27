import os
import pandas as pd
from typing import List, Dict
from sentence_transformers import SentenceTransformer
import faiss
import numpy as np

# Constants
DIMENSIONS = 384  # based on 'all-MiniLM-L6-v2'
EMBEDDING_MODEL = "all-MiniLM-L6-v2"

# Load model once globally
embedder = SentenceTransformer(EMBEDDING_MODEL)

# Global variables for the index
global_index = None
global_doc_texts = None
global_doc_matrix = None

def get_embedding(text: str) -> np.ndarray:
    """Get embedding for a single text"""
    return embedder.encode(text.replace("\n", " "), convert_to_numpy=True)

def csv_to_documents(df: pd.DataFrame, company_name: str) -> List[str]:
    """Convert CSV to document chunks"""
    documents = []
    for _, row in df.iterrows():
        metric = str(row.iloc[0]).strip().replace("\n", " ")
        for year_idx in range(1, 6):
            year = 2024 - (year_idx - 1)
            try:
                value = float(row.iloc[year_idx])
                if not pd.isna(value):
                    doc = f"{company_name} | {metric} in {year}: {value}"
                    documents.append(doc)
            except Exception:
                continue
    return documents

def build_faiss_index(docs: List[str]):
    """Build FAISS index from documents"""
    index = faiss.IndexFlatL2(DIMENSIONS)
    doc_embeddings = [get_embedding(doc) for doc in docs]
    doc_matrix = np.vstack(doc_embeddings).astype("float32")
    index.add(doc_matrix)
    return index, docs, doc_matrix

def load_documents_from_csvs(folder_path: str) -> List[str]:
    """Load all documents from CSVs in a folder"""
    all_documents = []
    
    if not os.path.exists(folder_path):
        print(f"Warning: Folder {folder_path} does not exist")
        return all_documents
    
    csv_files = [f for f in os.listdir(folder_path) if f.endswith(".csv")]
    print(f"Found {len(csv_files)} CSV files")
    
    for file in csv_files:
        filepath = os.path.join(folder_path, file)
        company_name = file.replace(".csv", "")
        try:
            df = pd.read_csv(filepath, header=None)
            documents = csv_to_documents(df, company_name)
            all_documents.extend(documents)
            print(f"Loaded {len(documents)} documents from {file}")
        except Exception as e:
            print(f"Error loading {file}: {e}")
    
    return all_documents

def initialize_rag_system(csv_folder: str = "data"):
    """Initialize the RAG system with documents"""
    global global_index, global_doc_texts, global_doc_matrix
    
    print("Loading CSVs...")
    docs = load_documents_from_csvs(csv_folder)
    
    if not docs:
        print("No documents found!")
        return False
    
    print(f"Building FAISS index with {len(docs)} documents...")
    global_index, global_doc_texts, global_doc_matrix = build_faiss_index(docs)
    print("RAG system initialized successfully!")
    return True

def search_docs_st(question: str, k: int = 50) -> Dict:
    """Search documents using the initialized RAG system"""
    global global_index, global_doc_texts, global_doc_matrix
    
    if global_index is None:
        raise ValueError("RAG system not initialized. Call initialize_rag_system() first.")
    
    question_vec = get_embedding(question).reshape(1, -1).astype("float32")
    distances, indices = global_index.search(question_vec, k)
    
    retrieved_docs = [global_doc_texts[i] for i in indices[0]]
    
    return {
        "combined": pd.Series(retrieved_docs),
        "documents": retrieved_docs,
        "distances": distances[0],
        "indices": indices[0]
    }

# Initialize on import (you can also call this manually)
if __name__ != "__main__":
    # Try to initialize automatically when imported
    try:
        initialize_rag_system()
    except Exception as e:
        print(f"Warning: Could not auto-initialize RAG system: {e}")