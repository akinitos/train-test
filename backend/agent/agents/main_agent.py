"""
Main ADK agent definition.

This module defines the root agent that the Django views will invoke.
Customise the model, instruction, tools, and sub_agents as needed.
"""

from google.adk.agents import Agent

# ---------------------------------------------------------------------------
# Tools – define plain Python functions that the agent can call
# ---------------------------------------------------------------------------


def greet(name: str) -> str:
    """Greet a user by name."""
    return f"Hello, {name}! How can I help you today?"


# ---------------------------------------------------------------------------
# Root Agent
# ---------------------------------------------------------------------------

root_agent = Agent(
    name="main_agent",
    model="gemini-2.5-flash",
    description="The primary assistant agent for MARIO.",
    instruction=(
        "You are a helpful AI assistant integrated with the MARIO application. "
        "Answer the user's questions clearly and concisely. "
        "Use available tools when appropriate."
    ),
    tools=[greet],
)
