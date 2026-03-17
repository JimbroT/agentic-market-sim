from typing import TypedDict, List, Dict, Any


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
