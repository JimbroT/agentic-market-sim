"""
src/engine/portfolio_engine.py

Executes portfolio construction and rebalancing for one agent.

This file is responsible for:
1. Converting an agent's structured target weights into a complete asset map,
2. Enforcing simple backend-side portfolio constraints,
3. Normalizing the final target allocation,
4. Converting those target weights into dollar allocations using the agent's
   current portfolio NAV.

Why this file matters:
- The LLM should propose intent, not directly control accounting state.
- This file gives the backend final authority over what gets executed.
- It keeps portfolio math deterministic and debuggable.

Important design principle:
- The agent proposes `target_weights`.
- The backend validates and adjusts those weights.
- The backend executes the rebalance using current portfolio value.
"""

from __future__ import annotations

from typing import Dict, Tuple

from src.agents.schemas import AgentDecision, ParticipantState


# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

ASSET_ORDER = ["cash", "equities", "bonds", "commodities", "volatility"]


# ---------------------------------------------------------------------------
# Generic helpers
# ---------------------------------------------------------------------------

def _clamp(value: float, lower: float, upper: float) -> float:
    """Clamp a numeric value into an inclusive range."""
    return max(lower, min(value, upper))


def _portfolio_total(portfolio: Dict[str, float]) -> float:
    """Return the total dollar value of a portfolio."""
    return round(sum(portfolio.values()), 2)


def _zero_weight_map() -> Dict[str, float]:
    """Return a zeroed weight map for the supported asset universe."""
    return {asset: 0.0 for asset in ASSET_ORDER}


def _normalize_weight_map(weights: Dict[str, float]) -> Dict[str, float]:
    """
    Normalize a weight map so the values sum to 1.0.

    If the incoming weights sum to zero or less, we fall back to 100% cash
    to avoid invalid portfolio construction.
    """
    cleaned = {asset: max(0.0, float(weights.get(asset, 0.0))) for asset in ASSET_ORDER}
    total = sum(cleaned.values())

    if total <= 0:
        return {
            "cash": 1.0,
            "equities": 0.0,
            "bonds": 0.0,
            "commodities": 0.0,
            "volatility": 0.0,
        }

    return {
        asset: round(cleaned[asset] / total, 6)
        for asset in ASSET_ORDER
    }


def _current_weight_map(participant: ParticipantState) -> Dict[str, float]:
    """
    Return the participant's current portfolio weights in canonical asset order.
    """
    current = participant.current_weights()
    return {asset: float(current.get(asset, 0.0)) for asset in ASSET_ORDER}


# ---------------------------------------------------------------------------
# Weight construction
# ---------------------------------------------------------------------------

def decision_to_requested_weights(
    decision: AgentDecision,
    participant: ParticipantState,
) -> Dict[str, float]:
    """
    Convert an AgentDecision into a complete requested weight map.

    Any missing asset sleeves are filled from the participant's current weights,
    because some models may only specify the sleeves they want to change.
    """
    requested_from_model = decision.target_weight_map()
    current = _current_weight_map(participant)

    merged: Dict[str, float] = {}
    for asset in ASSET_ORDER:
        if asset in requested_from_model:
            merged[asset] = float(requested_from_model[asset])
        else:
            merged[asset] = float(current.get(asset, 0.0))

    return _normalize_weight_map(merged)


# ---------------------------------------------------------------------------
# Backend risk / execution rules
# ---------------------------------------------------------------------------

def apply_backend_constraints(
    requested_weights: Dict[str, float],
    participant: ParticipantState,
) -> Dict[str, float]:
    """
    Apply simple backend-side portfolio constraints.

    These are intentionally lightweight, because the goal is not to fully
    override the LLM, but to keep outputs plausible and safe.

    Rules in this starter version:
    - Minimum cash increases for lower-risk agents.
    - Maximum volatility sleeve depends on risk budget.
    - Very low-risk agents cannot go all-in on equities or commodities.
    """
    adjusted = dict(requested_weights)

    risk_budget = participant.risk_budget

    # Lower-risk agents should preserve more cash.
    min_cash = round(0.05 + (1.0 - risk_budget) * 0.20, 4)

    # More aggressive agents are allowed a larger volatility sleeve.
    max_volatility = round(0.10 + risk_budget * 0.30, 4)

    # Conservative agents should not overconcentrate in high-beta sleeves.
    max_equities = 0.75 if risk_budget >= 0.70 else 0.60
    max_commodities = 0.60 if risk_budget >= 0.70 else 0.35

    adjusted["volatility"] = min(adjusted.get("volatility", 0.0), max_volatility)
    adjusted["equities"] = min(adjusted.get("equities", 0.0), max_equities)
    adjusted["commodities"] = min(adjusted.get("commodities", 0.0), max_commodities)

    # Normalize once after capping aggressive sleeves.
    adjusted = _normalize_weight_map(adjusted)

    # Enforce minimum cash by reducing the largest non-cash sleeves first.
    cash_weight = adjusted.get("cash", 0.0)
    if cash_weight < min_cash:
        deficit = min_cash - cash_weight
        adjusted["cash"] = min_cash

        # Take the cash deficit from non-cash sleeves in descending order.
        non_cash_assets = sorted(
            [asset for asset in ASSET_ORDER if asset != "cash"],
            key=lambda asset: adjusted.get(asset, 0.0),
            reverse=True,
        )

        remaining_deficit = deficit
        for asset in non_cash_assets:
            if remaining_deficit <= 0:
                break

            removable = min(adjusted[asset], remaining_deficit)
            adjusted[asset] -= removable
            remaining_deficit -= removable

    return _normalize_weight_map(adjusted)


# ---------------------------------------------------------------------------
# Rebalance execution
# ---------------------------------------------------------------------------

def weights_to_dollar_allocations(
    weights: Dict[str, float],
    portfolio_value: float,
) -> Dict[str, float]:
    """
    Convert normalized portfolio weights into dollar allocations.
    """
    allocations = {
        asset: round(weights.get(asset, 0.0) * portfolio_value, 2)
        for asset in ASSET_ORDER
    }

    # Small rounding differences can appear, so push the remainder into cash.
    allocated_total = round(sum(allocations.values()), 2)
    rounding_diff = round(portfolio_value - allocated_total, 2)
    allocations["cash"] = round(allocations["cash"] + rounding_diff, 2)

    return allocations


def compute_trade_deltas(
    portfolio_before: Dict[str, float],
    portfolio_after: Dict[str, float],
) -> Dict[str, float]:
    """
    Compute dollar changes per asset sleeve caused by the rebalance.
    """
    return {
        asset: round(portfolio_after.get(asset, 0.0) - portfolio_before.get(asset, 0.0), 2)
        for asset in ASSET_ORDER
    }


def execute_rebalance(
    participant: ParticipantState,
    decision: AgentDecision,
) -> Dict[str, Dict[str, float] | float]:
    """
    Execute a single rebalance for one participant.

    Steps:
    1. Build requested weights from the LLM decision,
    2. Apply backend constraints,
    3. Convert the executed weights into new dollar allocations,
    4. Compute trade deltas for debugging / UI display.

    Returns a dictionary with all intermediate and final data needed by the
    simulation node.
    """
    portfolio_before = {
        asset: round(participant.portfolio.get(asset, 0.0), 2)
        for asset in ASSET_ORDER
    }
    portfolio_value_before = _portfolio_total(portfolio_before)

    requested_weights = decision_to_requested_weights(decision, participant)
    executed_weights = apply_backend_constraints(requested_weights, participant)

    portfolio_after = weights_to_dollar_allocations(
        executed_weights,
        portfolio_value_before,
    )
    trade_deltas = compute_trade_deltas(portfolio_before, portfolio_after)

    return {
        "requested_weights": requested_weights,
        "executed_weights": executed_weights,
        "portfolio_before": portfolio_before,
        "portfolio_after": portfolio_after,
        "trade_deltas": trade_deltas,
        "portfolio_value_before": portfolio_value_before,
    }
