"""
src/nodes/simulate_round.py

Coordinates one full market round across all agents.

This file is responsible for:
1. Updating the shared world state for the new round,
2. Running each agent's LLM-backed decision process,
3. Executing the proposed portfolio rebalance in Python,
4. Marking each portfolio to market in Python,
5. Appending memory and producing a frontend-friendly round snapshot.

Why this file matters:
- It is the "conductor" of the simulation.
- It turns eight independent agents into one coherent round.
- It preserves the critical system boundary:
  the LLM chooses intent, but the backend owns execution and PnL.

Compatibility note:
- `run_single_round(...)` is the reusable step-based engine.
- `simulate_round(state: SimState)` preserves the older LangGraph-style
  multi-round node interface by internally looping over `run_single_round`.
"""

from __future__ import annotations

from copy import deepcopy
from typing import Any, Dict, List, Optional

from src.agents.memory import append_round_memory
from src.agents.personas import build_default_participants
from src.agents.run_agent import run_all_agent_decisions
from src.agents.schemas import (
    AgentRoundResult,
    ParticipantState,
    RoundSnapshot,
    WorldState,
    WorldVariables,
)
from src.engine.portfolio_engine import execute_rebalance
from src.engine.pricing_engine import mark_to_market
from src.state import SimState


ASSET_ORDER = ["cash", "equities", "bonds", "commodities", "volatility"]


def _model_validate(model_cls, data):
    """
    Compatibility helper for Pydantic v1/v2 style model validation.
    """
    if isinstance(data, model_cls):
        return data

    if hasattr(model_cls, "model_validate"):
        return model_cls.model_validate(data)

    return model_cls.parse_obj(data)


def _model_dump(model_obj):
    """
    Compatibility helper for Pydantic v1/v2 style model serialization.
    """
    if hasattr(model_obj, "model_dump"):
        return model_obj.model_dump()

    return model_obj.dict()


def _clamp(value: float, lower: float, upper: float) -> float:
    """Clamp a numeric value into an inclusive range."""
    return max(lower, min(value, upper))


def _coerce_world_state(world_state: Any, scenario_prompt: str = "") -> WorldState:
    """
    Convert an incoming dict-like world state into a typed WorldState model.
    """
    if world_state is None:
        return WorldState(
            scenario_prompt=scenario_prompt or "User-authored market scenario.",
            current_round=0,
            regime="neutral",
            world_variables=WorldVariables(),
            market_history=[],
            scenario_summary=scenario_prompt or None,
            default_model=None,
        )

    try:
        return _model_validate(WorldState, world_state)
    except Exception:
        raw = dict(world_state)
        return WorldState(
            scenario_prompt=raw.get("scenario_prompt") or scenario_prompt or "User-authored market scenario.",
            current_round=raw.get("current_round", 0),
            regime=raw.get("regime", "neutral"),
            world_variables=_model_validate(
                WorldVariables,
                raw.get("world_variables", {}),
            ),
            market_history=raw.get("market_history", []),
            scenario_summary=raw.get("scenario_summary"),
            simulation_id=raw.get("simulation_id"),
            default_model=raw.get("default_model"),
        )


def _coerce_participants(participants: Optional[List[Any]]) -> List[ParticipantState]:
    """
    Convert participant dicts into typed ParticipantState models.

    If no participants are supplied, seed the default eight personas.
    """
    if not participants:
        return build_default_participants()

    result: List[ParticipantState] = []
    for participant in participants:
        result.append(_model_validate(ParticipantState, participant))
    return result


def _apply_regime_drift(world: WorldState) -> WorldState:
    """
    Apply a small baseline drift to the world each round.
    """
    vars = deepcopy(world.world_variables)

    if world.regime == "risk_off":
        vars.volatility = _clamp(vars.volatility + 0.03, 0.0, 1.5)
        vars.sentiment = _clamp(vars.sentiment - 0.06, -1.0, 1.0)
        vars.growth = _clamp(vars.growth - 0.05, -5.0, 8.0)
    elif world.regime == "risk_on":
        vars.volatility = _clamp(vars.volatility - 0.02, 0.0, 1.5)
        vars.sentiment = _clamp(vars.sentiment + 0.05, -1.0, 1.0)
        vars.growth = _clamp(vars.growth + 0.05, -5.0, 8.0)
    elif world.regime == "crisis":
        vars.volatility = _clamp(vars.volatility + 0.05, 0.0, 1.5)
        vars.sentiment = _clamp(vars.sentiment - 0.08, -1.0, 1.0)
        vars.growth = _clamp(vars.growth - 0.10, -5.0, 8.0)

    world.world_variables = vars
    return world


def _apply_shared_market_event(world: WorldState, user_event: str) -> WorldState:
    """
    Apply a simple shared market shock from the user's event text.

    This updates the common world all agents react to and get priced on.
    """
    text = (user_event or "").lower().strip()
    vars = deepcopy(world.world_variables)

    if not text:
        world.world_variables = vars
        return world

    if any(k in text for k in ["bank failure", "bank run", "credit stress", "credit spreads widen", "liquidity crisis"]):
        vars.volatility = _clamp(vars.volatility + 0.12, 0.0, 1.5)
        vars.sentiment = _clamp(vars.sentiment - 0.18, -1.0, 1.0)
        vars.growth = _clamp(vars.growth - 0.20, -5.0, 8.0)

    if any(k in text for k in ["inflation surprise", "hot cpi", "oil spike", "energy shock", "commodity shock"]):
        vars.inflation = _clamp(vars.inflation + 0.20, -2.0, 15.0)
        vars.rates = _clamp(vars.rates + 0.10, 0.0, 12.0)
        vars.volatility = _clamp(vars.volatility + 0.04, 0.0, 1.5)

    if any(k in text for k in ["soft landing", "strong earnings", "ai boom", "productivity boom", "trade deal"]):
        vars.growth = _clamp(vars.growth + 0.18, -5.0, 8.0)
        vars.sentiment = _clamp(vars.sentiment + 0.12, -1.0, 1.0)
        vars.volatility = _clamp(vars.volatility - 0.03, 0.0, 1.5)

    if any(k in text for k in ["rate cut", "policy easing", "dovish fed", "stimulus"]):
        vars.rates = _clamp(vars.rates - 0.12, 0.0, 12.0)
        vars.sentiment = _clamp(vars.sentiment + 0.06, -1.0, 1.0)

    if any(k in text for k in ["rate hike", "tightening", "hawkish fed", "higher for longer"]):
        vars.rates = _clamp(vars.rates + 0.12, 0.0, 12.0)
        vars.sentiment = _clamp(vars.sentiment - 0.06, -1.0, 1.0)
        vars.growth = _clamp(vars.growth - 0.06, -5.0, 8.0)

    if any(k in text for k in ["war", "sanctions", "panic", "selloff", "flash crash", "geopolitical"]):
        vars.volatility = _clamp(vars.volatility + 0.10, 0.0, 1.5)
        vars.sentiment = _clamp(vars.sentiment - 0.12, -1.0, 1.0)

    world.world_variables = vars
    world.regime = _infer_regime(world)
    return world


def _infer_regime(world: WorldState) -> str:
    """
    Infer a coarse regime label from the shared world variables.
    """
    vars = world.world_variables

    if vars.volatility >= 0.80 or vars.sentiment <= -0.60:
        return "crisis"
    if vars.sentiment <= -0.25:
        return "risk_off"
    if vars.sentiment >= 0.25 and vars.growth >= 2.0:
        return "risk_on"
    if vars.inflation >= 3.5:
        return "inflationary"
    if vars.inflation <= 2.0 and vars.rates <= 3.0:
        return "disinflationary"
    return "neutral"


def _round_summary(
    round_number: int,
    user_event: str,
    world_after: WorldState,
    agent_results: List[AgentRoundResult],
) -> str:
    """
    Build a concise round summary for the frontend timeline.
    """
    top = sorted(agent_results, key=lambda item: item.pnl_delta, reverse=True)
    leader = top[0].display_name if top else "No leader"
    laggard = top[-1].display_name if top else "No laggard"

    return (
        f"Round {round_number} reacted to '{user_event}'. "
        f"The shared regime finished as {world_after.regime}. "
        f"Best performer: {leader}. Weakest performer: {laggard}."
    )


def run_single_round(
    world_state: Dict | WorldState,
    participants: List[Dict] | List[ParticipantState],
    user_event: str,
    round_number: int,
    model: Optional[str] = None,
) -> Dict:
    """
    Run exactly one simulation round.
    """
    world = _coerce_world_state(world_state)
    participant_models = _coerce_participants(participants)

    world_before = _model_validate(WorldState, _model_dump(world))

    world.current_round = round_number
    if model:
        world.default_model = model

    world = _apply_regime_drift(world)
    world = _apply_shared_market_event(world, user_event)

    decisions = run_all_agent_decisions(
        participants=participant_models,
        world=world,
        user_event=user_event,
        round_number=round_number,
        model=model or world.default_model,
    )

    updated_participants: List[ParticipantState] = []
    agent_results: List[AgentRoundResult] = []
    agent_insights: List[Dict] = []

    for participant in participant_models:
        decision = decisions[participant.agent_id]

        rebalance = execute_rebalance(
            participant=participant,
            decision=decision,
        )

        pricing = mark_to_market(
            portfolio=rebalance["portfolio_after"],
            world=world,
        )

        participant.portfolio = pricing["portfolio_after_pricing"]
        participant.latest_action = decision.action
        participant.latest_thesis = decision.thesis
        participant.latest_confidence = decision.confidence

        participant = append_round_memory(
            participant=participant,
            decision=decision,
            user_event=user_event,
            round_number=round_number,
            requested_weights=rebalance["requested_weights"],
            executed_weights=rebalance["executed_weights"],
            # Use the true pre-rebalance NAV for memory consistency.
            portfolio_value_before=rebalance["portfolio_value_before"],
            portfolio_value_after=pricing["portfolio_value_after"],
            pnl_delta=pricing["pnl_delta"],
        )

        round_result = AgentRoundResult(
            agent_id=participant.agent_id,
            display_name=participant.display_name,
            role=participant.role,
            decision=decision,
            requested_weights=rebalance["requested_weights"],
            executed_weights=rebalance["executed_weights"],
            portfolio_before=rebalance["portfolio_before"],
            portfolio_after=pricing["portfolio_after_pricing"],
            portfolio_value_before=rebalance["portfolio_value_before"],
            portfolio_value_after=pricing["portfolio_value_after"],
            pnl_delta=pricing["pnl_delta"],
            pnl_pct=pricing["pnl_pct"],
        )

        agent_results.append(round_result)
        updated_participants.append(participant)

        agent_insights.append(
            {
                "agent_id": participant.agent_id,
                "display_name": participant.display_name,
                "role": participant.role,
                "market_read": decision.market_read,
                "thought": decision.thought,
                "thesis": decision.thesis,
                "action": decision.action,
                "confidence": decision.confidence,
                "risk_flags": decision.risk_flags,
                "watch_items": decision.watch_items,
                "requested_weights": rebalance["requested_weights"],
                "executed_weights": rebalance["executed_weights"],
                "pnl_delta": pricing["pnl_delta"],
                "pnl_pct": pricing["pnl_pct"],
            }
        )

    world.market_history.append(
        {
            "round_number": round_number,
            "user_event": user_event,
            "regime": world.regime,
            "world_variables": _model_dump(world.world_variables),
        }
    )

    snapshot = RoundSnapshot(
        round_number=round_number,
        user_event=user_event,
        world_before=world_before.world_variables,
        world_after=world.world_variables,
        agent_results=agent_results,
        round_summary=_round_summary(
            round_number=round_number,
            user_event=user_event,
            world_after=world,
            agent_results=agent_results,
        ),
    )

    return {
        "status": "success",
        "world_state": _model_dump(world),
        "participants": [_model_dump(p) for p in updated_participants],
        "round_snapshot": _model_dump(snapshot),
        "agent_insights": agent_insights,
    }


def simulate_round(state: SimState) -> Dict:
    """
    Backward-compatible LangGraph node that still runs multiple rounds.
    """
    raw_world_state = state.get("world_state") if isinstance(state, dict) else None
    raw_plan = state.get("plan", {}) if isinstance(state, dict) else {}
    raw_participants = None

    if isinstance(raw_world_state, dict):
        raw_participants = raw_world_state.get("participants")

    scenario_prompt = ""
    if isinstance(raw_world_state, dict):
        scenario_prompt = raw_world_state.get("scenario_prompt", "") or raw_world_state.get("event", "")

    world = _coerce_world_state(raw_world_state, scenario_prompt=scenario_prompt)
    participants = _coerce_participants(raw_participants)

    round_count = raw_plan.get("round_count", 3)
    round_snapshots: List[Dict] = []
    agent_insights: List[Dict] = []

    for round_number in range(1, round_count + 1):
        synthetic_event = (
            f"Continue evolving the scenario: {world.scenario_prompt or scenario_prompt}. "
            f"This is round {round_number}."
        )

        result = run_single_round(
            world_state=world,
            participants=participants,
            user_event=synthetic_event,
            round_number=round_number,
            model=world.default_model,
        )

        world = _coerce_world_state(result["world_state"])
        participants = _coerce_participants(result["participants"])
        round_snapshots.append(result["round_snapshot"])
        agent_insights.extend(result["agent_insights"])

    final_world_dict = _model_dump(world)
    final_world_dict["participants"] = [_model_dump(p) for p in participants]

    return {
        "world_state": final_world_dict,
        "round_snapshots": round_snapshots,
        "participant_reactions": agent_insights,
        "agent_insights": agent_insights,
        "current_step": "simulation_complete",
    }
