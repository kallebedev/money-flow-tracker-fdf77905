from __future__ import annotations

import argparse
import hashlib
import os
from pathlib import Path

from .rag import rag, RAGChunk


TEXT_EXTS = {
    ".ts",
    ".tsx",
    ".js",
    ".jsx",
    ".md",
    ".css",
    ".json",
    ".yml",
    ".yaml",
    ".toml",
    ".txt",
}

SKIP_DIRS = {"node_modules", "dist", "build", ".git", ".cursor", ".venv", "__pycache__"}


def iter_files(repo: Path) -> list[Path]:
    files: list[Path] = []
    for root, dirs, filenames in os.walk(repo):
        dirs[:] = [d for d in dirs if d not in SKIP_DIRS]
        for fn in filenames:
            p = Path(root) / fn
            if p.suffix.lower() in TEXT_EXTS and p.is_file():
                files.append(p)
    return files


def chunk_text(text: str, max_chars: int = 1800, overlap: int = 200) -> list[str]:
    if not text.strip():
        return []
    chunks: list[str] = []
    i = 0
    n = len(text)
    while i < n:
        j = min(n, i + max_chars)
        chunk = text[i:j]
        chunks.append(chunk)
        if j >= n:
            break
        i = max(0, j - overlap)
    return chunks


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--repo", required=True, help="Caminho do repositório (ex.: ..)")
    parser.add_argument("--collection", default=None, help="Nome da coleção no Qdrant")
    args = parser.parse_args()

    repo = Path(args.repo).resolve()
    if args.collection:
        rag.collection = args.collection

    files = iter_files(repo)
    to_upsert: list[RAGChunk] = []

    for p in files:
        rel = str(p.relative_to(repo)).replace("\\", "/")
        try:
            content = p.read_text(encoding="utf-8", errors="ignore")
        except Exception:
            continue
        for idx, c in enumerate(chunk_text(content)):
            cid = hashlib.sha1(f"{rel}:{idx}".encode("utf-8")).hexdigest()
            to_upsert.append(RAGChunk(id=cid, text=f"FILE: {rel}\n\n{c}".strip(), source=rel))

        if len(to_upsert) >= 256:
            rag.upsert(to_upsert)
            to_upsert = []

    if to_upsert:
        rag.upsert(to_upsert)

    print(f"Indexed {len(files)} files into collection '{rag.collection}'.")


if __name__ == "__main__":
    main()

