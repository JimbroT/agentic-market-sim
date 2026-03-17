"""
World-seeding node for the market simulation graph.

This node converts the parsed request and execution plan into an initial
simulation world state. The output is deterministic on purpose so the
next node can update it round by round in a predictable way.
"""

from typing import Dict, Optional

from src.state import SimState


def _build_world_variables(regime: str, policy_shift: Optional[str]) -> Dict[str, float]:
    """Create initial macro and market variables from the regime."""
    if regime == "risk_off":
        world = {
            "rates": 5.00,
            "inflation": 3.40,
            "growth": 1.20,
            "volatility": 0.75,
            "sentiment": -0.60,
        }
    elif regime == "risk_on":
        world = {
            "rates": 3.00,
            "inflation": 2.30,
            "growth": 2.80,
            "volatility": 0.25,
            "sentiment": 0.70,
        }
    else:
        world = {
            "rates": 4.00,
            "inflation": 2.70,
            "growth": 2.00,
            "volatility": 0.45,
            "sentiment": 0.00,
        }

    # Apply simple deterministic policy adjustments so later simulation
    # rounds start from a world state shaped by the user's prompt.
    if policy_shift:
        lowered = policy_shift.lower()

        if "raise interest rates" in lowered or "rate hike" in lowered:
            world["rates"] += 0.75
            world["growth"] -= 0.20
            world["volatility"] += 0.10
            world["sentiment"] -= 0.10

        if "cut rates" in lowered or "rate cut" in lowered:
            world["rates"] -= 0.50
            world["growth"] += 0.20
            world["sentiment"] += 0.10

        if "tariff" in lowered:
            world["inflation"] += 0.20
            world["growth"] -= 0.15
            world["volatility"] += 0.08

    return world


def _build_portfolio_template(participant_name: str) -> Dict[str, float]:
    """Assign a simple starting portfolio by participant archetype."""
    templates = {
        "macro_hedge_fund": {
            "cash": 20.0,
            "bonds": 25.0,
            "equities": 25.0,
            "commodities": 15.0,
            "volatility": 15.0,
        },
        "long_only_fund": {
            "cash": 10.0,
            "bonds": 20.0,
            "equities": 55.0,
            "commodities": 10.0,
            "volatility": 5.0,
        },
        "retail_traders": {
            "cash": 15.0,
            "bonds": 5.0,
            "equities": 65.0,
            "commodities": 5.0,
            "volatility": 10.0,
        },
        "market_makers": {
            "cash": 35.0,
            "bonds": 20.0,
            "equities": 20.0,
            "commodities": 10.0,
            "volatility": 15.0,
        },
        "rates_traders": {
            "cash": 20.0,
            "bonds": 50.0,
            "equities": 10.0,
            "commodities": 5.0,
            "volatility": 15.0,
        },
        "commodities_fund": {
            "cash": 10.0,
            "bonds": 10.0,
            "equities": 20.0,
            "commodities": 50.0,
            "volatility": 10.0,
        },
        "volatility_fund": {
            "cash": 15.0,
            "bonds": 10.0,
            "equities": 15.0,
            "commodities": 10.0,
            "volatility": 50.0,
        },
        "central_bank_watchers": {
            "cash": 25.0,
            "bonds": 40.0,
            "equities": 15.0,
            "commodities": 5.0,
            "volatility": 15.0,
        },
    }

    return templates.get(
        participant_name,
        {
            "cash": 20.0,
            "bonds": 20.0,
            "equities": 40.0,
            "commodities": 10.0,
            "volatility": 10.0,
        },
    )


def _starting_conviction(regime: str, participant_name: str) -> float:
    """Set an initial conviction level based on regime and style."""
    base = {
        "risk_on": 0.65,
        "risk_off": 0.75,
        "chop": 0.50,
    }.get(regime, 0.50)

    adjustments = {
        "macro_hedge_fund": 0.10,
        "volatility_fund": 0.10,
        "rates_traders": 0.05,
        "retail_traders": 0.00,
        "long_only_fund": -0.05,
        "market_makers": -0.10,
        "central_bank_watchers": 0.05,
        "commodities_fund": 0.05,
    }

    conviction = base + adjustments.get(participant_name, 0.0)
    return max(0.10, min(conviction, 0.95))


def _starting_risk_budget(participant_name: str) -> float:
    """Set a simple risk budget for each participant type."""
    budgets = {
        "macro_hedge_fund": 0.85,
        "long_only_fund": 0.55,
        "retail_traders": 0.80,
        "market_makers": 0.60,
        "rates_traders": 0.70,
        "commodities_fund": 0.75,
        "volatility_fund": 0.90,
        "central_bank_watchers": 0.50,
    }
    return budgets.get(participant_name, 0.60)


def _build_participant_state(
    participant_name: str,
    regime: str,
    event: str,
    policy_shift: Optional[str],
    geopolitical_context: Optional[str],
) -> Dict:
    """Create the initial participant state used by later simulation rounds."""
    memory = [
        {
            "type": "initial_brief",
            "event": event,
            "regime": regime,
            "policy_shift": policy_shift,
            "geopolitical_context": geopolitical_context,
        }
    ]

    return {
        "name": participant_name,
        "portfolio": _build_portfolio_template(participant_name),
        "conviction": _starting_conviction(regime, participant_name),
        "risk_budget": _starting_risk_budget(participant_name),
        "memory": memory,
        "latest_action": "initialized",
    }


def seed_world(state: SimState):
    """Seed the simulation world from the parsed request and plan."""
    plan = state["plan"]
    req = state["parsed_request"]

    event = req.get("event", "unknown event")
    regime = req.get("regime", "chop")
    horizon = req.get("horizon", "1d")
    policy_shift = req.get("policy_shift")
    geopolitical_context = req.get("geopolitical_context")

    world_variables = _build_world_variables(regime, policy_shift)

    participants = [
        _build_participant_state(
            participant_name=name,
            regime=regime,
            event=event,
            policy_shift=policy_shift,
            geopolitical_context=geopolitical_context,
        )
        for name in plan.get("participants", [])
    ]

    world_state = {
        "event": event,
        "regime": regime,
        "horizon": horizon,
        "timeline_mode": plan.get("timeline_mode", "daily"),
        "current_round": 0,
        "world_variables": world_variables,
        "participants": participants,
        "injected_variables": plan.get("injected_variables", {}),
    }

    return {
        "world_state": world_state,
        "current_step": "world_seeded",
    }
