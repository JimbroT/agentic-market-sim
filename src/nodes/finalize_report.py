"""
Report-finalization node for the market simulation graph.

This node converts the simulation outputs into a FinalReport-compatible
dictionary that can be shown directly in the UI or returned by the API.
"""

from typing import Dict, List

from src.state import SimState


def _build_executive_summary(
    parsed_request: Dict,
    world_state: Dict,
    participant_reactions: List[Dict],
) -> str:
    """Create a short executive summary from the simulation outcome."""
    event = parsed_request.get("event", "an event")
    regime = parsed_request.get("regime", "chop")
    horizon = parsed_request.get("horizon", "1d")

    latest_vol = world_state.get("world_variables", {}).get("volatility", 0.0)
    latest_sentiment = world_state.get("world_variables", {}).get("sentiment", 0.0)

    reaction_count = len(participant_reactions)

    return (
        f"The simulation modeled {event} across a {horizon} horizon in a "
        f"{regime} market regime. The final environment showed volatility at "
        f"{latest_vol:.2f} and sentiment at {latest_sentiment:.2f}, with "
        f"{reaction_count} total participant decisions recorded."
    )


def _build_risk_flags(world_state: Dict) -> List[str]:
    """Generate basic risk flags from the final world state."""
    variables = world_state.get("world_variables", {})
    risk_flags = []

    if variables.get("volatility", 0.0) >= 0.70:
        risk_flags.append("Volatility remains elevated.")

    if variables.get("sentiment", 0.0) <= -0.50:
        risk_flags.append("Investor sentiment is materially negative.")

    if variables.get("growth", 0.0) <= 1.00:
        risk_flags.append("Growth expectations have weakened.")

    if variables.get("rates", 0.0) >= 4.75:
        risk_flags.append("Rates remain restrictive for risk assets.")

    if not risk_flags:
        risk_flags.append("No major systemic risk flag dominated the final state.")

    return risk_flags


def _build_trade_implications(world_state: Dict, parsed_request: Dict) -> List[str]:
    """Translate the final state into simple trade implications."""
    variables = world_state.get("world_variables", {})
    regime = parsed_request.get("regime", "chop")

    implications = []

    if regime == "risk_off":
        implications.append("Defensive positioning favors bonds and volatility exposure.")
        implications.append("Equity risk should be sized carefully in a stressed regime.")
    elif regime == "risk_on":
        implications.append("Pro-risk positioning favors equities and cyclical exposure.")
        implications.append("Volatility-selling strategies may perform better in calmer conditions.")
    else:
        implications.append("Range-bound conditions favor selective positioning over broad risk-on bets.")
        implications.append("Tactical rebalancing may matter more than directional conviction.")

    if variables.get("rates", 0.0) >= 4.75:
        implications.append("Duration-sensitive assets may remain under pressure.")

    if variables.get("volatility", 0.0) >= 0.70:
        implications.append("Hedging demand is likely to stay elevated.")

    return implications


def _build_confidence(round_snapshots: List[Dict]) -> str:
    """Assign a simple confidence score based on simulation depth."""
    if len(round_snapshots) >= 5:
        return "high"
    if len(round_snapshots) >= 3:
        return "medium"
    return "low"


def finalize_report(state: SimState):
    """Assemble the final report from the completed simulation state."""
    parsed_request = state["parsed_request"]
    plan = state["plan"]
    world_state = state["world_state"]
    participant_reactions = state["participant_reactions"]
    round_snapshots = state["round_snapshots"]

    final_report = {
        "executive_summary": _build_executive_summary(
            parsed_request=parsed_request,
            world_state=world_state,
            participant_reactions=participant_reactions,
        ),
        "scenario_path": plan.get("scenario_path", []),
        "participant_reactions": participant_reactions,
        "risk_flags": _build_risk_flags(world_state),
        "trade_implications": _build_trade_implications(world_state, parsed_request),
        "confidence": _build_confidence(round_snapshots),
        "evidence_used": [
            f"Parsed event: {parsed_request.get('event', 'unknown')}",
            f"Regime: {parsed_request.get('regime', 'unknown')}",
            f"Rounds simulated: {len(round_snapshots)}",
            "Participant portfolio transitions and round snapshots",
        ],
        "metadata": {
            "timeline_mode": plan.get("timeline_mode"),
            "round_count": len(round_snapshots),
            "final_world_variables": world_state.get("world_variables", {}),
        },
    }

    return {
        "final_report": final_report,
        "current_step": "report_ready",
    }
