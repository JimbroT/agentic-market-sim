"""
Helper utilities for turning simulation state into UI-friendly
agent insight records and round-value series for the frontend.
"""

from typing import Any, Dict, List


def _participant_id_from_name(name: str) -> str:
    """
    Map backend participant names to frontend entity ids.

    Keep this in sync with `demoEntities` / production entity ids.
    """
    mapping = {
        "macro_hedge_fund": "macro-hf",
        "long_only_fund": "long-only",
        "volatility_fund": "vol-fund",
        "commodities_fund": "alpha-cap",
        "rates_traders": "delta-sys",
        "market_makers": "quant-lab",
        "retail_traders": "signal-x",
        "central_bank_watchers": "deep-value",
    }
    return mapping.get(name, name)


def _make_pov_thought(
    action: str,
    rationale: str,
    shock_summary: str,
    round_number: int,
) -> str:
    """
    Turn an action + rationale into a short first-person thought.

    This is intentionally lightweight and deterministic; it can be
    made more stylistic later if needed.
    """
    action_readable = action.replace("_", " ")

    return (
        f"In round {round_number}, I'm choosing to {action_readable}. "
        f"{rationale} "
        f"The environment still looks like: {shock_summary}"
    )


def build_agent_insights(state: Dict[str, Any]) -> List[Dict[str, Any]]:
    """
    Build per-agent, per-round insight records from the simulation state.

    Each insight is a UI-ready object that can be filtered by participant id
    and round number on the frontend.
    """
    world_state = state.get("world_state", {})
    participants = world_state.get("participants", [])
    insights: List[Dict[str, Any]] = []

    for participant in participants:
        name = participant.get("name")
        participant_id = _participant_id_from_name(name)
        memory = participant.get("memory", [])

        for entry in memory:
            if "round" not in entry:
                continue

            round_number = entry["round"]
            shock_summary = entry.get("shock_summary", "")
            action = entry.get("action", "hold")
            rationale = entry.get("rationale", "")

            portfolio_total_after = entry.get("portfolio_total_after")
            pnl_delta = entry.get("pnl_delta")

            thought = _make_pov_thought(
                action=action,
                rationale=rationale,
                shock_summary=shock_summary,
                round_number=round_number,
            )

            insights.append(
                {
                    "participant_id": participant_id,
                    "backend_name": name,
                    "round": round_number,
                    "action": action,
                    "rationale": rationale,
                    "shock_summary": shock_summary,
                    "portfolio_total_after": portfolio_total_after,
                    "pnl_delta": pnl_delta,
                    "thought": thought,
                }
            )

    insights.sort(key=lambda row: (row["participant_id"], row["round"]))
    return insights


def build_round_series(state: Dict[str, Any]) -> List[Dict[str, Any]]:
    """
    Build per-participant round-value series from the simulation state.

    Uses participant memory entries with `portfolio_total_after` to produce
    one series per agent that the frontend can use as `roundValues`.
    """
    world_state = state.get("world_state", {})
    participants = world_state.get("participants", [])
    series: List[Dict[str, Any]] = []

    for participant in participants:
        name = participant.get("name")
        participant_id = _participant_id_from_name(name)
        memory = participant.get("memory", [])

        round_values: List[float] = []
        # Round entries are already chronological (1..N)
        for entry in memory:
            if "round" not in entry:
                continue
            total = entry.get("portfolio_total_after")
            if total is None:
                continue
            round_values.append(float(total))

        if not round_values:
            continue

        series.append(
            {
                "participant_id": participant_id,
                "backend_name": name,
                "round_values": round_values,
            }
        )

    return series
