"""
Plan-building node for the market simulation graph.

This node converts the parsed simulation request into a lightweight
execution blueprint that downstream nodes can use to seed the world,
run rounds, and assemble a report.
"""

from src.state import SimState


# Fixed participant set for the MVP. We can later make this dynamic.
DEFAULT_PARTICIPANTS = [
    "macro_hedge_fund",
    "long_only_fund",
    "retail_traders",
    "market_makers",
    "rates_traders",
    "commodities_fund",
    "volatility_fund",
    "central_bank_watchers",
]


def build_plan(state: SimState):
    """Build a simulation plan from the parsed user request."""
    req = state["parsed_request"]

    event = req.get("event", "")
    regime = req.get("regime", "chop")
    horizon = req.get("horizon", "1d")
    objective = req.get("objective", "simulate market participant reactions")
    policy_shift = req.get("policy_shift")
    geopolitical_context = req.get("geopolitical_context")

    # Keep the first version simple: fewer rounds for shorter horizons,
    # slightly more rounds for week-long scenarios.
    if horizon == "intraday":
        round_count = 3
        timeline_mode = "short_term"
    elif horizon == "1w":
        round_count = 5
        timeline_mode = "swing"
    else:
        round_count = 3
        timeline_mode = "daily"

    # These are the controllable scenario inputs that later nodes will use
    # to seed world variables and guide participant behavior.
    injected_variables = {
        "event": event,
        "regime": regime,
        "policy_shift": policy_shift,
        "geopolitical_context": geopolitical_context,
    }

    # A lightweight scenario path gives the final report a structure and
    # helps keep downstream outputs coherent.
    scenario_path = [
        f"Shock begins: {event}",
        f"Market regime is classified as {regime}",
        f"Participants respond over horizon {horizon}",
        "Cross-asset positioning updates",
        "Risk flags and trade implications are summarized",
    ]

    plan = {
        "objective": objective,
        "timeline_mode": timeline_mode,
        "round_count": round_count,
        "scenario_path": scenario_path,
        "injected_variables": injected_variables,
        "participants": DEFAULT_PARTICIPANTS,
        "report_sections": [
            "executive_summary",
            "participant_reactions",
            "risk_flags",
            "trade_implications",
            "confidence",
        ],
    }

    return {
        "plan": plan,
        "current_step": "plan_built",
    }
