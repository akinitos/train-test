"""
RAG-based Replacement Analysis Validation.

Uses RAG_for_pumps.pdf to validate web-retrieved pump data and provide
an independent engineering assessment of replacement options, with
confidence scoring derived from FAISS vector similarity.

OPTIMISED: Single LLM call (summary + key_findings combined),
algorithmic validation metrics (no LLM), cached FAISS index.
"""

import json
import os
import re
import numpy as np
import pdfplumber
from typing import List, Dict, Any, Tuple

import faiss
from langchain_text_splitters import RecursiveCharacterTextSplitter
from google import genai
from dotenv import load_dotenv

load_dotenv()

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
if not GOOGLE_API_KEY:
    raise ValueError("GOOGLE_API_KEY is not set in .env or environment variables")

_client = genai.Client(api_key=GOOGLE_API_KEY)
_EMBEDDING_MODEL = "text-embedding-004"
_LLM_MODEL = "gemini-2.5-flash"
_PDF_PATH = os.path.join(os.path.dirname(__file__), "RAG_for_pumps.pdf")

print("All libraries imported successfully!")

# ---------------------------------------------------------------------------
# Module-level cache – avoids re-extracting/re-embedding the static PDF
# ---------------------------------------------------------------------------
_cached_chunks: List[str] | None = None
_cached_index: faiss.IndexFlatL2 | None = None


def _get_chunks_and_index() -> Tuple[List[str], faiss.IndexFlatL2]:
    """Return (chunks, faiss_index), building them only on the first call."""
    global _cached_chunks, _cached_index
    if _cached_chunks is not None and _cached_index is not None:
        return _cached_chunks, _cached_index

    raw_text = _extract_text(_PDF_PATH)
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=470, chunk_overlap=100, length_function=len
    )
    _cached_chunks = splitter.split_text(raw_text)

    embeddings = np.array(_embed_texts(_cached_chunks)).astype("float32")
    _cached_index = faiss.IndexFlatL2(embeddings.shape[1])
    _cached_index.add(embeddings)

    return _cached_chunks, _cached_index


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


# ---------------------------------------------------------------------------
# Single LLM call: summary + key findings combined
# ---------------------------------------------------------------------------

def _generate_summary_and_findings(
    query: str, results: List[Dict[str, Any]]
) -> Tuple[str, List[str]]:
    """One LLM call that returns both the summary and key findings."""
    ctx = "\n".join(f"  [{i+1}] {r['chunk']}" for i, r in enumerate(results))
    prompt = (
        f"Query: {query}\n\n"
        f"Retrieved Document Sections:\n{ctx}\n\n"
        "Return ONLY a valid JSON object with two keys:\n"
        '  "summary": a concise professional engineering summary (2-4 sentences, '
        "written as a senior engineer advising on pump replacement; do NOT "
        "reference chunk or section numbers),\n"
        '  "key_findings": a JSON array of 3-5 short key engineering findings.\n\n'
        "Example:\n"
        '{"summary": "...", "key_findings": ["Finding 1", "Finding 2"]}\n'
        "No markdown fences, no extra text."
    )
    resp = _client.models.generate_content(model=_LLM_MODEL, contents=prompt)
    raw = (resp.text or "{}").strip()
    if raw.startswith("```"):
        raw = raw.split("\n", 1)[-1].rsplit("```", 1)[0].strip()
    try:
        data = json.loads(raw)
        summary = str(data.get("summary", ""))
        findings = data.get("key_findings", [])
        if isinstance(findings, list):
            findings = [str(f) for f in findings[:5]]
        else:
            findings = [str(findings)]
        return summary, findings
    except json.JSONDecodeError:
        return raw, [raw]


# ---------------------------------------------------------------------------
# Algorithmic validation metrics – NO LLM call needed
# ---------------------------------------------------------------------------

_STOP_WORDS = frozenset(
    "a an the is are was were be been being have has had do does did "
    "will would shall should may might can could of in to for on with at "
    "by from as into through during before after above below between out "
    "up down and but or nor not so yet both either neither each every all "
    "any few more most other some such no nor too very just about also "
    "than then that this these those it its".split()
)


def _tokenise(text: str) -> List[str]:
    """Lowercase word tokenisation, stripping stop-words and short tokens."""
    words = re.findall(r"[a-z0-9]{2,}", text.lower())
    return [w for w in words if w not in _STOP_WORDS]


def _compute_validation_metrics(
    results: List[Dict[str, Any]], summary: str
) -> Dict[str, float]:
    """Compute quality metrics using algorithmic heuristics (zero LLM cost).

    - precision      : fraction of top-k chunks whose FAISS score >= 0.50
    - recall         : relevant retrieved / estimated total relevant
    - groundedness   : unigram overlap between summary and context
    - hallucination  : 1 - groundedness
    """
    if not results:
        return {
            "hallucination_rate": 1.0,
            "groundedness": 0.0,
            "precision": 0.0,
            "recall": 0.0,
        }

    relevance_threshold = 0.50
    relevant_count = sum(1 for r in results if r["score"] >= relevance_threshold)
    precision = relevant_count / len(results) if results else 0.0

    estimated_total_relevant = max(relevant_count, 3)
    recall = min(relevant_count / estimated_total_relevant, 1.0)

    context_text = " ".join(r["chunk"] for r in results)
    ctx_tokens = set(_tokenise(context_text))
    sum_tokens = _tokenise(summary)

    if sum_tokens:
        grounded_tokens = sum(1 for t in sum_tokens if t in ctx_tokens)
        groundedness = grounded_tokens / len(sum_tokens)
    else:
        groundedness = 0.0

    hallucination_rate = round(1.0 - groundedness, 2)

    return {
        "hallucination_rate": max(hallucination_rate, 0.0),
        "groundedness": round(groundedness, 2),
        "precision": round(precision, 2),
        "recall": round(recall, 2),
    }


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def get_replacement_analysis(pump_model: str) -> str:
    """
    Validate pump replacement data by querying RAG_for_pumps.pdf.

    Returns a JSON string with summary, confidence, key_findings, metrics, etc.
    """
    # --- TEMPORARILY DISABLED: embedding API unavailable ---
    validation = {
        "summary": f"RAG validation for pump model '{pump_model}' is temporarily disabled due to embedding API unavailability. The agent's analysis is provided without PDF-backed validation.",
        "confidence": 0.0,
        "confidence_label": "skipped",
        "key_findings": ["RAG embedding service temporarily unavailable – validation skipped."],
        "sources_matched": 0,
        "validation_notes": "Embedding model endpoint is currently unavailable. Re-enable when the Google embedding API is restored.",
        "metrics": {
            "hallucination_rate": "N/A",
            "groundedness": "N/A",
            "precision": "N/A",
            "recall": "N/A",
            "faiss_score": 0.0,
        },
    }
    return json.dumps(validation)