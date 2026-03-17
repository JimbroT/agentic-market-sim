from graph import graph

initial_state = {
    "user_prompt": "Raise interest rates by 10% and keep geopolitics peaceful over the next day",
    "parsed_request": {},
    "retrieved_scenarios": [],
    "retrieved_agents": [],
    "plan": {},
    "world_state": {},
    "round_snapshots": [],
    "tool_outputs": {},
    "participant_reactions": [],
    "final_report": {},
    "evals": {},
    "current_step": "start",
    "errors": [],
}

result = graph.invoke(initial_state)

print(result["current_step"])
print(result["parsed_request"])
print(result["plan"])
print(result["participant_reactions"][:2])
print(result["final_report"]["executive_summary"])
print(result["errors"])
print(result["round_snapshots"][0]["market_metrics"])
print(result["round_snapshots"][0]["participant_metrics"][:2])
print(result["world_state"]["leaderboard"][:3])
print(result["world_state"]["market_history"])

