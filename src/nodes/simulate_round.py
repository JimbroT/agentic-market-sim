"""
Simulation node for the market simulation graph.

This node advances the seeded world through a fixed number of rounds.
The current version stays deterministic so the simulation remains easy
to debug while still producing UI-friendly metrics for a dashboard.
"""

from copy import deepcopy
from typing import Dict, List, Tuple

from src.state import SimState
from src.schemas import (
    AgentInsightOut,
    AgentProfileOut,
    AllocationBreakdown,
    MarketMetrics,
)


def _clamp(value: float, lower: float, upper: float) -> float:
    return max(lower, min(value, upper))


def _portfolio_total(portfolio: Dict[str, float]) -> float:
    return round(sum(portfolio.values()), 2)


def _portfolio_mix(portfolio: Dict[str, float]) -> Dict[str, float]:
    total = _portfolio_total(portfolio)
    if total == 0:
        return {asset: 0.0 for asset in portfolio}

    return {
        asset: round(value / total, 4)
        for asset, value in portfolio.items()
    }


def _round_shock_summary(world_state: Dict, round_number: int) -> str:
    event = world_state.get("event", "unknown event")
    regime = world_state.get("regime", "chop")
    variables = world_state.get("world_variables", {})

    return (
        f"Round {round_number}: {event} continues under a {regime} regime. "
        f"Rates={variables.get('rates', 0):.2f}, "
        f"inflation={variables.get('inflation', 0):.2f}, "
        f"growth={variables.get('growth', 0):.2f}, "
        f"volatility={variables.get('volatility', 0):.2f}, "
        f"sentiment={variables.get('sentiment', 0):.2f}."
    )


def _update_world_variables(world_variables: Dict[str, float], regime: str) -> Dict[str, float]:
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
    return {
        "round": round_number,
        "shock_summary": shock_summary,
        "market_metrics": deepcopy(world_state["world_variables"]),
        "actions": deepcopy(action_log),
        "participant_metrics": deepcopy(participant_metrics),
        "participants": deepcopy(world_state["participants"]),
    }


def _build_leaderboard(participants: List[Dict]) -> List[Dict]:
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


def _profile_style_summary(participant_name: str, allocation: Dict[str, float], risk_budget: float, conviction: float) -> str:
    tags: List[str] = []

    if allocation.get("volatility", 0.0) >= 0.20:
        tags.append("Volatility-sensitive")
    if allocation.get("bonds", 0.0) >= 0.35:
        tags.append("Rates / duration heavy")
    if allocation.get("equities", 0.0) >= 0.40:
        tags.append("Equity-beta exposed")
    if allocation.get("commodities", 0.0) >= 0.35:
        tags.append("Commodity heavy")
    if risk_budget >= 0.80:
        tags.append("High risk budget")
    if conviction >= 0.80:
        tags.append("High conviction")

    if participant_name == "market_makers":
        tags.append("Liquidity-oriented")
    elif participant_name == "central_bank_watchers":
        tags.append("Policy-sensitive")
    elif participant_name == "macro_hedge_fund":
        tags.append("Cross-asset macro")

    return " · ".join(tags) if tags else "Balanced multi-asset posture"


def _derive_key_signals(
    participant_name: str,
    world_variables: Dict[str, float],
    allocation_after: Dict[str, float],
    action: str,
    regime: str,
) -> List[str]:
    signals: List[str] = []

    rates = world_variables.get("rates", 0.0)
    inflation = world_variables.get("inflation", 0.0)
    growth = world_variables.get("growth", 0.0)
    volatility = world_variables.get("volatility", 0.0)
    sentiment = world_variables.get("sentiment", 0.0)

    if rates >= 4.5:
        signals.append("Rates remain restrictive for risk assets.")
    if inflation >= 3.0:
        signals.append("Inflation is still elevated relative to a benign backdrop.")
    if growth <= 1.0:
        signals.append("Growth expectations are softening.")
    if volatility >= 0.75:
        signals.append("Volatility remains elevated across the tape.")
    if sentiment <= -0.50:
        signals.append("Investor sentiment is materially negative.")
    elif sentiment >= 0.50:
        signals.append("Risk appetite is improving.")

    if allocation_after.get("bonds", 0.0) >= 0.35:
        signals.append("Portfolio is leaning toward duration and defensive ballast.")
    if allocation_after.get("equities", 0.0) >= 0.40:
        signals.append("Portfolio still carries meaningful equity beta.")
    if allocation_after.get("commodities", 0.0) >= 0.35:
        signals.append("Hard-asset exposure is a primary portfolio driver.")
    if allocation_after.get("volatility", 0.0) >= 0.20:
        signals.append("Convex hedging exposure is materially higher than neutral.")

    special_by_action = {
        "rotate_to_defense": "Cross-asset rotation favors defense over cyclical upside.",
        "de_risk_equities": "Weak sentiment is overpowering long-horizon equity conviction.",
        "panic_reduce": "Retail flow is reacting to stress rather than adding risk.",
        "widen_spreads": "Liquidity provision is turning more defensive as conditions tighten.",
        "buy_bonds": "High yields are starting to look attractive on a tactical basis.",
        "trim_cyclicals_add_hard_assets": "Commodity exposure is favored over growth-sensitive assets.",
        "add_volatility": "Stress pricing supports explicit volatility exposure.",
        "prepare_policy_reversal": "Policy sensitivity is shifting toward a slower-growth narrative.",
        "harvest_premium": "Stabilizing conditions support monetizing expensive hedges.",
        "add_risk": "Improving macro tone supports selective risk-taking.",
        "buy_equities": "Long-duration equity conviction is reasserting itself.",
        "provide_liquidity": "Contained volatility supports steadier market making.",
    }

    if action in special_by_action:
        signals.append(special_by_action[action])

    if participant_name == "volatility_fund" and regime == "risk_off":
        signals.append("Risk-off conditions structurally support volatility demand.")

    return signals[:5]


def _derive_risks(
    participant_name: str,
    world_variables: Dict[str, float],
    allocation_after: Dict[str, float],
    action: str,
) -> List[str]:
    risks: List[str] = []

    rates = world_variables.get("rates", 0.0)
    growth = world_variables.get("growth", 0.0)
    volatility = world_variables.get("volatility", 0.0)
    sentiment = world_variables.get("sentiment", 0.0)

    if allocation_after.get("equities", 0.0) >= 0.35 and sentiment < 0:
        risks.append("Negative sentiment could continue to pressure equity-heavy positioning.")
    if allocation_after.get("bonds", 0.0) >= 0.45 and rates >= 4.5:
        risks.append("Duration exposure remains vulnerable if rates continue rising.")
    if allocation_after.get("commodities", 0.0) >= 0.45 and growth <= 1.0:
        risks.append("Commodity-heavy exposure could fade if demand expectations weaken further.")
    if allocation_after.get("volatility", 0.0) >= 0.25 and volatility < 0.60:
        risks.append("Volatility carry can decay quickly if stress normalizes.")
    if allocation_after.get("cash", 0.0) >= 0.30:
        risks.append("High cash levels may create opportunity cost if the market stabilizes.")

    if action in {"panic_reduce", "de_risk_equities", "rotate_to_defense"}:
        risks.append("A sharp risk rebound would leave this stance underexposed.")
    if action in {"buy_bonds", "prepare_policy_reversal"} and growth > 1.5:
        risks.append("A resilient economy could delay the expected policy turn.")
    if action == "widen_spreads":
        risks.append("Wider spreads can reduce participation if liquidity improves abruptly.")
    if participant_name == "market_makers" and volatility > 0.90:
        risks.append("Inventory management becomes harder in fast-moving markets.")

    deduped: List[str] = []
    for item in risks:
        if item not in deduped:
            deduped.append(item)

    return deduped[:4]


def _derive_rejected_alternatives(
    participant_name: str,
    action: str,
    regime: str,
) -> List[str]:
    defaults = {
        "rotate_to_defense": ["Hold equity beta", "Add cyclical risk"],
        "add_risk": ["Stay defensive", "Increase cash buffer"],
        "de_risk_equities": ["Average down in equities", "Rotate into cyclicals"],
        "buy_equities": ["Raise cash", "Add hedges instead"],
        "panic_reduce": ["Chase momentum", "Hold current risk"],
        "widen_spreads": ["Tighten spreads to win flow", "Increase directional inventory"],
        "provide_liquidity": ["De-risk inventory", "Widen spreads aggressively"],
        "buy_bonds": ["Reduce duration", "Stay in cash"],
        "reduce_duration": ["Extend duration", "Add rate-sensitive equities"],
        "trim_cyclicals_add_hard_assets": ["Add equity cyclicals", "Hold balanced mix"],
        "add_commodities": ["Add bonds", "Sit in cash"],
        "add_volatility": ["Harvest premium", "Rotate into equities"],
        "harvest_premium": ["Add convex hedges", "Hold full vol allocation"],
        "prepare_policy_reversal": ["Ignore policy shift", "Add cyclical beta"],
        "monitor_policy": ["Front-run rate cuts", "Increase directional duration"],
        "hold": ["Increase risk", "De-risk sharply"],
    }

    options = defaults.get(action, ["Increase risk", "Cut risk"])

    if participant_name == "retail_traders" and regime == "risk_off":
        options = ["Chase dip-buying", "Do nothing into stress"]
    elif participant_name == "volatility_fund" and action == "add_volatility":
        options = ["Harvest vol premium", "Rotate into bonds"]

    return options[:2]


def _expected_next_move(
    world_variables: Dict[str, float],
    action: str,
    allocation_after: Dict[str, float],
) -> str:
    volatility = world_variables.get("volatility", 0.0)
    sentiment = world_variables.get("sentiment", 0.0)
    rates = world_variables.get("rates", 0.0)

    if action in {"rotate_to_defense", "de_risk_equities", "panic_reduce"} and sentiment < -0.4:
        return "Likely to keep trimming risk if sentiment deteriorates further."
    if action == "buy_bonds" and rates >= 4.5:
        return "May extend duration further if yields stabilize."
    if action == "add_volatility" and volatility >= 0.8:
        return "Likely to keep adding hedges while stress pricing remains rich."
    if action == "trim_cyclicals_add_hard_assets" and allocation_after.get("commodities", 0.0) >= 0.50:
        return "May keep rotating toward hard assets if growth keeps softening."
    if action == "widen_spreads":
        return "Will likely normalize spreads only after volatility cools."
    if action == "prepare_policy_reversal":
        return "May add more duration if growth weakens and policy expectations soften."

    return "Likely to monitor conditions before making a larger follow-through move."


def _confidence_score(
    conviction: float,
    risk_budget: float,
    regime: str,
    action: str,
    world_variables: Dict[str, float],
) -> float:
    base = 0.55
    base += 0.20 * conviction

    if regime in {"risk_off", "risk_on"}:
        base += 0.08

    if action in {"hold", "monitor_policy"}:
        base -= 0.05

    if world_variables.get("volatility", 0.0) >= 1.0:
        base -= 0.04

    if risk_budget >= 0.8:
        base += 0.03

    return round(_clamp(base, 0.35, 0.95), 2)


def simulate_round(state: SimState):
    world_state = deepcopy(state["world_state"])
    plan = state["plan"]

    round_count = plan.get("round_count", 3)
    regime = world_state.get("regime", "chop")

    all_reactions: List[Dict] = []
    round_snapshots: List[Dict] = []
    market_history: List[Dict] = []
    agent_insights: List[AgentInsightOut] = []

    for round_number in range(1, round_count + 1):
        world_state["current_round"] = round_number
        world_state["world_variables"] = _update_world_variables(
            world_state["world_variables"],
            regime,
        )

        shock_summary = _round_shock_summary(world_state, round_number)

        updated_participants = []
        action_log: List[Dict] = []
        participant_metrics: List[Dict] = []

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

            allocation_after = metric_row["allocation_after"]
            conviction = participant_copy.get("conviction", 0.0)
            risk_budget = participant_copy.get("risk_budget", 0.0)

            style_summary = _profile_style_summary(
                participant_name=participant_copy["name"],
                allocation=allocation_after,
                risk_budget=risk_budget,
                conviction=conviction,
            )

            key_signals = _derive_key_signals(
                participant_name=participant_copy["name"],
                world_variables=world_state["world_variables"],
                allocation_after=allocation_after,
                action=action,
                regime=regime,
            )

            risks = _derive_risks(
                participant_name=participant_copy["name"],
                world_variables=world_state["world_variables"],
                allocation_after=allocation_after,
                action=action,
            )

            rejected_alternatives = _derive_rejected_alternatives(
                participant_name=participant_copy["name"],
                action=action,
                regime=regime,
            )

            expected_next_move = _expected_next_move(
                world_variables=world_state["world_variables"],
                action=action,
                allocation_after=allocation_after,
            )

            confidence = _confidence_score(
                conviction=conviction,
                risk_budget=risk_budget,
                regime=regime,
                action=action,
                world_variables=world_state["world_variables"],
            )

            profile = AgentProfileOut(
                participant_id=participant_copy["name"],
                name=participant_copy["name"],
                conviction=conviction,
                risk_budget=risk_budget,
                portfolio=AllocationBreakdown(**allocation_after),
                latest_action=participant_copy.get("latest_action"),
                style_summary=style_summary,
            )

            insight = AgentInsightOut(
                participant_id=participant_copy["name"],
                round=round_number,
                shock_summary=shock_summary,
                thought=rationale,
                thesis=(
                    f"{participant_copy['name']} is prioritizing {action} "
                    f"because the current regime remains {regime}."
                ),
                action=action,
                rationale=rationale,
                key_signals=key_signals,
                risks=risks,
                rejected_alternatives=rejected_alternatives,
                expected_next_move=expected_next_move,
                confidence=confidence,
                market_metrics=MarketMetrics(**world_state["world_variables"]),
                allocation_after=AllocationBreakdown(**allocation_after),
                portfolio_total_before=metric_row["portfolio_total_before"],
                portfolio_total_after=metric_row["portfolio_total_after"],
                pnl_delta=metric_row["pnl_delta"],
                profile=profile,
            )

            agent_insights.append(insight)

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
        "agent_insights": agent_insights,
        "current_step": "simulation_complete",
    }
