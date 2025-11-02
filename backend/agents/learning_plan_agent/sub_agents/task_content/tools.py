# Copyright 2025 Google LLC
#
# See LICENSE for details.

from google.adk.tools.tool_context import ToolContext
from google.genai import types

async def write_markdown_file(filename: str, content: str, tool_context: ToolContext) -> dict:
    """
    Writes Markdown content to a local file and saves it as an artifact.

    Args:
        filename: Target path for the Markdown file (e.g., 'plans/python-for-ml-tasks.md').
        content: The Markdown text to write.
        tool_context: Injected by ADK; used to save artifacts.

    Returns:
        A small dict with status and file metadata.
    """
    # Ensure parent directory exists
    import os
    os.makedirs(os.path.dirname(filename) or ".", exist_ok=True)

    # Write to disk
    with open(filename, "w", encoding="utf-8") as f:
        f.write(content)

    # Save as artifact for easy retrieval
    await tool_context.save_artifact(
        filename,
        types.Part.from_bytes(data=content.encode("utf-8"), mime_type="text/markdown"),
    )
    return {
        "status": "ok",
        "filename": filename,
        "bytes": len(content.encode("utf-8")),
    }