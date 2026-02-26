"""
RAG-based Replacement Analysis Validation.

Uses RAG_for_pumps.pdf to validate web-retrieved pump data and provide
an independent engineering assessment of replacement options, with
confidence scoring derived from FAISS vector similarity.
"""

import json
import os
import numpy as np
import pdfplumber
from typing import List, Dict, Any

import faiss
from langchain_text_splitters import RecursiveCharacterTextSplitter
from google import genai
from dotenv import load_dotenv

load_dotenv()

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
if not GOOGLE_API_KEY:
    raise ValueError("GOOGLE_API_KEY is not set in .env or environment variables")

_client = genai.Client(api_key=GOOGLE_API_KEY)
_EMBEDDING_MODEL = "gemini-embedding-exp-03-07"
_LLM_MODEL = "gemini-2.5-flash"
_PDF_PATH = os.path.join(os.path.dirname(__file__), "RAG_for_pumps.pdf")

print("All libraries imported successfully!")


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _extract_text(pdf_path: str) -> str:
    """Extract text from every page of a PDF."""
    with pdfplumber.open(pdf_path) as pdf:
        pages = []
        for page in pdf.pages:
            txt = page.extract_text()
            if txt:
                pages.append(txt)
        return "\n".join(pages)


def _embed_texts(texts: List[str]) -> List[List[float]]:
    """Batch-embed a list of texts (max 100 per call)."""
    all_emb: List[List[float]] = []
    for i in range(0, len(texts), 100):
        batch = texts[i : i + 100]
        resp = _client.models.embed_content(model=_EMBEDDING_MODEL, contents=batch)
        all_emb.extend([e.values for e in resp.embeddings])
    return all_emb


def _embed_query(text: str) -> List[float]:
    """Embed a single query string."""
    resp = _client.models.embed_content(model=_EMBEDDING_MODEL, contents=[text])
    return resp.embeddings[0].values


def _search(query: str, text_chunks: List[str], index, top_k: int = 5) -> List[Dict[str, Any]]:
    """Return top-k similar chunks with normalised similarity scores."""
    qvec = np.array([_embed_query(query)]).astype("float32")
    distances, indices = index.search(qvec, top_k)
    results = []
    for rank, idx in enumerate(indices[0]):
        if idx == -1:
            continue
        score = float(1.0 / (1.0 + distances[0][rank]))
        results.append({"chunk": text_chunks[idx], "score": score, "id": int(idx)})
    return results


def _confidence_label(score: float) -> str:
    if score >= 0.70:
        return "HIGH"
    if score >= 0.45:
        return "MEDIUM"
    return "LOW"


def _generate_summary(query: str, results: List[Dict[str, Any]]) -> str:
    """Ask the LLM for a professional summary using retrieved context."""
    ctx = "\n".join(f"  [{i+1}] {r['chunk']}" for i, r in enumerate(results))
    prompt = (
        f"Query: {query}\n\n"
        f"Retrieved Document Sections:\n{ctx}\n\n"
        "Instructions:\n"
        "1. Synthesise the above into a concise, professional engineering summary.\n"
        "2. Do NOT reference 'chunk' or 'section numbers'.\n"
        "3. Write as a senior engineer advising on pump replacement.\n"
    )
    resp = _client.models.generate_content(model=_LLM_MODEL, contents=prompt)
    return (resp.text or "").strip()


def _generate_key_findings(query: str, results: List[Dict[str, Any]]) -> List[str]:
    """Ask the LLM to extract 3-5 bullet-point key findings."""
    ctx = "\n".join(f"  [{i+1}] {r['chunk']}" for i, r in enumerate(results))
    prompt = (
        f"Query: {query}\n\nContext:\n{ctx}\n\n"
        "Return ONLY a JSON array of 3-5 short key engineering findings. "
        "Example: [\"Finding one\", \"Finding two\"]\n"
        "No markdown fences, no extra text."
    )
    resp = _client.models.generate_content(model=_LLM_MODEL, contents=prompt)
    raw = (resp.text or "[]").strip()
    # Strip possible markdown fences
    if raw.startswith("```"):
        raw = raw.split("\n", 1)[-1].rsplit("```", 1)[0].strip()
    try:
        findings = json.loads(raw)
        if isinstance(findings, list):
            return [str(f) for f in findings[:5]]
    except json.JSONDecodeError:
        pass
    return [raw]


def _compute_validation_metrics(
    query: str, results: List[Dict[str, Any]], summary: str
) -> Dict[str, Any]:
    """Compute hallucination rate, groundedness, precision, recall and FAISS
    score by asking the LLM to judge the summary against the retrieved context."""
    ctx = "\n".join(f"  [{i+1}] {r['chunk']}" for i, r in enumerate(results))
    prompt = (
        f"You are a strict evaluation judge.\n\n"
        f"Query: {query}\n\n"
        f"Retrieved context:\n{ctx}\n\n"
        f"Generated summary:\n{summary}\n\n"
        "Score the summary on each metric below (0.0 – 1.0).\n"
        "  hallucination_rate: fraction of claims NOT supported by context (lower is better)\n"
        "  groundedness: fraction of claims fully supported by context (higher is better)\n"
        "  precision: fraction of summary claims that are relevant to the query (higher is better)\n"
        "  recall: fraction of relevant context facts captured in the summary (higher is better)\n\n"
        "Return ONLY valid JSON: {\"hallucination_rate\": 0.0, \"groundedness\": 0.0, "
        "\"precision\": 0.0, \"recall\": 0.0}\n"
        "No markdown fences, no extra text."
    )
    resp = _client.models.generate_content(model=_LLM_MODEL, contents=prompt)
    raw = (resp.text or "{}").strip()
    if raw.startswith("```"):
        raw = raw.split("\n", 1)[-1].rsplit("```", 1)[0].strip()
    try:
        metrics = json.loads(raw)
        return {
            "hallucination_rate": round(float(metrics.get("hallucination_rate", 0)), 2),
            "groundedness": round(float(metrics.get("groundedness", 0)), 2),
            "precision": round(float(metrics.get("precision", 0)), 2),
            "recall": round(float(metrics.get("recall", 0)), 2),
        }
    except (json.JSONDecodeError, ValueError, TypeError):
        return {
            "hallucination_rate": 0.0,
            "groundedness": 0.0,
            "precision": 0.0,
            "recall": 0.0,
        }


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def get_replacement_analysis(pump_model: str) -> str:
    """
    Validate pump replacement data by querying RAG_for_pumps.pdf.

    Returns a JSON string:
    {
        "summary": "...",
        "confidence": 0.82,
        "confidence_label": "HIGH",
        "key_findings": ["...", "..."],
        "sources_matched": 5,
        "validation_notes": "..."
    }
    """
    raw_text = _extract_text(_PDF_PATH)
    splitter = RecursiveCharacterTextSplitter(chunk_size=470, chunk_overlap=100, length_function=len)
    chunks = splitter.split_text(raw_text)

    embeddings = np.array(_embed_texts(chunks)).astype("float32")
    index = faiss.IndexFlatL2(embeddings.shape[1])
    index.add(embeddings)

    query = (
        f"Replacement analysis, upgrade options, and lifecycle cost considerations "
        f"for the pump model: {pump_model}"
    )
    results = _search(query, chunks, index, top_k=5)

    avg_score = float(np.mean([r["score"] for r in results])) if results else 0.0
    label = _confidence_label(avg_score)

    summary = _generate_summary(query, results)
    key_findings = _generate_key_findings(query, results)
    metrics = _compute_validation_metrics(query, results, summary)

    validation = {
        "summary": summary,
        "confidence": round(avg_score, 2),
        "confidence_label": label,
        "key_findings": key_findings,
        "sources_matched": len(results),
        "validation_notes": (
            f"Analysis based on {len(results)} relevant sections retrieved from "
            f"RAG_for_pumps.pdf ({len(chunks)} total chunks indexed). "
            f"Average retrieval confidence: {avg_score:.0%} ({label})."
        ),
        "metrics": {
            "hallucination_rate": metrics["hallucination_rate"],
            "groundedness": metrics["groundedness"],
            "precision": metrics["precision"],
            "recall": metrics["recall"],
            "faiss_score": round(avg_score, 2),
        },
    }
    return json.dumps(validation)