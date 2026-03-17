"""
FastAPI entrypoint for the market simulation backend.

This API wraps the LangGraph workflow and returns the full simulation
result as JSON so a frontend can render charts, tables, and reports.

Primary endpoints:
- `GET /health`: basic liveness check for local dev.
- `POST /simulate`: run the workflow and return the full state payload.

Assumptions:
- The frontend is served locally during development (CORS is permissive for
  localhost ports).
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from src.graph import graph
from src.api.insights import build_round_series

app = FastAPI(
    title="Agentic Market Simulation API",
    description="Local-first market simulation backend powered by LangGraph",
    version="0.1.0",
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
    prompt: str = Field(
        ...,
        min_length=1,
        description="Natural-language market simulation request",
    )


@app.get("/")
def root():
    """Provide a small landing response for local development."""
    return {
        "message": "Agentic Market Simulation API",
        "docs": "/docs",
        "health": "/health",
        "simulate": "/simulate",
    }


@app.get("/health")
def health():
    """Simple health-check endpoint."""
    return {"status": "ok"}


@app.post("/simulate")
def simulate(input_data: SimulationInput):
    """Run the LangGraph simulation workflow and return the full result."""
    try:
        initial_state = {
            "user_prompt": input_data.prompt,
            "parsed_request": {},
            "retrieved_scenarios": [],
            "retrieved_agents": [],
            "plan": {},
            "world_state": {},
            "round_snapshots": [],
            "tool_outputs": {},
            "participant_reactions": [],
            "agent_insights": [],
            "final_report": {},
            "evals": {},
            "current_step": "start",
            "errors": [],
        }

        result = graph.invoke(initial_state)

        round_series = build_round_series(result)

        agent_insights = result.get("agent_insights", [])

        return {
            "status": "success",
            "result": result,
            "world_state": result.get("world_state", {}),
            "round_snapshots": result.get("round_snapshots", []),
            "participant_reactions": result.get("participant_reactions", []),
            "final_report": result.get("final_report", {}),
            "agent_insights": [
                insight.model_dump() if hasattr(insight, "model_dump") else insight
                for insight in agent_insights
            ],
            "round_series": round_series,
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Simulation failed: {type(e).__name__}: {e}",
        )
