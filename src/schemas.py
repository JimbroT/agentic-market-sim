"""
Pydantic schemas for validating simulation inputs and outputs.

These models serve two roles:
- Runtime validation (API requests, LLM outputs) to keep downstream nodes safe.
- A JSON schema source for constraining the prompt-parsing model output.

The models are intentionally strict (`extra="forbid"`) so unexpected fields are
caught early and surfaced as validation errors.
"""

from typing import Any, Dict, List, Literal, Optional

from pydantic import BaseModel, Field, ConfigDict, field_validator


class StrictModel(BaseModel):
    model_config = ConfigDict(extra="forbid")


class UserPrompt(StrictModel):
    prompt: str = Field(
        ...,
        min_length=1,
        description="Raw natural-language simulation request from the user",
    )

    @field_validator("prompt", mode="before")
    @classmethod
    def strip_prompt(cls, v):
        if isinstance(v, str):
            return v.strip()
        return v


class SimulationRequest(StrictModel):
    event: str = Field(
        ...,
        min_length=3,
        description="Primary market-moving event to simulate",
    )
    regime: Literal["risk_on", "risk_off", "chop"] = Field(
        ...,
        description="Current market regime",
    )
    horizon: Literal["intraday", "1d", "1w"] = Field(
        ...,
        description="Time horizon for the simulation",
    )
    objective: str = Field(
        ...,
        min_length=3,
        description="Goal of the simulation run",
    )
    policy_shift: Optional[str] = Field(
        default=None,
        description="Optional macro or policy change",
    )
    geopolitical_context: Optional[str] = Field(
        default=None,
        description="Optional geopolitical background",
    )

    @field_validator("event", "objective", mode="before")
    @classmethod
    def strip_required_text(cls, v):
        if isinstance(v, str):
            return v.strip()
        return v

    @field_validator("policy_shift", "geopolitical_context", mode="before")
    @classmethod
    def normalize_optional_text(cls, v):
        if isinstance(v, str):
            v = v.strip()
            return v or None
        return v


class ParticipantReaction(StrictModel):
    participant: str = Field(..., min_length=1)
    reaction: str = Field(..., min_length=1)
    rationale: str = Field(..., min_length=1)

    @field_validator("participant", "reaction", "rationale", mode="before")
    @classmethod
    def strip_reaction_fields(cls, v):
        if isinstance(v, str):
            return v.strip()
        return v


class FinalReport(StrictModel):
    executive_summary: str = Field(..., min_length=1)
    scenario_path: List[str] = Field(default_factory=list)
    participant_reactions: List[ParticipantReaction] = Field(default_factory=list)
    risk_flags: List[str] = Field(default_factory=list)
    trade_implications: List[str] = Field(default_factory=list)
    confidence: Literal["low", "medium", "high"] = Field(
        ...,
        description="Confidence level in the final report",
    )
    evidence_used: List[str] = Field(default_factory=list)
    metadata: Dict[str, Any] = Field(default_factory=dict)

    @field_validator("executive_summary", mode="before")
    @classmethod
    def strip_summary(cls, v):
        if isinstance(v, str):
            return v.strip()
        return v
 