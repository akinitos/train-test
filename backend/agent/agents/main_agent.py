"""
Main ADK agent definition.

This module defines the root agent that the Django views will invoke.
Customise the model, instruction, tools, and sub_agents as needed.
"""


import os
import requests
from google.adk.agents import Agent

# ---------------------------------------------------------------------------
# Tools – define plain Python functions that the agent can call
# ---------------------------------------------------------------------------


def greet(name: str) -> str:
    """Greet a user by name."""
    return f"Hello, {name}! How can I help you today?"


# ---------------------------------------------------------------------------
# Web Research Tools
# ---------------------------------------------------------------------------
def search_pump_specs(query: str) -> list[str]:
    """Search pump specs using Tavily API and return top 3 URLs."""
    api_key = os.getenv('TAVILY_API_KEY')
    if not api_key:
        return ["Error: Tavily API key not set in environment."]
    url = "https://api.tavily.com/search"
    headers = {"Content-Type": "application/json", "Authorization": f"Bearer {api_key}"}
    improved_query = f'{query} pump "submittal" OR "technical data" filetype:pdf'
    payload = {"query": improved_query, "search_depth": "basic", "include_answer": False, "include_images": False, "include_raw_content": False}
    try:
        resp = requests.post(url, json=payload, headers=headers, timeout=10)
        resp.raise_for_status()
        data = resp.json()
        results = data.get("results", [])
        return [item.get("url", "") for item in results[:3] if "url" in item]
    except Exception as e:
        return [f"Error: {str(e)}"]

def read_webpage(url: str) -> str:
    """Fetch markdown content from r.jina.ai proxy for a given URL."""
    try:
        resp = requests.get(f"https://r.jina.ai/{url}", timeout=10)
        resp.raise_for_status()
        return resp.text
    except Exception as e:
        return f"Error fetching webpage: {str(e)}"

# ---------------------------------------------------------------------------
# Proofreading Agent
# ---------------------------------------------------------------------------

root_agent = Agent(
    name="main_agent",
    model="gemini-2.5-flash",
    description="The primary assistant agent for MARIO.",
    instruction=(
        "You are a Pump Researcher. When given a manufacturer and product name, use the search_pump_specs tool to find datasheets, then use read_webpage to read them. "
        "Extract three specific data points: FlowNom56, HeadNom56, and Phase. Ignore PUMP_DESIGN and PORTPORT. "
        "MATCHING: You must ONLY extract data for the exact product name requested. If a table contains multiple models, trace the row perfectly. "
        "NOMINAL VS MAX: I specifically need FlowNom56 (Nominal Flow) and HeadNom56 (Nominal Head). Do NOT extract the Maximum Flow or Maximum Head. "
        "PHASE: Look specifically for electrical phase (e.g., 1-phase or 3-phase) and return only the integer (1 or 3). "
        "FORMATTING: Strip out all units (like GPM, m/h, ft, meters). Return ONLY the numbers (floats or integers) for Flow, Head, and Phase. If a value cannot be found, return null. "
        "SYNONYMS: Manufacturers rarely use the word 'Nominal'. You must look for 'Rated Output', 'Duty Point', 'Best Efficiency Point (BEP)', or the midpoint of the standard performance range to find FlowNom56 and HeadNom56." 
        "UNIT CONVERSION (CRITICAL): The final output MUST be in Metric (m³/h for Flow, and meters for Head). If the datasheet provides US units (GPM and Feet), you MUST mathematically convert them before outputting. (Formula: GPM * 0.2271 = m³/h. Feet * 0.3048 = meters). Round the final metric result to the nearest integer." 
        "PDF READING: You will often be reading text extracted from PDFs. Tables may be poorly formatted. Read the text carefully to associate the correct numbers with the correct pump model row." 
        "Your final output MUST be a raw JSON object with keys FlowNom56, HeadNom56, Phase, productName, and manufacturer, and absolutely no markdown formatting or conversational text."
    ),
    tools=[search_pump_specs, read_webpage],
)



# ---------------------------------------------------------------------------
# Root Agent
# ---------------------------------------------------------------------------

root_agent = Agent(
    name="main_agent",
    model="gemini-2.5-flash",
    description="The primary assistant agent for MARIO.",
    instruction=(
        "You are a Pump Researcher. When given a manufacturer and product name, use the search_pump_specs tool to find datasheets, then use read_webpage to read them. "
        "Extract three specific data points: FlowNom56, HeadNom56, and Phase. Ignore PUMP_DESIGN and PORTPORT. "
        "MATCHING: You must ONLY extract data for the exact product name requested. If a table contains multiple models, trace the row perfectly. "
        "NOMINAL VS MAX: I specifically need FlowNom56 (Nominal Flow) and HeadNom56 (Nominal Head). Do NOT extract the Maximum Flow or Maximum Head. "
        "PHASE: Look specifically for electrical phase (e.g., 1-phase or 3-phase) and return only the integer (1 or 3). "
        "FORMATTING: Strip out all units (like GPM, m/h, ft, meters). Return ONLY the numbers (floats or integers) for Flow, Head, and Phase. If a value cannot be found, return null. "
        "SYNONYMS: Manufacturers rarely use the word 'Nominal'. You must look for 'Rated Output', 'Duty Point', 'Best Efficiency Point (BEP)', or the midpoint of the standard performance range to find FlowNom56 and HeadNom56." 
        "UNIT CONVERSION (CRITICAL): The final output MUST be in Metric (m³/h for Flow, and meters for Head). If the datasheet provides US units (GPM and Feet), you MUST mathematically convert them before outputting. (Formula: GPM * 0.2271 = m³/h. Feet * 0.3048 = meters). Round the final metric result to the nearest integer." 
        "PDF READING: You will often be reading text extracted from PDFs. Tables may be poorly formatted. Read the text carefully to associate the correct numbers with the correct pump model row." 
        "Your final output MUST be a raw JSON object with keys FlowNom56, HeadNom56, Phase, productName, and manufacturer, and absolutely no markdown formatting or conversational text."
    ),
    tools=[search_pump_specs, read_webpage],
)


