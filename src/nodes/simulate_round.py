"""
Simulation node for the market simulation graph.

This node advances the seeded world through a fixed number of rounds.
The current version stays deterministic so the simulation remains easy
to debug while still producing UI-friendly metrics for a dashboard.
"""

from copy import deepcopy
from typing import Dict, List, Tuple

from src.state import SimState


def _clamp(value: float, lower: float, upper: float) -> float:
    """Keep a numeric value inside a bounded range."""
    return max(lower, min(value, upper))


def _portfolio_total(portfolio: Dict[str, float]) -> float:
    """Compute total portfolio weight/value proxy."""
    return round(sum(portfolio.values()), 2)


def _portfolio_mix(portfolio: Dict[str, float]) -> Dict[str, float]:
    """Return normalized asset weights for easier frontend display."""
    total = _portfolio_total(portfolio)
    if total == 0:
        return {asset: 0.0 for asset in portfolio}

    return {
        asset: round(value / total, 4)
        for asset, value in portfolio.items()
    }


def _round_shock_summary(world_state: Dict, round_number: int) -> str:
    """Create a short description of the current market environment."""
    event = world_state.get("event", "unknown event")
    regime = world_state.get("regime", "chop")
    variables = world_state.get("world_variables", {})

    return (
        f"Round {round_number}: {event} continues under a {regime} regime. "
        f"Rates={variables.get('rates', 0):.2f}, "
        f"growth={variables.get('growth', 0):.2f}, "
        f"volatility={variables.get('volatility', 0):.2f}, "
        f"sentiment={variables.get('sentiment', 0):.2f}."
    )


def _update_world_variables(world_variables: Dict[str, float], regime: str) -> Dict[str, float]:
    """Apply a small deterministic drift to the macro backdrop."""
    updated = deepcopy(world_variables)

    if regime == "risk_off":
        updated["volatility"] = _clamp(updated["volatility"] + 0.03, 0.0, 1.5)
        updated["sentiment"] = _clamp(updated["sentiment"] - 0.05, -1.0, 1.0)
        updated["growth"] = _clamp(updated["growth"] - 0.05, -5.0, 6.0)
        updated["rates"] = _clamp(updated["rates"] + 0.02, 0.0, 10.0)
    elif regime == "risk_on":
        updated["volatility"] = _clamp(updated["volatility"] - 0.02, 0.0, 1.5)
        updated["sentiment"] = _clamp(updated["sentiment"] + 0.05, -1.0, 1.0)
        updated["growth"] = _clamp(updated["growth"] + 0.05, -5.0, 6.0)
        updated["rates"] = _clamp(updated["rates"] - 0.01, 0.0, 10.0)
    else:
        updated["volatility"] = _clamp(updated["volatility"] + 0.01, 0.0, 1.5)
        updated["sentiment"] = _clamp(updated["sentiment"], -1.0, 1.0)
        updated["growth"] = _clamp(updated["growth"], -5.0, 6.0)
        updated["rates"] = _clamp(updated["rates"], 0.0, 10.0)

    return updated


def _decide_action(participant: Dict, world_variables: Dict[str, float], regime: str) -> Tuple[str, str]:
    """Generate a deterministic participant action and rationale."""
    name = participant["name"]
    volatility = world_variables["volatility"]
    sentiment = world_variables["sentiment"]
    rates = world_variables["rates"]

    if name == "macro_hedge_fund":
        if regime == "risk_off":
            return "rotate_to_defense", "Cuts equities and adds bonds plus volatility exposure."
        return "add_risk", "Adds equities and commodities on improving macro sentiment."

    if name == "long_only_fund":
        if sentiment < 0:
            return "de_risk_equities", "Reduces equity exposure and raises cash in weak sentiment."
        return "buy_equities", "Adds equities as long-term conviction stays constructive."

    if name == "retail_traders":
        if regime == "risk_on":
            return "chase_momentum", "Adds equities into positive sentiment and lower volatility."
        return "panic_reduce", "Cuts risky exposure as volatility stays elevated."

    if name == "market_makers":
        if volatility > 0.60:
            return "widen_spreads", "Raises defensive inventory posture in a volatile tape."
        return "provide_liquidity", "Keeps balanced inventory while volatility stays contained."

    if name == "rates_traders":
        if rates >= 4.5:
            return "buy_bonds", "Looks for rate stabilization after an aggressive tightening shock."
        return "reduce_duration", "Keeps duration lighter while rates remain uncertain."

    if name == "commodities_fund":
        if regime == "risk_off":
            return "trim_cyclicals_add_hard_assets", "Rotates toward defensive commodity exposure."
        return "add_commodities", "Adds commodity risk into stronger macro demand conditions."

    if name == "volatility_fund":
        if volatility >= 0.55:
            return "add_volatility", "Increases volatility exposure as stress remains elevated."
        return "harvest_premium", "Sells some volatility as conditions normalize."

    if name == "central_bank_watchers":
        if rates >= 4.5:
            return "prepare_policy_reversal", "Positions for slower growth and future policy softening."
        return "monitor_policy", "Waits for clearer policy direction before reallocating."

    return "hold", "Maintains current positioning."


def _apply_action_to_portfolio(portfolio: Dict[str, float], action: str) -> Dict[str, float]:
    """Apply a small deterministic rebalance."""
    updated = deepcopy(portfolio)

    shifts = {
        "rotate_to_defense": {"equities": -5.0, "bonds": 3.0, "volatility": 2.0},
        "add_risk": {"cash": -5.0, "equities": 3.0, "commodities": 2.0},
        "de_risk_equities": {"equities": -4.0, "cash": 2.0, "bonds": 2.0},
        "buy_equities": {"cash": -4.0, "equities": 4.0},
        "chase_momentum": {"cash": -5.0, "equities": 5.0},
        "panic_reduce": {"equities": -5.0, "cash": 3.0, "volatility": 2.0},
        "widen_spreads": {"equities": -2.0, "cash": 2.0},
        "provide_liquidity": {"cash": -2.0, "equities": 1.0, "bonds": 1.0},
        "buy_bonds": {"cash": -4.0, "bonds": 4.0},
        "reduce_duration": {"bonds": -4.0, "cash": 4.0},
        "trim_cyclicals_add_hard_assets": {"equities": -3.0, "commodities": 3.0},
        "add_commodities": {"cash": -3.0, "commodities": 3.0},
        "add_volatility": {"cash": -3.0, "volatility": 3.0},
        "harvest_premium": {"volatility": -3.0, "cash": 3.0},
        "prepare_policy_reversal": {"cash": -2.0, "bonds": 2.0},
        "monitor_policy": {"cash": 0.0},
        "hold": {"cash": 0.0},
    }

    for asset, change in shifts.get(action, {}).items():
        updated[asset] = round(updated.get(asset, 0.0) + change, 2)

    return updated


def _mark_to_market(
    portfolio: Dict[str, float],
    world_variables: Dict[str, float],
    regime: str,
) -> Dict[str, float]:
    """
    Apply a simple valuation pass so portfolio totals can move over time.

    These are not real asset-pricing equations; they are lightweight
    simulation heuristics for dashboard-friendly metrics.
    """
    updated = deepcopy(portfolio)

    sentiment = world_variables["sentiment"]
    volatility = world_variables["volatility"]
    growth = world_variables["growth"]
    rates = world_variables["rates"]

    equity_mult = 1 + (0.02 * sentiment) + (0.01 * growth) - (0.015 * volatility)
    bond_mult = 1 - (0.012 * max(rates - 3.0, 0)) + (0.005 if regime == "risk_off" else 0)
    commodities_mult = 1 + (0.008 * growth) + (0.004 * volatility)
    vol_mult = 1 + (0.03 * volatility) - (0.01 * max(sentiment, 0))
    cash_mult = 1.001

    updated["cash"] = round(updated["cash"] * cash_mult, 2)
    updated["bonds"] = round(updated["bonds"] * bond_mult, 2)
    updated["equities"] = round(updated["equities"] * equity_mult, 2)
    updated["commodities"] = round(updated["commodities"] * commodities_mult, 2)
    updated["volatility"] = round(updated["volatility"] * vol_mult, 2)

    return updated


def _participant_metric_row(
    participant_name: str,
    before_portfolio: Dict[str, float],
    after_portfolio: Dict[str, float],
    action: str,
) -> Dict:
    """Build a compact per-agent metric record for tables and charts."""
    before_total = _portfolio_total(before_portfolio)
    after_total = _portfolio_total(after_portfolio)
    pnl_delta = round(after_total - before_total, 2)
    pnl_pct = round((pnl_delta / before_total), 4) if before_total else 0.0

    return {
        "participant": participant_name,
        "action": action,
        "portfolio_total_before": before_total,
        "portfolio_total_after": after_total,
        "pnl_delta": pnl_delta,
        "pnl_pct": pnl_pct,
        "allocation_after": _portfolio_mix(after_portfolio),
    }


def _build_snapshot(
    round_number: int,
    shock_summary: str,
    world_state: Dict,
    action_log: List[Dict],
    participant_metrics: List[Dict],
) -> Dict:
    """Capture a replayable round snapshot for the dashboard."""
    return {
        "round": round_number,
        "shock_summary": shock_summary,
        "market_metrics": deepcopy(world_state["world_variables"]),
        "actions": deepcopy(action_log),
        "participant_metrics": deepcopy(participant_metrics),
        "participants": deepcopy(world_state["participants"]),
    }


def _build_leaderboard(participants: List[Dict]) -> List[Dict]:
    """Create a final sorted participant leaderboard by portfolio total."""
    rows = []
    for participant in participants:
        total = _portfolio_total(participant["portfolio"])
        rows.append(
            {
                "participant": participant["name"],
                "portfolio_total": total,
                "latest_action": participant["latest_action"],
            }
        )

    return sorted(rows, key=lambda row: row["portfolio_total"], reverse=True)


def simulate_round(state: SimState):
    """Run all configured simulation rounds and return updated state."""
    world_state = deepcopy(state["world_state"])
    plan = state["plan"]

    round_count = plan.get("round_count", 3)
    regime = world_state.get("regime", "chop")

    all_reactions: List[Dict] = []
    round_snapshots: List[Dict] = []
    market_history: List[Dict] = []

    for round_number in range(1, round_count + 1):
        world_state["current_round"] = round_number
        world_state["world_variables"] = _update_world_variables(
            world_state["world_variables"],
            regime,
        )

        shock_summary = _round_shock_summary(world_state, round_number)

        updated_participants = []
        action_log = []
        participant_metrics = []

        for participant in world_state["participants"]:
            participant_copy = deepcopy(participant)
            before_portfolio = deepcopy(participant_copy["portfolio"])

            action, rationale = _decide_action(
                participant_copy,
                world_state["world_variables"],
                regime,
            )

            participant_copy["latest_action"] = action
            participant_copy["portfolio"] = _apply_action_to_portfolio(
                participant_copy["portfolio"],
                action,
            )
            participant_copy["portfolio"] = _mark_to_market(
                participant_copy["portfolio"],
                world_state["world_variables"],
                regime,
            )

            metric_row = _participant_metric_row(
                participant_name=participant_copy["name"],
                before_portfolio=before_portfolio,
                after_portfolio=participant_copy["portfolio"],
                action=action,
            )

            participant_copy["memory"].append(
                {
                    "round": round_number,
                    "shock_summary": shock_summary,
                    "action": action,
                    "rationale": rationale,
                    "portfolio_total_after": metric_row["portfolio_total_after"],
                    "pnl_delta": metric_row["pnl_delta"],
                }
            )

            updated_participants.append(participant_copy)
            participant_metrics.append(metric_row)

            action_log.append(
                {
                    "participant": participant_copy["name"],
                    "action": action,
                    "rationale": rationale,
                }
            )

            all_reactions.append(
                {
                    "participant": participant_copy["name"],
                    "reaction": action,
                    "rationale": (
                        f"Round {round_number}: {rationale} "
                        f"Portfolio total moved by {metric_row['pnl_delta']:.2f}."
                    ),
                }
            )

        world_state["participants"] = updated_participants

        market_history.append(
            {
                "round": round_number,
                **deepcopy(world_state["world_variables"]),
            }
        )

        round_snapshots.append(
            _build_snapshot(
                round_number=round_number,
                shock_summary=shock_summary,
                world_state=world_state,
                action_log=action_log,
                participant_metrics=participant_metrics,
            )
        )

    leaderboard = _build_leaderboard(world_state["participants"])
    world_state["market_history"] = market_history
    world_state["leaderboard"] = leaderboard

    return {
        "world_state": world_state,
        "round_snapshots": round_snapshots,
        "participant_reactions": all_reactions,
        "current_step": "simulation_complete",
    }
