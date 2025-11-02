# Copyright 2025 Google LLC
#
# See LICENSE for details.

from google.adk.agents.llm_agent import Agent

from . import prompt

single_task_content_agent = Agent(
    model="gemini-2.5-flash",
    name="single_task_content_agent",
    description="Generates detailed Markdown content for a specific task within a learning event.",
    instruction=prompt.SINGLE_TASK_CONTENT_AGENT_PROMPT,
    tools=[],
)

