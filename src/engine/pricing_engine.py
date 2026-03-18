"""
src/engine/pricing_engine.py

Marks a rebalanced portfolio to market using the shared world state.

This file is responsible for:
1. Translating macro world variables into simple per-asset round returns,
2. Applying those returns to a participant's executed portfolio,
3. Producing deterministic PnL outputs for the round.

Why this file matters:
- The LLM should not calculate PnL directly.
- The same market environment should price every participant consistently.
- It gives the simulation a stable accounting layer that is easy to tune.

Important design principle:
- Agentic behavior comes from the decisions.
- Fairness and consistency come from shared deterministic pricing.
"""

from __future__ import annotations

from typing import Dict

from src.agents.schemas import WorldState


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


# ---------------------------------------------------------------------------
# Market return model
# ---------------------------------------------------------------------------

def compute_asset_returns(world: WorldState) -> Dict[str, float]:
    """
    Convert world variables into one-round asset returns.

    This is a simple, interpretable starter model, not a realistic market model.

    Interpretation:
    - Equities like stronger growth and positive sentiment, but dislike high rates
      and high volatility.
    - Bonds tend to dislike higher rates, but can benefit from risk aversion.
    - Commodities like inflation and growth, and sometimes benefit from volatility.
    - Volatility exposure benefits when market stress rises.
    - Cash gets a small positive carry.

    Returns are per-round decimal returns, e.g. 0.02 means +2%.
    """
    vars = world.world_variables

    rates = float(vars.rates)
    inflation = float(vars.inflation)
    growth = float(vars.growth)
    volatility = float(vars.volatility)
    sentiment = float(vars.sentiment)

    # Cash earns a small steady carry.
    cash_return = 0.001

    # Equities respond positively to growth and sentiment, negatively to stress.
    equity_return = (
        0.010 * growth
        + 0.018 * sentiment
        - 0.020 * volatility
        - 0.006 * max(rates - 3.0, 0.0)
    )

    # Bonds suffer when rates are high / rising, but get support in softer growth
    # and risk-off conditions.
    bond_return = (
        -0.012 * max(rates - 3.0, 0.0)
        + 0.006 * max(2.0 - growth, 0.0)
        + 0.008 * max(-sentiment, 0.0)
        - 0.002 * max(inflation - 3.0, 0.0)
    )

    # Commodities generally like inflation and real-economy demand, and may
    # pick up some support in volatile supply-shock regimes.
    commodities_return = (
        0.008 * inflation
        + 0.006 * growth
        + 0.004 * volatility
        - 0.003 * max(-sentiment, 0.0)
    )

    # Explicit volatility exposure benefits from stress and negative sentiment,
    # but loses value in calmer, bullish conditions.
    volatility_return = (
        0.040 * volatility
        + 0.030 * max(-sentiment, 0.0)
        - 0.015 * max(sentiment, 0.0)
    )

    returns = {
        "cash": _clamp(cash_return, -0.02, 0.03),
        "equities": _clamp(equity_return, -0.35, 0.35),
        "bonds": _clamp(bond_return, -0.20, 0.20),
        "commodities": _clamp(commodities_return, -0.25, 0.25),
        "volatility": _clamp(volatility_return, -0.40, 0.50),
    }

    return {asset: round(ret, 6) for asset, ret in returns.items()}


# ---------------------------------------------------------------------------
# Mark-to-market
# ---------------------------------------------------------------------------

def mark_to_market(
    portfolio: Dict[str, float],
    world: WorldState,
) -> Dict[str, Dict[str, float] | float]:
    """
    Apply one round of market returns to a portfolio.

    Returns:
    - asset_returns: the per-asset return map used for pricing,
    - portfolio_before_pricing: the incoming executed portfolio,
    - portfolio_after_pricing: the marked portfolio,
    - portfolio_value_before: NAV before pricing,
    - portfolio_value_after: NAV after pricing,
    - pnl_delta: dollar PnL,
    - pnl_pct: percentage PnL.
    """
    portfolio_before = {
        asset: round(portfolio.get(asset, 0.0), 2)
        for asset in ASSET_ORDER
    }
    portfolio_value_before = _portfolio_total(portfolio_before)

    asset_returns = compute_asset_returns(world)

    portfolio_after = {
        asset: round(
            portfolio_before.get(asset, 0.0) * (1.0 + asset_returns.get(asset, 0.0)),
            2,
        )
        for asset in ASSET_ORDER
    }

    portfolio_value_after = _portfolio_total(portfolio_after)
    pnl_delta = round(portfolio_value_after - portfolio_value_before, 2)
    pnl_pct = round(
        pnl_delta / portfolio_value_before,
        6,
    ) if portfolio_value_before > 0 else 0.0

    return {
        "asset_returns": asset_returns,
        "portfolio_before_pricing": portfolio_before,
        "portfolio_after_pricing": portfolio_after,
        "portfolio_value_before": portfolio_value_before,
        "portfolio_value_after": portfolio_value_after,
        "pnl_delta": pnl_delta,
        "pnl_pct": pnl_pct,
    }
