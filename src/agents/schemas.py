"""
src/agents/schemas.py

Defines the core data models for the multi-agent simulation system.

This file is the contract layer between:
1. The LLM decision-making layer (what each agent wants to do),
2. The simulation engine (how the backend executes and prices those decisions),
3. The API / frontend layer (what gets returned and displayed).

Why this file matters:
- It gives every agent a strict output schema.
- It keeps memory and portfolio state structured across rounds.
- It makes later validation much easier when integrating Ollama + LangGraph.

Note:
- This version is written for Pydantic v2 style usage.
- The models are intentionally explicit so each part of the system is easy to reason about.
"""

from __future__ import annotations

from typing import Dict, List, Literal, Optional

from pydantic import BaseModel, Field, model_validator


AssetName = Literal["cash", "equities", "bonds", "commodities", "volatility"]
AgentAction = Literal["hold", "rebalance", "de_risk", "add_risk", "hedge", "rotate"]
RegimeName = Literal[
    "risk_on",
    "risk_off",
    "neutral",
    "inflationary",
    "disinflationary",
    "crisis",
]


class WorldVariables(BaseModel):
    """
    Macro variables shared by all agents for a given round.
    """
    rates: float = Field(default=3.0, description="Policy / benchmark interest rate level.")
    inflation: float = Field(default=2.0, description="Inflation level or pressure indicator.")
    growth: float = Field(default=2.0, description="Growth / macro demand indicator.")
    volatility: float = Field(default=0.25, description="Market volatility regime indicator.")
    sentiment: float = Field(default=0.0, description="Risk sentiment from -1 to +1.")


class MarketEvent(BaseModel):
    """
    A user-authored event for a single round.
    """
    user_event: str = Field(..., min_length=1)
    round_number: int = Field(..., ge=1)


class WorldState(BaseModel):
    """
    Durable shared state for the simulation.
    """
    scenario_prompt: str = Field(..., description="Original user-authored scenario prompt.")
    current_round: int = Field(default=0, ge=0)
    regime: RegimeName = Field(default="neutral")
    world_variables: WorldVariables = Field(default_factory=WorldVariables)

    market_history: List[Dict] = Field(default_factory=list)

    scenario_summary: Optional[str] = None
    simulation_id: Optional[str] = None

    # Persist the preferred Ollama model so the frontend does not need to keep
    # resending it on every round if it wants a stable model choice.
    default_model: Optional[str] = None


class AgentRoundMemory(BaseModel):
    """
    Detailed memory entry for one agent in one round.
    """
    round_number: int = Field(..., ge=1)
    user_event: str
    market_read: str
    thesis: str
    action: AgentAction
    confidence: float = Field(..., ge=0.0, le=1.0)

    requested_weights: Dict[AssetName, float] = Field(default_factory=dict)
    executed_weights: Dict[AssetName, float] = Field(default_factory=dict)

    # Important semantic choice:
    # - before = portfolio NAV before rebalance and pricing
    # - after = portfolio NAV after execution + mark-to-market
    portfolio_value_before: float = Field(..., ge=0.0)
    portfolio_value_after: float = Field(..., ge=0.0)
    pnl_delta: float

    lesson: Optional[str] = None


class AgentMemory(BaseModel):
    """
    Memory container for one participant.
    """
    round_summaries: List[AgentRoundMemory] = Field(default_factory=list)
    reflection_summary: str = Field(
        default="No long-term reflections recorded yet."
    )
    persistent_beliefs: List[str] = Field(default_factory=list)
    mistakes_learned: List[str] = Field(default_factory=list)


class AgentPersonaConfig(BaseModel):
    """
    Static persona definition for an agent.
    """
    agent_id: str
    display_name: str
    role: str
    mandate: str
    style: str
    system_prompt: str
    risk_budget: float = Field(default=0.5, ge=0.0, le=1.0)
    default_beliefs: List[str] = Field(default_factory=list)
    default_watch_items: List[str] = Field(default_factory=list)


class ParticipantState(BaseModel):
    """
    Live state for one simulation participant.
    """
    agent_id: str
    display_name: str
    role: str
    mandate: str
    style: str

    risk_budget: float = Field(default=0.5, ge=0.0, le=1.0)

    # Dollar allocation per asset sleeve.
    portfolio: Dict[AssetName, float] = Field(default_factory=dict)

    memory: AgentMemory = Field(default_factory=AgentMemory)

    latest_action: Optional[AgentAction] = None
    latest_thesis: Optional[str] = None
    latest_confidence: Optional[float] = Field(default=None, ge=0.0, le=1.0)

    @property
    def portfolio_value(self) -> float:
        """Convenience helper for computing total portfolio value."""
        return round(sum(self.portfolio.values()), 2)

    def current_weights(self) -> Dict[AssetName, float]:
        """
        Return current portfolio weights derived from dollar allocations.
        """
        total = self.portfolio_value
        if total <= 0:
            return {
                "cash": 0.0,
                "equities": 0.0,
                "bonds": 0.0,
                "commodities": 0.0,
                "volatility": 0.0,
            }

        return {
            asset: round(value / total, 4)
            for asset, value in self.portfolio.items()
        }


class TargetWeight(BaseModel):
    """
    One target weight proposed by an agent.
    """
    asset: AssetName
    weight: float = Field(..., ge=0.0, le=1.0)
    reason: str = Field(..., min_length=1)


class AgentDecision(BaseModel):
    """
    Structured decision returned by the LLM for one round.
    """
    market_read: str = Field(..., min_length=1)
    thought: str = Field(..., min_length=1)
    thesis: str = Field(..., min_length=1)
    action: AgentAction
    confidence: float = Field(..., ge=0.0, le=1.0)

    risk_flags: List[str] = Field(default_factory=list)
    watch_items: List[str] = Field(default_factory=list)
    target_weights: List[TargetWeight] = Field(default_factory=list)

    @model_validator(mode="after")
    def validate_target_weights(self) -> "AgentDecision":
        """
        Basic structural validation.

        We intentionally do NOT force the weights to sum to 1 here because
        the backend portfolio engine will normalize and enforce constraints.
        """
        seen_assets = set()
        for item in self.target_weights:
            if item.asset in seen_assets:
                raise ValueError(f"Duplicate target weight for asset '{item.asset}'.")
            seen_assets.add(item.asset)
        return self

    def target_weight_map(self) -> Dict[AssetName, float]:
        """Convert the list form into a simple asset -> weight mapping."""
        return {item.asset: item.weight for item in self.target_weights}


class AgentRoundResult(BaseModel):
    """
    Backend-computed result for a single agent after execution and pricing.
    """
    agent_id: str
    display_name: str
    role: str

    decision: AgentDecision

    requested_weights: Dict[AssetName, float]
    executed_weights: Dict[AssetName, float]

    portfolio_before: Dict[AssetName, float]
    portfolio_after: Dict[AssetName, float]

    portfolio_value_before: float
    portfolio_value_after: float
    pnl_delta: float
    pnl_pct: float


class RoundSnapshot(BaseModel):
    """
    Full output for one simulation round.
    """
    round_number: int = Field(..., ge=1)
    user_event: str
    world_before: WorldVariables
    world_after: WorldVariables
    agent_results: List[AgentRoundResult] = Field(default_factory=list)
    round_summary: Optional[str] = None


class SimulationState(BaseModel):
    """
    Top-level simulation container used by the backend.
    """
    world: WorldState
    participants: List[ParticipantState] = Field(default_factory=list)
    round_snapshots: List[RoundSnapshot] = Field(default_factory=list)
