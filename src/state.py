"""
Shared state shape for the LangGraph market-simulation workflow.

This module defines `SimState`, the single state object that flows through each
graph node. Each node reads from and writes to a subset of these keys.

Key assumptions:
- Keys are stable and JSON-serializable because the API returns the full state.
- Nodes should update `current_step` and append human-readable entries to
  `errors` rather than raising in normal failure scenarios.
"""

from typing import Any, Dict, List, TypedDict


class SimState(TypedDict):
    user_prompt: str

    parsed_request: Dict[str, Any]

    retrieved_scenarios: List[Dict[str, Any]]
    retrieved_agents: List[Dict[str, Any]]

    plan: Dict[str, Any]
    world_state: Dict[str, Any]
    round_snapshots: List[Dict[str, Any]]
    tool_outputs: Dict[str, Any]
    participant_reactions: List[Dict[str, Any]]

    final_report: Dict[str, Any]
    evals: Dict[str, Any]

    current_step: str
    errors: List[str]
