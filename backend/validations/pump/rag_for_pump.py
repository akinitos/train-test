# Import necessary libraries
import os
import pdfplumber
import numpy as np
from typing import List, Dict, Any

# For vector storage and retrieval
import faiss

# For text processing
import re
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage

# For env vars (API keys)
from dotenv import load_dotenv
load_dotenv()  # Load environment variables from .env file

# Verify Google API key is set
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
if not GOOGLE_API_KEY:
    raise ValueError("Please set your GOOGLE_API_KEY in .env file or environment variables")

# Initialize LangChain models (API key is picked up from environment)
embedding_model = GoogleGenerativeAIEmbeddings(model="models/embedding-001")
llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash", temperature=0.8)

print("All libraries imported successfully!")

def extract_text_from_pdf(pdf_path: str) -> str:
    """Extract text content from a PDF file."""
    with pdfplumber.open(pdf_path) as pdf:
        text = ""
        for page in pdf.pages:
            text += page.extract_text() + "\n"
        return text


def get_replacement_analysis(pump_model: str) -> str:
    """
    Given a pump model, returns a short, professional engineering summary of replacement analysis
    using the RAG_for_pumps.pdf as context.
    """
    pdf_path = "RAG_for_pumps.pdf"
    raw_text = extract_text_from_pdf(pdf_path)
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=470,
        chunk_overlap=100,
        length_function=len,
    )
    text_chunks = text_splitter.split_text(raw_text)
    embeddings = embedding_model.embed_documents(text_chunks)
    embeddings_array = np.array(embeddings).astype('float32')
    embedding_dimension = len(embeddings[0])
    index = faiss.IndexFlatL2(embedding_dimension)
    index.add(embeddings_array)
    # Compose a query for the pump model
    query = f"What is the recommended replacement analysis for the pump model: {pump_model}? Provide a short, professional engineering summary."
    results = []
    try:
        results = search_similar_chunks.__wrapped__(query, 3, text_chunks, embedding_model, index)
    except Exception:
        results = search_similar_chunks(query, 3)
    summary = verify_results_with_llm.__wrapped__(query, results, llm) if hasattr(verify_results_with_llm, '__wrapped__') else verify_results_with_llm(query, results)
    return str(summary).strip()

def search_similar_chunks(query: str, top_k: int = 3, text_chunks=None, embedding_model=None, index=None) -> List[Dict[str, Any]]:
    """
    Search for chunks similar to the query and return them with their similarity scores.
    Args:
        query: The search query
        top_k: Number of results to return
        text_chunks: List of text chunks
        embedding_model: Embedding model instance
        index: FAISS index
    Returns:
        List of dictionaries with 'chunk', 'score', and 'id' keys
    """
    if text_chunks is None or embedding_model is None or index is None:
        raise ValueError("text_chunks, embedding_model, and index must be provided")
    query_embedding = embedding_model.embed_query(query)
    query_embedding_array = np.array([query_embedding]).astype('float32')
    distances, indices = index.search(query_embedding_array, top_k)
    results = []
    for i, idx in enumerate(indices[0]):
        if idx != -1:
            results.append({
                'chunk': text_chunks[idx],
                'score': float(1 / (1 + distances[0][i])),
                'id': int(idx)
            })
    return results

def verify_results_with_llm(query: str, results: List[Dict[str, Any]], llm_instance=None) -> str:
    """
    Use the LLM to generate a professional summary for the query based on the retrieved chunks.
    Args:
        query: The original search query
        results: List of retrieved chunks with their scores
        llm_instance: LLM instance to use
    Returns:
        A string summarizing the verification results
    """
    if llm_instance is None:
        raise ValueError("llm_instance must be provided")
    prompt = f"Query: {query}\n\n"
    prompt += "Relevant Context:\n"
    for i, result in enumerate(results):
        prompt += f"{i+1}. {result['chunk']}\n"
    prompt += ("\nUsing the above context, provide a short, professional engineering summary for the query. "
               "Do not reference the chunks directly, just answer as an expert engineer.")
    response = llm_instance([HumanMessage(content=prompt)])
    return response.content