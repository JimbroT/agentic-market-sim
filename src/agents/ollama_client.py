"""
src/agents/ollama_client.py

Structured Ollama client with one repair retry.

Flow:
1. Send a normal structured-output request to Ollama.
2. Validate message.content against the Pydantic response model.
3. If validation fails, ask Ollama to repair the JSON to match the same schema.
4. Validate the repaired JSON.
5. Raise a detailed OllamaClientError if both attempts fail.
"""

from __future__ import annotations

import json
from typing import Optional, Type, TypeVar

import requests
from pydantic import BaseModel, ValidationError

T = TypeVar("T", bound=BaseModel)


class OllamaClientError(Exception):
    """Raised when the Ollama request or response validation fails."""


class OllamaClient:
    def __init__(
        self,
        model: Optional[str] = None,
        base_url: str = "http://localhost:11434",
        timeout_seconds: int = 90,
    ) -> None:
        self.model = model or "llama3.2:3b"
        self.base_url = base_url.rstrip("/")
        self.timeout_seconds = timeout_seconds

    def _post_chat(self, payload: dict) -> dict:
        try:
            response = requests.post(
                f"{self.base_url}/api/chat",
                json=payload,
                timeout=self.timeout_seconds,
            )
        except requests.RequestException as exc:
            raise OllamaClientError(
                f"Could not reach Ollama at {self.base_url}/api/chat: {exc}"
            ) from exc

        if response.status_code != 200:
            raise OllamaClientError(
                f"Ollama returned HTTP {response.status_code}: {response.text[:1000]}"
            )

        try:
            return response.json()
        except ValueError as exc:
            raise OllamaClientError(
                f"Ollama response was not valid JSON: {response.text[:1000]}"
            ) from exc

    def _extract_content(self, data: dict) -> str:
        message = data.get("message", {})
        content = message.get("content")

        if not content or not isinstance(content, str):
            raise OllamaClientError(
                f"Ollama response missing message.content: {json.dumps(data)[:1000]}"
            )

        return content

    def chat_structured(
        self,
        system_prompt: str,
        user_prompt: str,
        response_model: Type[T],
        model: Optional[str] = None,
        temperature: float = 0,
    ) -> T:
        active_model = model or self.model
        schema = response_model.model_json_schema()

        grounded_user_prompt = (
            f"{user_prompt}\n\n"
            "Return ONLY a valid JSON object that matches this JSON schema exactly.\n"
            "Do not include markdown fences, commentary, or extra text.\n"
            f"JSON_SCHEMA:\n{json.dumps(schema, indent=2)}"
        )

        payload = {
            "model": active_model,
            "stream": False,
            "format": schema,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": grounded_user_prompt},
            ],
            "options": {
                "temperature": temperature,
            },
        }

        data = self._post_chat(payload)
        content = self._extract_content(data)

        try:
            return response_model.model_validate_json(content)
        except ValidationError as first_exc:
            repair_prompt = (
                "The previous response did not satisfy the required JSON schema.\n"
                "Repair it so it matches the schema exactly.\n"
                "Return ONLY valid JSON.\n\n"
                f"VALIDATION_ERROR:\n{str(first_exc)}\n\n"
                f"PREVIOUS_JSON:\n{content}\n"
            )

            repair_payload = {
                "model": active_model,
                "stream": False,
                "format": schema,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": repair_prompt},
                ],
                "options": {
                    "temperature": 0,
                },
            }

            try:
                repair_data = self._post_chat(repair_payload)
                repair_content = self._extract_content(repair_data)
                return response_model.model_validate_json(repair_content)
            except Exception as repair_exc:
                raise OllamaClientError(
                    "Structured output validation failed after repair attempt. "
                    f"Raw content: {content[:1200]} | "
                    f"First validation error: {first_exc} | "
                    f"Repair failure: {repair_exc}"
                ) from repair_exc
