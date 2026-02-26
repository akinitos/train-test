"""
Main ADK agent definition.

This module defines the root agent that the Django views will invoke.
Customise the model, instruction, tools, and sub_agents as needed.
"""

import json
import os
import requests

from google.adk.agents import Agent


from .models import IndustrialPumpReport

# Import new validation functions
from validations.pump.rag_for_pump import get_replacement_analysis
from validations.analysis.rag_for_analysis import get_maintenance_approach
from validations.faults.rag_for_faults import get_common_faults


# ---------------------------------------------------------------------------
# Tools – plain Python functions the agent can call
# ---------------------------------------------------------------------------


def greet(name: str) -> str:
    """Greet a user by name."""
    return f"Hello, {name}! How can I help you today?"


# ---------------------------------------------------------------------------
# Web Research Tools
# ---------------------------------------------------------------------------

def search_pump_specs(query: str) -> list[str]:
    """Search pump specs using Tavily API and return the top 10 URLs."""
    api_key = os.getenv("TAVILY_API_KEY")
    if not api_key:
        return ["Error: Tavily API key not set in environment."]
    url = "https://api.tavily.com/search"
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {api_key}",
    }
    improved_query = f'{query} pump "submittal" OR "technical data" filetype:pdf'
    payload = {
        "query": improved_query,
        "search_depth": "advanced",
        "max_results": 10,
        "include_answer": False,
        "include_images": False,
        "include_raw_content": False,
    }
    try:
        resp = requests.post(url, json=payload, headers=headers, timeout=15)
        resp.raise_for_status()
        data = resp.json()
        results = data.get("results", [])
        return [item["url"] for item in results[:10] if "url" in item]
    except Exception as e:
        return [f"Error: {str(e)}"]


def read_webpage(url: str) -> str:
    """Fetch markdown content from r.jina.ai proxy for a given URL."""
    try:
        resp = requests.get(f"https://r.jina.ai/{url}", timeout=15)
        resp.raise_for_status()
        return resp.text
    except Exception as e:
        return f"Error fetching webpage: {str(e)}"

# ---------------------------------------------------------------------------
# Build the JSON-schema string the agent must conform to
# ---------------------------------------------------------------------------

_REPORT_SCHEMA = json.dumps(IndustrialPumpReport.model_json_schema(), indent=2)

# ---------------------------------------------------------------------------
# Root Agent
# ---------------------------------------------------------------------------

root_agent = Agent(
    name="main_agent",
    model="gemini-2.5-flash",
    description="Enterprise industrial-pump research assistant (MARIO).",
    instruction=(
        "You are an Enterprise Pump Research Engineer. "
        "When given a manufacturer and product name, carry out the following workflow exactly:\n\n"

        "1. Use search_pump_specs to find 10 URLs.\n"
        "2. Analyze the URLs/snippets and immediately reject 7 that look like spam or retail. "
        "Document why in rejected_urls_reasoning.\n"
        "3. Use read_webpage on the remaining 3 highly technical URLs (PDFs or official sites).\n"
        "4. Cross-reference the data between the 3 sites. Select the 1 most comprehensive site as the primary, "
        "and use the other 2 for validation. Document this in final_selection_reasoning.\n"
        "5. Extract the strict industrial specifications (Max Flow, Head, Power, etc.).\n"
        "6. Generate a prescriptive_analysis for an industrial engineer, detailing common faults, "
        "recommendations, and troubleshooting for this specific pump variant.\n"
        "7. After extracting the pump specifications and identifying the correct pump model, "
        "explicitly call the following helper functions with the identified pump model as the argument:\n"
        "   - get_replacement_analysis(pump_model)\n"
        "   - get_maintenance_approach(pump_model)\n"
        "   - get_common_faults(pump_model)\n"
        "Each function returns a JSON string. Parse the JSON and include the resulting object "
        "as the value for the corresponding field (replacement_analysis, maintenance_approach, "
        "common_faults) in your final output. Each object has: summary, confidence, "
        "confidence_label, key_findings, sources_matched, validation_notes, and a metrics "
        "sub-object with hallucination_rate, groundedness, precision, recall, faiss_score.\n"
        "8. For decision_process.source_evaluations, create an array with one entry for EVERY "
        "URL from the initial 10 search results. Each entry must have:\n"
        "   - url: the URL\n"
        "   - status: 'selected' (the 1 primary), 'validation' (the 2 cross-check), or 'rejected' (the 7 dropped)\n"
        "   - reason_for_choice: why this source was kept (leave empty for rejected)\n"
        "   - reason_for_elimination: why this source was dropped (leave empty for selected/validation)\n"
        "9. Output strictly adhering to the following JSON schema (no markdown fences, no conversational text):\n\n"
        f"{_REPORT_SCHEMA}"

        "\nMATCHING: Extract data ONLY for the exact product name requested. Trace the correct row in multi-model tables.\n"
        "NOMINAL VS MAX: You must extract Nominal Flow (FlowNom56) and Nominal Head (HeadNom56). Do NOT extract Maximum Flow or Maximum Head. If the word 'Nominal' is missing, look for 'Rated Output', 'Duty Point', or 'Best Efficiency Point'. Convert all final values to metric (m³/h and meters).\n"
        "UNIT CONVERSION (CRITICAL): Final output MUST be metric. "
        "GPM × 0.2271 = m³/h. Feet × 0.3048 = metres. Round to the nearest integer.\n"
        "PDF READING: Tables may be poorly formatted. Read carefully to associate numbers with the correct pump model.\n\n"

        "TRANSPARENCY & THINKING OUT LOUD:\n"
        "Immediately after receiving the 10 URLs from search_pump_specs, and BEFORE calling read_webpage, "
        "you MUST generate a detailed thought. In this thought you must:\n"
        "  - List every URL you are REJECTING, with a short reason for each "
        "(e.g. 'Rejecting amazon.com — retail/e-commerce, not a technical source').\n"
        "  - Clearly announce the 3 URLs you have CHOSEN to read, explaining why each looks promising "
        "(e.g. 'Selecting grundfos.com/product-data — official manufacturer PDF').\n"
        "This triage thought MUST appear before any read_webpage call so the user can see your decision process in real-time.\n\n"
    ),
    tools=[search_pump_specs, read_webpage, get_replacement_analysis, get_maintenance_approach, get_common_faults],
)


