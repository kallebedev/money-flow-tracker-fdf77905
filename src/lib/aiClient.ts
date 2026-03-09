import type {
  AIProjectResponse,
  AIBudgetAdvice,
  AIFinanceHealth,
  FinancialPlanQuestionnaireInput,
} from "@/lib/openai";

const AI_API_URL = (import.meta.env.VITE_AI_API_URL as string | undefined)?.replace(/\/+$/, "");
const AI_ENABLED = (import.meta.env.VITE_AI_ENABLED as string | undefined) !== "false";

function requireAI() {
  if (!AI_ENABLED) throw new Error("IA desabilitada (VITE_AI_ENABLED=false).");
  if (!AI_API_URL) throw new Error("IA não configurada. Defina VITE_AI_API_URL no .env");
}

async function postJSON<T>(path: string, body: unknown): Promise<T> {
  requireAI();
  const res = await fetch(`${AI_API_URL}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Erro IA: ${res.status}`);
  }
  return (await res.json()) as T;
}

export async function transformIdeaToProject(idea: string): Promise<AIProjectResponse> {
  return await postJSON<AIProjectResponse>("/ai/productivity/idea-to-project", { idea });
}

export async function generateWeeklyPlan(goals: unknown[], tasks: unknown[]): Promise<string[]> {
  const out = await postJSON<{ actions?: string[]; tasks?: string[]; [k: string]: unknown }>(
    "/ai/productivity/weekly-plan",
    { goals, tasks },
  );
  return (out.actions || out.tasks || []) as string[];
}

export async function getAIAdvisorNote(stats: Record<string, unknown>, completedToday: number): Promise<string> {
  const out = await postJSON<{ note?: string }>("/ai/productivity/advisor-note", { stats, completedToday });
  return out.note || "";
}

export async function generateBudgetAdvice(
  salary: number,
  profile: unknown,
  categories: unknown[],
): Promise<AIBudgetAdvice> {
  return await postJSON<AIBudgetAdvice>("/ai/finance/budget-advice", { salary, profile, categories });
}

export async function generateFinancialPlan(
  questionnaire: FinancialPlanQuestionnaireInput,
  categories: { id: string; name: string }[],
): Promise<AIBudgetAdvice> {
  return await postJSON<AIBudgetAdvice>("/ai/finance/financial-plan", { questionnaire, categories });
}

export async function analyzeFinanceHealth(
  transactions: unknown[],
  categories: unknown[],
  salary: number,
): Promise<AIFinanceHealth> {
  return await postJSON<AIFinanceHealth>("/ai/finance/health", { transactions, categories, salary });
}

