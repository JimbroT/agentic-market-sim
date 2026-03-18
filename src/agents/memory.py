"""
src/agents/memory.py

Manages per-agent memory across simulation rounds.

This file is responsible for:
1. Appending a new detailed memory entry after each round,
2. Keeping only the most recent detailed memories in short-term context,
3. Maintaining a compact reflection summary that can be injected into prompts.

Why this file matters:
- It gives each avatar continuity from round to round.
- It prevents prompts from growing without bound.
- It creates a clean boundary between "recent detailed memory" and
  "compressed long-term memory."

Design philosophy:
- Short-term memory should be detailed and recent.
- Long-term memory should be compressed and behaviorally useful.
- The first version can be deterministic and local; later you can swap
  the reflection logic for an LLM summarizer if desired.
"""

from __future__ import annotations

from typing import Dict, List, Optional

from src.agents.schemas import (
    AgentDecision,
    AgentMemory,
    AgentRoundMemory,
    ParticipantState,
)


DEFAULT_SHORT_TERM_MEMORY_LIMIT = 5
DEFAULT_REFLECTION_WINDOW = 8


def _model_dump(model_obj):
    """
    Pydantic v1/v2 compatibility helper for serialization.
    """
    if hasattr(model_obj, "model_dump"):
        return model_obj.model_dump()
    return model_obj.dict()


def _infer_lesson(
    decision: AgentDecision,
    pnl_delta: float,
) -> str:
    """
    Generate a lightweight lesson string from the latest round result.
    """
    if pnl_delta > 0:
        if decision.action in {"add_risk", "rotate", "rebalance"}:
            return "Recent positioning worked as intended; the agent may trust this playbook slightly more."
        if decision.action == "hedge":
            return "Defensive positioning added value in this environment."
        return "The cautious posture held up reasonably well this round."

    if pnl_delta < 0:
        if decision.action in {"add_risk", "rotate"}:
            return "Aggressive repositioning was punished; the agent should reassess conviction under uncertainty."
        if decision.action == "hold":
            return "Inaction carried a cost; the agent may need to react faster to new information."
        if decision.action == "hedge":
            return "The hedge did not pay off enough to offset broader weakness."
        return "This round challenged the agent's thesis and risk posture."

    return "The round was largely flat, so no strong lesson stands out yet."


def _trim_round_summaries(
    memory: AgentMemory,
    limit: int = DEFAULT_SHORT_TERM_MEMORY_LIMIT,
) -> None:
    """
    Keep only the most recent detailed memory entries.
    """
    if len(memory.round_summaries) > limit:
        memory.round_summaries = memory.round_summaries[-limit:]


def _build_reflection_summary(
    participant: ParticipantState,
    reflection_window: int = DEFAULT_REFLECTION_WINDOW,
) -> str:
    """
    Build a compact reflection summary from the participant's recent memory.
    """
    recent = participant.memory.round_summaries[-reflection_window:]

    if not recent:
        return (
            f"{participant.display_name} has no round history yet. "
            f"It should act according to its base mandate: {participant.mandate}"
        )

    total_pnl = round(sum(item.pnl_delta for item in recent), 2)
    avg_confidence = round(
        sum(item.confidence for item in recent) / len(recent),
        2,
    )

    action_counts: Dict[str, int] = {}
    for item in recent:
        action_counts[item.action] = action_counts.get(item.action, 0) + 1

    dominant_action = max(action_counts, key=action_counts.get)

    last = recent[-1]
    direction = "positive" if total_pnl > 0 else "negative" if total_pnl < 0 else "mixed"

    return (
        f"{participant.display_name} has had {direction} recent performance over "
        f"the last {len(recent)} rounds with cumulative PnL of {total_pnl:.2f}. "
        f"Its most common recent action has been '{dominant_action}', and its "
        f"average confidence has been {avg_confidence:.2f}. "
        f"Most recent lesson: {last.lesson or 'No clear lesson recorded.'}"
    )


def _maybe_add_mistake(participant: ParticipantState, lesson: str, pnl_delta: float) -> None:
    """
    Add a lesson to mistakes_learned only when the round was meaningfully negative.
    """
    if pnl_delta >= 0:
        return

    if lesson not in participant.memory.mistakes_learned:
        participant.memory.mistakes_learned.append(lesson)

    participant.memory.mistakes_learned = participant.memory.mistakes_learned[-6:]


def append_round_memory(
    participant: ParticipantState,
    decision: AgentDecision,
    user_event: str,
    round_number: int,
    requested_weights: Dict[str, float],
    executed_weights: Dict[str, float],
    portfolio_value_before: float,
    portfolio_value_after: float,
    pnl_delta: float,
    short_term_limit: int = DEFAULT_SHORT_TERM_MEMORY_LIMIT,
    reflection_window: int = DEFAULT_REFLECTION_WINDOW,
) -> ParticipantState:
    """
    Append one new round memory entry to a participant and refresh summary fields.

    Semantic meaning:
    - portfolio_value_before = NAV before rebalance and pricing
    - portfolio_value_after = NAV after execution + mark-to-market
    """
    lesson = _infer_lesson(decision, pnl_delta)

    memory_entry = AgentRoundMemory(
        round_number=round_number,
        user_event=user_event,
        market_read=decision.market_read,
        thesis=decision.thesis,
        action=decision.action,
        confidence=decision.confidence,
        requested_weights=requested_weights,
        executed_weights=executed_weights,
        portfolio_value_before=portfolio_value_before,
        portfolio_value_after=portfolio_value_after,
        pnl_delta=pnl_delta,
        lesson=lesson,
    )

    participant.memory.round_summaries.append(memory_entry)
    _trim_round_summaries(participant.memory, limit=short_term_limit)
    _maybe_add_mistake(participant, lesson=lesson, pnl_delta=pnl_delta)

    participant.memory.reflection_summary = _build_reflection_summary(
        participant,
        reflection_window=reflection_window,
    )

    return participant


def refresh_reflection_summary(
    participant: ParticipantState,
    reflection_window: int = DEFAULT_REFLECTION_WINDOW,
) -> ParticipantState:
    """
    Recompute the reflection summary without appending a new round.
    """
    participant.memory.reflection_summary = _build_reflection_summary(
        participant,
        reflection_window=reflection_window,
    )
    return participant


def memory_context_dict(participant: ParticipantState) -> Dict:
    """
    Return a prompt-friendly memory payload for debugging or inspection.
    """
    return {
        "reflection_summary": participant.memory.reflection_summary,
        "persistent_beliefs": participant.memory.persistent_beliefs,
        "mistakes_learned": participant.memory.mistakes_learned,
        "recent_rounds": [
            _model_dump(item) for item in participant.memory.round_summaries
        ],
    }


def seed_participant_memory(
    participant: ParticipantState,
    beliefs: Optional[List[str]] = None,
    reflection_summary: Optional[str] = None,
) -> ParticipantState:
    """
    Initialize or overwrite a participant's memory fields.
    """
    if beliefs is not None:
        participant.memory.persistent_beliefs = beliefs

    if reflection_summary is not None:
        participant.memory.reflection_summary = reflection_summary

    return participant
