from __future__ import annotations

import json
from fastapi import FastAPI, Depends, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from .settings import settings
from .schemas import (
    IdeaToProjectRequest,
    WeeklyPlanRequest,
    AdvisorNoteRequest,
    BudgetAdviceRequest,
    FinancialPlanRequest,
    FinanceHealthRequest,
)
from .llm import llm
from .rag import rag, format_context


def require_token(x_ai_token: str | None = Header(default=None)) -> None:
    if not settings.api_token:
        return
    if x_ai_token != settings.api_token:
        raise HTTPException(status_code=401, detail="Unauthorized")


app = FastAPI(title="MoneyFlow AI Server", version="0.1.0")

allow_origins = [o.strip() for o in settings.cors_allow_origins.split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins if allow_origins else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


async def call_with_rag(system: str, user: str, json_schema_hint: str) -> dict:
    hits = rag.search(user, top_k=settings.rag_top_k)
    context = format_context(hits)
    full_system = (
        system
        + "\n\nVocê tem acesso a um CONTEXTO recuperado do MoneyFlow. Use apenas o que for relevante.\n"
        + "Se o contexto não ajudar, responda com bom senso e sem inventar APIs inexistentes.\n"
    )
    full_user = f"CONTEXTO:\n{context}\n\nPEDIDO:\n{user}".strip()
    raw = await llm.chat_json(full_system, full_user, json_schema_hint=json_schema_hint)
    try:
        return json.loads(raw)
    except Exception:
        # fallback: try to extract JSON-ish
        raw2 = raw.strip()
        start = raw2.find("{")
        end = raw2.rfind("}")
        if start != -1 and end != -1 and end > start:
            return json.loads(raw2[start : end + 1])
        raise HTTPException(status_code=502, detail="LLM returned invalid JSON")


@app.get("/health")
async def health() -> dict:
    return {"ok": True}


@app.post("/ai/productivity/idea-to-project")
async def idea_to_project(body: IdeaToProjectRequest, _: None = Depends(require_token)) -> dict:
    schema = """{
  "title": "Título curto e impactante",
  "description": "Descrição detalhada do projeto",
  "color": "#3b82f6",
  "tasks": ["Tarefa 1", "Tarefa 2", "Tarefa 3", "Tarefa 4", "Tarefa 5"]
}"""
    system = "Você é um assistente de produtividade do MoneyFlow. Converta ideias em projetos estruturados."
    user = f'Transforme esta ideia em um projeto: "{body.idea}"'
    return await call_with_rag(system, user, schema)


@app.post("/ai/productivity/weekly-plan")
async def weekly_plan(body: WeeklyPlanRequest, _: None = Depends(require_token)) -> dict:
    schema = """{ "actions": ["Ação 1", "Ação 2", "Ação 3"] }"""
    system = "Você é um coach de alta performance. Sugira 3 ações críticas para a semana."
    user = f"Metas: {json.dumps([g.get('title') or g.get('name') for g in body.goals])}\nTarefas: {json.dumps([t.get('title') for t in body.tasks])}"
    return await call_with_rag(system, user, schema)


@app.post("/ai/productivity/advisor-note")
async def advisor_note(body: AdvisorNoteRequest, _: None = Depends(require_token)) -> dict:
    schema = """{ "note": "texto curto" }"""
    system = "Você é um mentor de produtividade. Dê um conselho curto (máximo 150 caracteres) baseado no progresso do usuário hoje."
    user = f"Nível: {body.stats.get('level')}, XP: {body.stats.get('experience')}, concluídas hoje: {body.completedToday}."
    return await call_with_rag(system, user, schema)


@app.post("/ai/finance/budget-advice")
async def budget_advice(body: BudgetAdviceRequest, _: None = Depends(require_token)) -> dict:
    schema = """{
  "overview": "Texto explicativo curto",
  "buckets": [{"category": "Essencial", "percentage": 50, "suggestedAmount": 1000, "reason": "..."}],
  "categoryAdvice": [{"categoryId": "id1", "categoryName": "Comida", "suggestedAmount": 500, "advice": "Texto curto"}]
}"""
    system = "Você é um consultor financeiro especialista do MoneyFlow."
    user = f"Salário: {body.salary}. Perfil: {json.dumps(body.profile)}. Categorias: {json.dumps(body.categories)}"
    return await call_with_rag(system, user, schema)


@app.post("/ai/finance/financial-plan")
async def financial_plan(body: FinancialPlanRequest, _: None = Depends(require_token)) -> dict:
    schema = """{
  "overview": "Texto do plano completo com visão geral e passos iniciais",
  "buckets": [{"category": "Nome do grupo", "percentage": 50, "suggestedAmount": 1000, "reason": "Breve justificativa"}],
  "categoryAdvice": [{"categoryId": "id da categoria", "categoryName": "Nome", "suggestedAmount": 500, "advice": "Dica específica para essa categoria"}]
}"""
    system = "Você é um consultor financeiro especialista em controle financeiro pessoal do MoneyFlow."
    user = f"Questionário: {json.dumps(body.questionnaire)}\nCategorias: {json.dumps(body.categories)}"
    return await call_with_rag(system, user, schema)


@app.post("/ai/finance/health")
async def finance_health(body: FinanceHealthRequest, _: None = Depends(require_token)) -> dict:
    schema = """{
  "score": 85,
  "status": "Excelente",
  "advice": "Texto de conselho estratégico",
  "breakdown": {"economias": 20, "gastos_fixos": 40, "lazer": 30, "dividas": 10}
}"""
    system = "Você é um analista de dados financeiros do MoneyFlow. Analise transações e gere um score de saúde financeira."
    tx_preview = body.transactions[:80]
    user = f"Salário: {body.salary}. Transações (amostra): {json.dumps(tx_preview)}"
    return await call_with_rag(system, user, schema)

