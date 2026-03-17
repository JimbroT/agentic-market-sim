"""
LangGraph workflow definition for the market simulation.

This module wires together the node functions in `src/nodes/` into a single
compiled `graph` object. The API layer (`src/api/main.py`) invokes this graph
with an initial `SimState` and returns the final state as JSON.

Design notes:
- The current workflow is a simple linear pipeline to keep the MVP debuggable.
- Each node should treat the incoming state as immutable input and return only
  the keys it intends to update.
"""

from langgraph.graph import END, START, StateGraph

from src.state import SimState
from src.nodes.parse_prompt import parse_prompt
from src.nodes.build_plan import build_plan
from src.nodes.seed_world import seed_world
from src.nodes.simulate_round import simulate_round
from src.nodes.finalize_report import finalize_report

builder = StateGraph(SimState)

# Register each workflow step as a graph node.
builder.add_node("parse_prompt", parse_prompt)
builder.add_node("build_plan", build_plan)
builder.add_node("seed_world", seed_world)
builder.add_node("simulate_round", simulate_round)
builder.add_node("finalize_report", finalize_report)

# Wire the graph as a simple sequential pipeline.
builder.add_edge(START, "parse_prompt")
builder.add_edge("parse_prompt", "build_plan")
builder.add_edge("build_plan", "seed_world")
builder.add_edge("seed_world", "simulate_round")
builder.add_edge("simulate_round", "finalize_report")
builder.add_edge("finalize_report", END)

graph = builder.compile()
