from pydantic import BaseModel
from dotenv import load_dotenv
import os


load_dotenv()


class Settings(BaseModel):
    # Vector DB
    qdrant_url: str = os.getenv("QDRANT_URL", "http://localhost:6333")
    qdrant_collection: str = os.getenv("QDRANT_COLLECTION", "moneyflow_repo")

    # LLM (OpenAI-compatible API)
    llm_base_url: str = os.getenv("LLM_BASE_URL", "http://localhost:8001/v1")
    llm_api_key: str | None = os.getenv("LLM_API_KEY") or None
    llm_model: str = os.getenv("LLM_MODEL", "Qwen/Qwen2.5-7B-Instruct")

    # RAG
    rag_top_k: int = int(os.getenv("AI_RAG_TOP_K", "6"))

    # API
    cors_allow_origins: str = os.getenv("CORS_ALLOW_ORIGINS", "*")
    api_token: str | None = os.getenv("AI_SERVICE_TOKEN") or None


settings = Settings()

