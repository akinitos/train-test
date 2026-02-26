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

# Define the path to the PDF file
pdf_path = "RAG_for_pumps.pdf"  # Update this path to your PDF file

# Extract text from the PDF
raw_text = extract_text_from_pdf(pdf_path)

# Display the first 500 characters of the extracted text
print(f"PDF Length: {len(raw_text)} characters")
print("\nPreview of the extracted text:")
print(raw_text[:500] + "...")

# Split the text into smaller chunks for processing
text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=470,
    chunk_overlap=100,
    length_function=len,
)

# Split the text into chunks
text_chunks = text_splitter.split_text(raw_text)

print(f"Split the document into {len(text_chunks)} chunks")
print(f"\nSample chunk (first chunk):\n{text_chunks[0]}")

# Initialize and test embedding model
print("Embedding model initialized: models/embedding-001")

# Generate embeddings for all text chunks
embeddings = embedding_model.embed_documents(text_chunks)
embeddings_array = np.array(embeddings).astype('float32')

# Create a FAISS index for vector search
embedding_dimension = len(embeddings[0])
index = faiss.IndexFlatL2(embedding_dimension)  # L2 distance for similarity search

# Add vectors to the index
index.add(embeddings_array)
print(f"Added {index.ntotal} vectors to the FAISS index")

def search_similar_chunks(query: str, top_k: int = 3) -> List[Dict[str, Any]]:
    """
    Search for chunks similar to the query and return them with their similarity scores.
    
    Args:
        query: The search query
        top_k: Number of results to return
        
    Returns:
        List of dictionaries with 'chunk', 'score', and 'id' keys
    """
    # Get query embedding
    query_embedding = embedding_model.embed_query(query)
    query_embedding_array = np.array([query_embedding]).astype('float32')
    
    # Search in the index
    distances, indices = index.search(query_embedding_array, top_k)
    
    # Format results
    results = []
    for i, idx in enumerate(indices[0]):
        if idx != -1:  # Valid result
            results.append({
                'chunk': text_chunks[idx],
                'score': float(1 / (1 + distances[0][i])),  # Convert distance to similarity score
                'id': int(idx)
            })
    
    return results

def verify_results_with_llm(query: str, results: List[Dict[str, Any]]) -> str:
    """
    Use the LLM to verify the relevance of the retrieved chunks to the query.
    
    Args:
        query: The original search query
        results: List of retrieved chunks with their scores
        
    Returns:
        A string summarizing the verification results
    """
    # Prepare the prompt for the LLM
    prompt = f"Query: {query}\n\n"
    prompt += "Retrieved Chunks:\n"
    for i, result in enumerate(results):
        prompt += f"{i+1}. (Score: {result['score']:.4f}) {result['chunk']}\n"
    
    prompt += "\nPlease evaluate the relevance of each chunk to the query and provide a summary."
    
    # Get LLM response
    response = llm([HumanMessage(content=prompt)])
    
    return response.content