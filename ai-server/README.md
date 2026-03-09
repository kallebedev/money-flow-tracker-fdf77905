# MoneyFlow AI Server (self-hosted)

Este serviço substitui chamadas de OpenAI no frontend por uma API própria, com **RAG** (busca em base vetorial) para “especializar” as respostas no MoneyFlow.

## Subir localmente (desenvolvimento)

1) Instale deps:

```bash
cd ai-server
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
```

2) Suba o Qdrant (recomendado) via Docker:

```bash
docker compose up -d
```

3) Configure variáveis (exemplo):

- `QDRANT_URL=http://localhost:6333`
- `LLM_BASE_URL=http://localhost:8001/v1` (ex.: vLLM com API OpenAI-compatible)
- `LLM_MODEL=...`
- `LLM_API_KEY=` (opcional)
- `AI_RAG_TOP_K=6` (opcional)

4) Rode a API:

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8090 --reload
```

## Indexar o repositório (RAG)

Com o Qdrant rodando, execute:

```bash
python -m app.index_repo --repo .. --collection moneyflow_repo
```

## Endpoints

- `POST /ai/productivity/idea-to-project`
- `POST /ai/productivity/weekly-plan`
- `POST /ai/productivity/advisor-note`
- `POST /ai/finance/budget-advice`
- `POST /ai/finance/financial-plan`
- `POST /ai/finance/health`

Todas as respostas mantêm o formato JSON esperado pelo app.

