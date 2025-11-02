# Copyright 2025 Google LLC
#
# See LICENSE for details.

from google.adk.agents.llm_agent import Agent

from . import prompt
from .tools import write_markdown_file

task_content_generator_agent = Agent(
    model="gemini-2.5-flash",
    name="task_content_generator_agent",
    description="Generates detailed Markdown content for each task in a learning plan and writes it to a file.",
    instruction=prompt.TASK_CONTENT_AGENT_PROMPT,
    tools=[write_markdown_file],
)