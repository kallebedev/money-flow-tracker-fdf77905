from __future__ import annotations

from dataclasses import dataclass
from typing import Iterable

from qdrant_client import QdrantClient
from qdrant_client.http import models as qmodels
from fastembed import TextEmbedding

from .settings import settings


@dataclass
class RAGChunk:
    id: str
    text: str
    source: str


class RAG:
    def __init__(self) -> None:
        self.client = QdrantClient(url=settings.qdrant_url)
        self.collection = settings.qdrant_collection
        self.embedder = TextEmbedding(model_name="BAAI/bge-small-en-v1.5")

    def ensure_collection(self, vector_size: int) -> None:
        collections = {c.name for c in self.client.get_collections().collections}
        if self.collection in collections:
            return
        self.client.create_collection(
            collection_name=self.collection,
            vectors_config=qmodels.VectorParams(size=vector_size, distance=qmodels.Distance.COSINE),
        )

    def embed(self, texts: list[str]) -> list[list[float]]:
        vecs: list[list[float]] = []
        for v in self.embedder.embed(texts):
            vecs.append(list(map(float, v)))
        return vecs

    def upsert(self, chunks: list[RAGChunk]) -> None:
        if not chunks:
            return
        vectors = self.embed([c.text for c in chunks])
        self.ensure_collection(vector_size=len(vectors[0]))
        points = []
        for c, v in zip(chunks, vectors):
            points.append(
                qmodels.PointStruct(
                    id=c.id,
                    vector=v,
                    payload={"text": c.text, "source": c.source},
                )
            )
        self.client.upsert(collection_name=self.collection, points=points)

    def search(self, query: str, top_k: int) -> list[dict]:
        qvec = self.embed([query])[0]
        res = self.client.search(collection_name=self.collection, query_vector=qvec, limit=top_k)
        out: list[dict] = []
        for r in res:
            payload = r.payload or {}
            out.append(
                {
                    "score": float(r.score),
                    "text": payload.get("text", ""),
                    "source": payload.get("source", ""),
                }
            )
        return out


rag = RAG()


def format_context(hits: Iterable[dict]) -> str:
    blocks: list[str] = []
    for h in hits:
        src = h.get("source") or "unknown"
        txt = h.get("text") or ""
        if not txt.strip():
            continue
        blocks.append(f"[SOURCE={src}]\n{txt}".strip())
    return "\n\n---\n\n".join(blocks)

