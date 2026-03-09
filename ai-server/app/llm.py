import httpx
from .settings import settings


class LLMClient:
    def __init__(self) -> None:
        self.base_url = settings.llm_base_url.rstrip("/")
        self.model = settings.llm_model
        self.api_key = settings.llm_api_key

    async def chat_json(self, system: str, user: str, json_schema_hint: str | None = None) -> str:
        """
        Calls an OpenAI-compatible chat completions endpoint.
        Returns the raw assistant content (expected to be JSON by prompting).
        """
        headers: dict[str, str] = {}
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"

        content = user if not json_schema_hint else f"{user}\n\nResponda APENAS com JSON válido no formato:\n{json_schema_hint}"

        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": system},
                {"role": "user", "content": content},
            ],
            "temperature": 0.4,
        }

        async with httpx.AsyncClient(timeout=60) as client:
            resp = await client.post(f"{self.base_url}/chat/completions", json=payload, headers=headers)
            resp.raise_for_status()
            data = resp.json()
            return (data.get("choices", [{}])[0].get("message", {}) or {}).get("content") or ""


llm = LLMClient()

