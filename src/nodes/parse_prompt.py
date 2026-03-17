"""
Prompt-parsing node for the market simulation graph.

This node takes the raw user prompt (`SimState.user_prompt`) and produces a
validated `SimulationRequest` dict under `SimState.parsed_request`.

Key behavior:
- Returns structured errors in `SimState.errors` instead of raising for
  expected failures (empty prompt, validation errors).
- Uses a JSON schema derived from `SimulationRequest` to constrain the model's
  output format.
"""

import json

from ollama import chat
from pydantic import ValidationError

from src.schemas import SimulationRequest
from src.state import SimState


SYSTEM_PROMPT = """
You are an expert parser for a market simulation system.

Convert the user's natural-language prompt into a valid SimulationRequest.

You must obey these exact allowed values:
- regime: risk_on | risk_off | chop
- horizon: intraday | 1d | 1w

Field rules:
- event: the main market-moving event or setup
- regime: classify the market setup into one allowed value
- horizon: map the user’s time reference into one allowed value
- objective: the user-stated purpose of the simulation
- policy_shift: include explicit policy actions when mentioned
- geopolitical_context: include explicit geopolitical conditions when mentioned

Extraction rules:
- If the user explicitly mentions a policy change, copy it into policy_shift
- If the user explicitly mentions a geopolitical condition, copy it into geopolitical_context
- If the user says peaceful, stable, or calm, map that into geopolitical_context
- If the user says next day, map horizon to 1d
- If the user says next week, map horizon to 1w
- If the user says today or intraday, map horizon to intraday

Regime rules:
- risk_off: shocks, tariffs, war, panic, sharp rate hikes, liquidity stress
- risk_on: stimulus, easing, melt-up, strong bullish appetite
- chop: mixed, range-bound, sideways, or unclear setups

Defaults:
- If horizon is missing, use 1d
- If objective is missing, use "simulate market participant reactions"

Return only valid JSON matching the schema.
"""

SCHEMA = SimulationRequest.model_json_schema()
SCHEMA_JSON = json.dumps(SCHEMA, indent=2)


def parse_prompt(state: SimState):
    user_prompt = state.get("user_prompt", "").strip()

    if not user_prompt:
        return {
            "parsed_request": {},
            "current_step": "parse_failed",
            "errors": ["user_prompt is missing or empty"],
        }

    try:
        response = chat(
            model="qwen2.5",
            messages=[
                {
                    "role": "system",
                    "content": (
                        f"{SYSTEM_PROMPT}\n\n"
                        "Use this JSON schema exactly:\n"
                        f"{SCHEMA_JSON}"
                    ),
                },
                {
                    "role": "user",
                    "content": user_prompt,
                },
            ],
            format=SCHEMA,
            options={"temperature": 0},
        )

        raw_content = response.message.content.strip()
        parsed = SimulationRequest.model_validate_json(raw_content)

        return {
            "parsed_request": parsed.model_dump(),
            "current_step": "prompt_parsed",
            "errors": [],
        }

    except ValidationError as e:
        return {
            "parsed_request": {},
            "current_step": "parse_failed",
            "errors": [f"ValidationError: {e}"],
        }
    except Exception as e:
        return {
            "parsed_request": {},
            "current_step": "parse_failed",
            "errors": [f"{type(e).__name__}: {e}"],
        }
