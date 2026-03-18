"""
src/agents/run_agent.py

Runs one simulation agent for one round.

This file is responsible for:
1. Loading the correct persona for a participant,
2. Building prompts from persona + world state + memory,
3. Calling the local Ollama model with structured output,
4. Validating and lightly post-processing the decision.

Why this file matters:
- It is the bridge between your static participant state and true agent behavior.
- It centralizes one agent call so the simulation node can stay clean.
- It gives you one place to add fallbacks, retries, and debug instrumentation.

Important boundary:
- The LLM chooses intent and target weights.
- The backend still owns normalization, risk constraints, execution, and PnL.
"""

from __future__ import annotations

from typing import Dict, List, Optional

from src.agents.ollama_client import OllamaClient, OllamaClientError
from src.agents.personas import get_persona
from src.agents.prompts import (
    build_agent_system_prompt,
    build_agent_user_prompt,
)
from src.agents.schemas import (
    AgentDecision,
    ParticipantState,
    TargetWeight,
    WorldState,
)


ASSET_ORDER = ["cash", "equities", "bonds", "commodities", "volatility"]


def _current_weight_map(participant: ParticipantState) -> Dict[str, float]:
    """
    Return the participant's current weights in the canonical asset order.
    """
    weights = participant.current_weights()
    return {asset: float(weights.get(asset, 0.0)) for asset in ASSET_ORDER}


def _ensure_nonempty_lists(decision: AgentDecision) -> AgentDecision:
    """
    Add sensible defaults when the model returns structurally valid but sparse output.
    """
    if not decision.risk_flags:
        decision.risk_flags = ["No specific risk flag provided."]
    if not decision.watch_items:
        decision.watch_items = ["Monitor next macro development."]
    return decision


def _fill_missing_target_weights(
    decision: AgentDecision,
    participant: ParticipantState,
) -> AgentDecision:
    """
    Ensure every supported asset has an entry in the target weights list.

    Missing sleeves are filled with current weights so downstream execution
    can safely assume a full asset map.
    """
    existing = decision.target_weight_map()
    current = _current_weight_map(participant)

    merged: Dict[str, float] = {}
    reason_map = {item.asset: item.reason for item in decision.target_weights}

    for asset in ASSET_ORDER:
        if asset in existing:
            merged[asset] = existing[asset]
        else:
            merged[asset] = current.get(asset, 0.0)

    decision.target_weights = [
        TargetWeight(
            asset=asset,
            weight=merged[asset],
            reason=reason_map.get(asset, "Carry forward prior allocation for this sleeve."),
        )
        for asset in ASSET_ORDER
    ]

    return decision


def _fallback_hold_decision(
    participant: ParticipantState,
    user_event: str,
    error_detail: Optional[str] = None,
) -> AgentDecision:
    current = _current_weight_map(participant)
    detail = error_detail or "No additional error detail."

    return AgentDecision(
        market_read=(
            f"Fallback hold was used after the event '{user_event}' because "
            f"the model call failed or returned invalid structured output."
        ),
        thought="Maintain current allocation until a higher-confidence read is available.",
        thesis="No reliable structured response was produced, so preserving current exposure is the safest action.",
        action="hold",
        confidence=0.25,
        risk_flags=[f"Fallback used: {detail}"],
        watch_items=["Check Ollama availability, model name, and schema validation."],
        target_weights=[
            TargetWeight(
                asset=asset,
                weight=current.get(asset, 0.0),
                reason="Fallback preserves the existing allocation.",
            )
            for asset in ASSET_ORDER
        ],
    )


def run_agent_decision(
    participant: ParticipantState,
    world: WorldState,
    user_event: str,
    round_number: int,
    client: Optional[OllamaClient] = None,
    model: Optional[str] = None,
    memory_window: int = 4,
) -> AgentDecision:
    """
    Run one agent for one round and return a validated structured decision.
    """
    persona = get_persona(participant.agent_id)
    active_model = model or world.default_model
    active_client = client or OllamaClient(model=active_model)

    system_prompt = build_agent_system_prompt(persona)
    user_prompt = build_agent_user_prompt(
        participant=participant,
        world=world,
        user_event=user_event,
        round_number=round_number,
        memory_window=memory_window,
    )

    try:
        decision = active_client.chat_structured(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            response_model=AgentDecision,
            model=active_model,
        )

        decision = _ensure_nonempty_lists(decision)
        decision = _fill_missing_target_weights(decision, participant)
        return decision

    except OllamaClientError as exc:
        return _fallback_hold_decision(
            participant,
            user_event,
            error_detail=f"OllamaClientError: {exc}",
        )
    except Exception as exc:
        return _fallback_hold_decision(
            participant,
            user_event,
            error_detail=f"{type(exc).__name__}: {exc}",
        )



def run_all_agent_decisions(
    participants: List[ParticipantState],
    world: WorldState,
    user_event: str,
    round_number: int,
    client: Optional[OllamaClient] = None,
    model: Optional[str] = None,
    memory_window: int = 4,
) -> Dict[str, AgentDecision]:
    """
    Convenience helper for running all participants in a round.
    """
    decisions: Dict[str, AgentDecision] = {}

    active_model = model or world.default_model
    shared_client = client or OllamaClient(model=active_model)

    for participant in participants:
        decision = run_agent_decision(
            participant=participant,
            world=world,
            user_event=user_event,
            round_number=round_number,
            client=shared_client,
            model=active_model,
            memory_window=memory_window,
        )
        decisions[participant.agent_id] = decision

    return decisions
