"""
src/api/main.py

FastAPI entrypoint for the agentic market simulation backend.

This file is responsible for:
1. Bootstrapping a brand-new simulation from a user-authored scenario prompt,
2. Advancing the simulation one round at a time from the frontend,
3. Returning frontend-friendly JSON payloads for world state, participants,
   round snapshots, and agent insights.

Why this file matters:
- It is the bridge between your React frontend and the Python simulation engine.
- It keeps API input/output shapes clean and explicit.
- It lets the frontend stay "dumb": the frontend sends prompt + round events,
  and this backend returns the full structured simulation state.

API design in this version:
- `GET /` returns a small development landing payload.
- `GET /health` returns a basic health check.
- `POST /simulate` initializes a new simulation with 8 default agents.
- `POST /simulate/step` runs exactly one new round using the current
  world state, current participants, and a user-authored event string.

Important design note:
- This file does not store simulation state on the server.
- The frontend is expected to hold onto `world_state` and `participants`
  and pass them back into `/simulate/step` each time.
- That keeps the API simple and works well for local development.

If you later want durable backend-side sessions, you can extend this file
to persist state by `simulation_id` in Redis, a database, or LangGraph
checkpoint storage.
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional
from uuid import uuid4

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from src.agents.personas import build_default_participants
from src.agents.schemas import ParticipantState, WorldState, WorldVariables
from src.nodes.simulate_round import run_single_round


app = FastAPI(
    title="Agentic Market Simulation API",
    description="Local-first multi-agent market simulation backend powered by Ollama + Python",
    version="0.2.1",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class SimulationInput(BaseModel):
    """
    Request body for creating a new simulation.
    """
    prompt: str = Field(
        ...,
        min_length=1,
        description="User-authored scenario prompt used to initialize the simulation.",
    )
    starting_nav: float = Field(
        default=100_000.0,
        gt=0,
        description="Starting portfolio NAV assigned to each default participant.",
    )
    model: Optional[str] = Field(
        default=None,
        description="Optional Ollama model override stored in the world state.",
    )


class StepInput(BaseModel):
    """
    Request body for advancing the simulation by exactly one round.
    """
    world_state: Dict[str, Any] = Field(
        ...,
        description="Current shared world state returned by /simulate or /simulate/step.",
    )
    participants: List[Dict[str, Any]] = Field(
        ...,
        description="Current participant list returned by /simulate or /simulate/step.",
    )
    user_event: str = Field(
        ...,
        min_length=1,
        description="User-authored event for the next simulation round.",
    )
    round_number: Optional[int] = Field(
        default=None,
        ge=1,
        description="Optional round number override. If omitted, backend uses current_round + 1.",
    )
    model: Optional[str] = Field(
        default=None,
        description="Optional Ollama model override for this round only.",
    )


def _model_dump(model_obj: Any) -> Dict[str, Any]:
    """
    Pydantic v1/v2 compatibility helper for serializing models to dicts.
    """
    if hasattr(model_obj, "model_dump"):
        return model_obj.model_dump()
    return model_obj.dict()


def _coerce_world_state(world_state: Any) -> WorldState:
    """
    Convert a raw dict-like payload into a typed WorldState.
    """
    if isinstance(world_state, WorldState):
        return world_state

    if hasattr(WorldState, "model_validate"):
        return WorldState.model_validate(world_state)

    return WorldState.parse_obj(world_state)


def _coerce_participants(participants: List[Any]) -> List[ParticipantState]:
    """
    Convert raw participant dicts into typed ParticipantState models.
    """
    output: List[ParticipantState] = []
    for participant in participants:
        if isinstance(participant, ParticipantState):
            output.append(participant)
        elif hasattr(ParticipantState, "model_validate"):
            output.append(ParticipantState.model_validate(participant))
        else:
            output.append(ParticipantState.parse_obj(participant))
    return output


def _build_initial_world(prompt: str, model: Optional[str] = None) -> WorldState:
    """
    Create the initial world state for a brand-new simulation.
    """
    return WorldState(
        simulation_id=str(uuid4()),
        scenario_prompt=prompt,
        scenario_summary=prompt,
        current_round=0,
        regime="neutral",
        world_variables=WorldVariables(
            rates=3.0,
            inflation=2.2,
            growth=2.0,
            volatility=0.25,
            sentiment=0.0,
        ),
        market_history=[],
        default_model=model,
    )


@app.get("/")
def root() -> Dict[str, str]:
    """
    Small landing payload for local development.
    """
    return {
        "message": "Agentic Market Simulation API",
        "docs": "/docs",
        "health": "/health",
        "initialize": "/simulate",
        "step": "/simulate/step",
    }


@app.get("/health")
def health() -> Dict[str, str]:
    """
    Basic health check endpoint.
    """
    return {"status": "ok"}


@app.post("/simulate")
def simulate(input_data: SimulationInput) -> Dict[str, Any]:
    """
    Initialize a new simulation.
    """
    try:
        world = _build_initial_world(input_data.prompt, model=input_data.model)
        participants = build_default_participants(starting_nav=input_data.starting_nav)

        return {
            "status": "success",
            "world_state": _model_dump(world),
            "participants": [_model_dump(p) for p in participants],
            "round_snapshots": [],
            "agent_insights": [],
            "events": [],
            "meta": {
                "simulation_id": world.simulation_id,
                "starting_nav": input_data.starting_nav,
                "model": world.default_model,
            },
        }
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to initialize simulation: {type(exc).__name__}: {exc}",
        )


@app.post("/simulate/step")
def simulate_step(input_data: StepInput) -> Dict[str, Any]:
    """
    Advance the simulation by exactly one round.
    """
    try:
        world = _coerce_world_state(input_data.world_state)
        participants = _coerce_participants(input_data.participants)

        next_round = input_data.round_number or (world.current_round + 1)
        active_model = input_data.model or world.default_model

        result = run_single_round(
            world_state=world,
            participants=participants,
            user_event=input_data.user_event,
            round_number=next_round,
            model=active_model,
        )

        return {
            "status": "success",
            "world_state": result["world_state"],
            "participants": result["participants"],
            "round_snapshot": result["round_snapshot"],
            "agent_insights": result["agent_insights"],
            "event": {
                "round": next_round,
                "user_event": input_data.user_event,
            },
        }
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to run simulation step: {type(exc).__name__}: {exc}",
        )
