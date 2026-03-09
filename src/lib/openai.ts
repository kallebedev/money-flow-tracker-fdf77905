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
    throw new Error(
        "Função descontinuada. Use src/lib/aiClient.ts com VITE_AI_API_URL para chamar o seu ai-server.",
    );
};

export const analyzeFinanceHealth = async (
    transactions: unknown[],
    categories: unknown[],
    salary: number
): Promise<AIFinanceHealth> => {
    throw new Error(
        "Função descontinuada. Use src/lib/aiClient.ts com VITE_AI_API_URL para chamar o seu ai-server.",
    );
};
