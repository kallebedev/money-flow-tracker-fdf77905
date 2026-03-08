import OpenAI from "openai";

// Configuração do cliente OpenAI
// Importante: VITE_OPENAI_API_KEY deve estar no seu .env
const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

export const openai = apiKey ? new OpenAI({
    apiKey,
    dangerouslyAllowBrowser: true // Permite rodar no client-side para este projeto local
}) : null;

export interface AIProjectResponse {
    title: string;
    description: string;
    color: string;
    tasks: string[];
}

export interface AIBudgetAdvice {
    overview: string;
    buckets: { category: string; percentage: number; suggestedAmount: number; reason: string }[];
    categoryAdvice: { categoryId: string; categoryName: string; suggestedAmount: number; advice: string }[];
}

export interface AIFinanceHealth {
    score: number;
    status: string;
    advice: string;
    breakdown: Record<string, number>;
}

export const transformIdeaToProject = async (idea: string): Promise<AIProjectResponse> => {
    if (!openai) {
        throw new Error("OpenAI API Key não configurada. Adicione VITE_OPENAI_API_KEY ao seu .env");
    }

    const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
            {
                role: "system",
                content: `Você é um assistente de produtividade especializado em transformar ideias brutas em projetos estruturados.
        Responda APENAS com um objeto JSON válido seguindo este formato:
        {
          "title": "Título curto e impactante",
          "description": "Descrição detalhada do projeto",
          "color": "Um código Hex de cor vibrante (ex: #3b82f6)",
          "tasks": ["Tarefa 1", "Tarefa 2", "Tarefa 3", "Tarefa 4", "Tarefa 5"]
        }`
            },
            {
                role: "user",
                content: `Transforme esta ideia em um projeto: "${idea}"`
            }
        ],
        response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content;
    if (!content) throw new Error("IA não retornou uma resposta válida.");

    return JSON.parse(content) as AIProjectResponse;
};

export const generateWeeklyPlan = async (goals: any[], tasks: any[]): Promise<string[]> => {
    if (!openai) {
        throw new Error("OpenAI API Key não configurada.");
    }

    const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
            {
                role: "system",
                content: `Você é um coach de alta performance. Analise as metas e tarefas do usuário e sugira um plano de 3 ações críticas para a semana.
        Responda APENAS com um JSON contendo um array de strings: ["Ação 1", "Ação 2", "Ação 3"]`
            },
            {
                role: "user",
                content: `Metas: ${JSON.stringify(goals.map(g => g.title))}
        Tarefas Pendentes: ${JSON.stringify(tasks.filter(t => t.status !== 'completed').map(t => t.title))}`
            }
        ],
        response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content;
    if (!content) throw new Error("IA não retornou uma resposta válida.");

    const parsed = JSON.parse(content);
    return Array.isArray(parsed) ? parsed : (parsed.actions || parsed.tasks || []);
};

export const getAIAdvisorNote = async (stats: any, completedToday: number): Promise<string> => {
    if (!openai) return "Aguardando configuração da OpenAI...";

    const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
            {
                role: "system",
                content: "Você é um mentor de produtividade. Dê um conselho curto (máximo 150 caracteres) baseado no progresso do usuário hoje."
            },
            {
                role: "user",
                content: `Nível: ${stats.level}, XP: ${stats.experience}, Tarefas concluídas hoje: ${completedToday}.`
            }
        ]
    });

    return response.choices[0].message.content || "";
};

export const generateBudgetAdvice = async (
    salary: number,
    profile: any,
    categories: any[]
): Promise<AIBudgetAdvice> => {
    if (!openai) throw new Error("Chave OpenAI não configurada.");

    const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
            {
                role: "system",
                content: `Você é um consultor financeiro especialista. Analise o salário e perfil do usuário para sugerir orçamentos por categoria. 
        Utilize a regra 50/30/20 mas adapte ao perfil (ex: se o foco é dívida, priorize essencial e pagamento de dívida).
        Responda APENAS com um JSON válido:
        {
          "overview": "Texto explicativo curto",
          "buckets": [{"category": "Essencial", "percentage": 50, "suggestedAmount": 1000, "reason": "..."}],
          "categoryAdvice": [{"categoryId": "id1", "categoryName": "Comida", "suggestedAmount": 500, "advice": "Texto curto"}]
        }`
            },
            {
                role: "user",
                content: `Salário: ${salary}. Perfil: ${JSON.stringify(profile)}. Categorias: ${JSON.stringify(categories.map(c => ({ id: c.id, name: c.name })))}`
            }
        ],
        response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content;
    if (!content) throw new Error("IA não retornou resposta.");
    return JSON.parse(content) as AIBudgetAdvice;
};

/** Questionário completo para plano de controle financeiro (tipagem para a API) */
export type FinancialPlanQuestionnaireInput = {
    monthlySalary: number;
    otherIncome?: number;
    fixedExpenses?: number;
    hasDebt: boolean;
    debtMonthlyPayment?: number;
    emergencyFundMonths?: number;
    hasEmergencyFund: boolean;
    goal: string;
    lifestyle: string;
    priority: string;
    goalsShortTerm?: string;
    goalsLongTerm?: string;
};

/** Gera um plano financeiro completo a partir do questionário detalhado */
export const generateFinancialPlan = async (
    questionnaire: FinancialPlanQuestionnaireInput,
    categories: { id: string; name: string }[]
): Promise<AIBudgetAdvice> => {
    if (!openai) throw new Error("Chave OpenAI não configurada.");

    const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
            {
                role: "system",
                content: `Você é um consultor financeiro especialista em controle financeiro pessoal. Com base nas respostas do questionário, crie um plano de controle financeiro personalizado e realista.

Regras:
- Considere renda total (salário + outras fontes), gastos fixos, dívidas e reserva de emergência.
- Adapte a regra 50/30/20 ao perfil: quem tem dívidas deve priorizar quitação; quem quer investir deve aumentar poupança.
- Se o usuário não tem reserva de emergência, sugira priorizar isso após essenciais.
- categoryAdvice deve usar os categoryId e categoryName exatamente das categorias fornecidas.
- overview deve ser um texto claro e motivador explicando o plano e os primeiros passos (2-4 parágrafos).

Responda APENAS com um JSON válido:
{
  "overview": "Texto do plano completo com visão geral e passos iniciais",
  "buckets": [{"category": "Nome do grupo", "percentage": 50, "suggestedAmount": 1000, "reason": "Breve justificativa"}],
  "categoryAdvice": [{"categoryId": "id da categoria", "categoryName": "Nome", "suggestedAmount": 500, "advice": "Dica específica para essa categoria"}]
}`
            },
            {
                role: "user",
                content: `Questionário do usuário: ${JSON.stringify(questionnaire)}. Categorias disponíveis: ${JSON.stringify(categories)}. Gere o plano financeiro ideal.`
            }
        ],
        response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content;
    if (!content) throw new Error("IA não retornou resposta.");
    return JSON.parse(content) as AIBudgetAdvice;
};

export const analyzeFinanceHealth = async (
    transactions: any[],
    categories: any[],
    salary: number
): Promise<AIFinanceHealth> => {
    if (!openai) throw new Error("Chave OpenAI não configurada.");

    const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
            {
                role: "system",
                content: `Você é um analista de dados financeiros. Analise as transações e dê um score de saúde financeira.
        Responda APENAS com um JSON válido:
        {
          "score": 85,
          "status": "Excelente",
          "advice": "Texto de conselho estratégico",
          "breakdown": {"economias": 20, "gastos_fixos": 40, "lazer": 30, "dividas": 10}
        }`
            },
            {
                role: "user",
                content: `Salário: ${salary}. Transações (últimos 30 dias): ${JSON.stringify(transactions.slice(0, 50).map(t => ({ date: t.date, amount: t.amount, category: t.category, type: t.type })))}`
            }
        ],
        response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content;
    if (!content) throw new Error("IA não retornou resposta.");
    return JSON.parse(content) as AIFinanceHealth;
};
