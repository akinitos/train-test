"""
RAG-based Maintenance Approach Validation.

Uses Study_of_Various_Maintenance_Approaches.pdf to provide
an independent engineering assessment of maintenance strategies,
with confidence scoring derived from FAISS vector similarity.
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
_PDF_PATH = os.path.join(os.path.dirname(__file__), "Study_of_Various_Maintenance_Approaches.pdf")

print("All libraries imported successfully!")


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _extract_text(pdf_path: str) -> str:
    with pdfplumber.open(pdf_path) as pdf:
        pages = []
        for page in pdf.pages:
            txt = page.extract_text()
            if txt:
                pages.append(txt)
        return "\n".join(pages)


def _embed_texts(texts: List[str]) -> List[List[float]]:
    all_emb: List[List[float]] = []
    for i in range(0, len(texts), 100):
        batch = texts[i : i + 100]
        resp = _client.models.embed_content(model=_EMBEDDING_MODEL, contents=batch)
        all_emb.extend([e.values for e in resp.embeddings])
    return all_emb


def _embed_query(text: str) -> List[float]:
    resp = _client.models.embed_content(model=_EMBEDDING_MODEL, contents=[text])
    return resp.embeddings[0].values


def _search(query: str, text_chunks: List[str], index, top_k: int = 5) -> List[Dict[str, Any]]:
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
    ctx = "\n".join(f"  [{i+1}] {r['chunk']}" for i, r in enumerate(results))
    prompt = (
        f"Query: {query}\n\n"
        f"Retrieved Document Sections:\n{ctx}\n\n"
        "Instructions:\n"
        "1. Synthesise the above into a concise, professional engineering summary.\n"
        "2. Do NOT reference 'chunk' or 'section numbers'.\n"
        "3. Write as a senior reliability engineer advising on maintenance strategy.\n"
    )
    resp = _client.models.generate_content(model=_LLM_MODEL, contents=prompt)
    return (resp.text or "").strip()


def _generate_key_findings(query: str, results: List[Dict[str, Any]]) -> List[str]:
    ctx = "\n".join(f"  [{i+1}] {r['chunk']}" for i, r in enumerate(results))
    prompt = (
        f"Query: {query}\n\nContext:\n{ctx}\n\n"
        "Return ONLY a JSON array of 3-5 short key engineering findings about maintenance. "
        "Example: [\"Finding one\", \"Finding two\"]\n"
        "No markdown fences, no extra text."
    )
    resp = _client.models.generate_content(model=_LLM_MODEL, contents=prompt)
    raw = (resp.text or "[]").strip()
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

def get_maintenance_approach(pump_model: str) -> str:
    """
    Validate and recommend maintenance strategies by querying
    Study_of_Various_Maintenance_Approaches.pdf.

    Returns a JSON string:
    {
        "summary": "...",
        "confidence": 0.78,
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
        f"Recommended maintenance strategy, predictive maintenance schedule, "
        f"and reliability best practices for the pump model: {pump_model}"
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
            f"Study_of_Various_Maintenance_Approaches.pdf ({len(chunks)} total chunks indexed). "
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