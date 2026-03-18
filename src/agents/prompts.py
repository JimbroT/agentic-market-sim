"""
src/agents/prompts.py

Prompt builders for the market simulation agents.

This file is responsible for:
1. Building a stable system prompt from each persona,
2. Building a round-specific user prompt from world state + memory + portfolio,
3. Reinforcing structured-output compliance for Ollama.

Design notes:
- Keep the system prompt focused on role, mandate, and style.
- Keep the user prompt factual, compact, and state-rich.
- Explicitly instruct the model to return only valid JSON matching the schema.
"""

from __future__ import annotations

import json
from typing import Dict, List

from src.agents.memory import memory_context_dict
from src.agents.schemas import AgentPersonaConfig, ParticipantState, WorldState


ASSET_ORDER = ["cash", "equities", "bonds", "commodities", "volatility"]


def _safe_json(data) -> str:
    return json.dumps(data, indent=2, ensure_ascii=False)


def _current_weight_map(participant: ParticipantState) -> Dict[str, float]:
    weights = participant.current_weights()
    return {asset: float(weights.get(asset, 0.0)) for asset in ASSET_ORDER}


def _recent_memory_slice(participant: ParticipantState, memory_window: int = 4) -> List[Dict]:
    memory_payload = memory_context_dict(participant)
    recent_rounds = memory_payload.get("recent_rounds", [])
    return recent_rounds[-memory_window:]


def build_agent_system_prompt(persona: AgentPersonaConfig) -> str:
    beliefs_blob = "\n".join(
        f"- {belief}" for belief in (persona.default_beliefs or [])
    ) or "- No explicit prior beliefs provided."

    watch_blob = "\n".join(
        f"- {item}" for item in (persona.default_watch_items or [])
    ) or "- No explicit watch items provided."

    return f"""
You are {persona.display_name}, a market simulation agent.

Identity:
- Role: {persona.role}
- Mandate: {persona.mandate}
- Style: {persona.style}
- Risk budget: {persona.risk_budget:.2f}

Default beliefs:
{beliefs_blob}

Default watch items:
{watch_blob}

Behavior rules:
- Stay consistent with your mandate and style.
- Think like a professional portfolio manager, trader, or observer in your role.
- React specifically to the world state and the user-authored event.
- Make concrete decisions rather than vague commentary.
- You may be cautious, but do not become generic unless the data is genuinely unclear.
- Confidence must be a number between 0 and 1.
- Target weights should cover cash, equities, bonds, commodities, and volatility.
- The backend will normalize and risk-check your weights, so give your best intended allocation.
- Return only valid JSON matching the provided schema.
- Do not include markdown, backticks, prose outside JSON, or any explanation outside the JSON object.
""".strip()


def build_agent_user_prompt(
    participant: ParticipantState,
    world: WorldState,
    user_event: str,
    round_number: int,
    memory_window: int = 4,
) -> str:
    memory_payload = memory_context_dict(participant)
    recent_rounds = _recent_memory_slice(participant, memory_window=memory_window)
    current_weights = _current_weight_map(participant)

    prompt_payload = {
        "participant": {
            "agent_id": participant.agent_id,
            "display_name": participant.display_name,
            "role": participant.role,
            "mandate": participant.mandate,
            "style": participant.style,
            "risk_budget": participant.risk_budget,
            "latest_action": participant.latest_action,
            "latest_thesis": participant.latest_thesis,
            "latest_confidence": participant.latest_confidence,
        },
        "world": {
            "round_number": round_number,
            "scenario_prompt": world.scenario_prompt,
            "scenario_summary": world.scenario_summary,
            "regime": world.regime,
            "world_variables": {
                "rates": world.world_variables.rates,
                "inflation": world.world_variables.inflation,
                "growth": world.world_variables.growth,
                "volatility": world.world_variables.volatility,
                "sentiment": world.world_variables.sentiment,
            },
        },
        "user_event": user_event,
        "portfolio": {
            "portfolio_value": participant.portfolio_value,
            "current_weights": current_weights,
        },
        "memory": {
            "reflection_summary": memory_payload.get("reflection_summary"),
            "persistent_beliefs": memory_payload.get("persistent_beliefs", []),
            "mistakes_learned": memory_payload.get("mistakes_learned", []),
            "recent_rounds": recent_rounds,
        },
        "required_output_rules": {
            "action_enum": [
                "hold",
                "rebalance",
                "de_risk",
                "add_risk",
                "hedge",
                "rotate",
            ],
            "assets": ASSET_ORDER,
            "confidence_range": [0, 1],
            "notes": [
                "Return only valid JSON matching the provided schema.",
                "No markdown fences.",
                "No commentary outside the JSON object.",
                "Be specific to this scenario and event.",
                "Provide a full set of target weights for all five assets if possible.",
            ],
        },
    }

    return f"""
You are deciding one portfolio action for this round.

Use the state below to produce a structured decision that is:
- specific to the current event,
- consistent with the participant's role and memory,
- realistic for a multi-asset portfolio manager/trader,
- valid JSON matching the provided schema.

Important:
- Do not output markdown.
- Do not output explanations before or after the JSON.
- Return exactly one JSON object.
- If uncertain, still produce your best structured decision rather than refusing.

SIMULATION_STATE:
{_safe_json(prompt_payload)}
""".strip()
