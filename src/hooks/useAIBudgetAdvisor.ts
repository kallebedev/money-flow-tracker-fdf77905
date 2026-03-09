import { useState } from "react";
import { useFinance } from "../contexts/FinanceContext";
import { generateBudgetAdviceAI } from "@/lib/openaiService";

export interface BudgetProfileData {
    goal: "debt" | "savings" | "moderate";
    lifestyle: "frugal" | "comfortable" | "custom";
    priority: "essentials" | "future" | "lifestyle";
}

export interface FinancialPlanQuestionnaire {
    monthlySalary: number;
    otherIncome?: number;
    fixedExpenses?: number;
    hasDebt: boolean;
    debtMonthlyPayment?: number;
    emergencyFundMonths?: number;
    hasEmergencyFund: boolean;
    goal: "debt" | "savings" | "moderate";
    lifestyle: "frugal" | "comfortable" | "custom";
    priority: "essentials" | "future" | "lifestyle";
    goalsShortTerm?: string;
    goalsLongTerm?: string;
}

export interface AIBudgetAdvice {
    overview: string;
    buckets: { category: string; percentage: number; suggestedAmount: number; reason: string }[];
    categoryAdvice: { categoryId: string; categoryName: string; suggestedAmount: number; advice: string }[];
}

export function useAIBudgetAdvisor(profileData?: BudgetProfileData, trigger: boolean = false) {
    const { monthlySalary, categories } = useFinance();
    const [advisor, setAdvisor] = useState<AIBudgetAdvice | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Auto-trigger when profile is set
    if (trigger && monthlySalary > 0 && profileData && !advisor && !isLoading && !error) {
        setIsLoading(true);
        generateBudgetAdviceAI(monthlySalary, profileData, categories)
            .then(data => { setAdvisor(data); setIsLoading(false); })
            .catch(err => { setError(err.message); setIsLoading(false); });
    }

    return { advisor, isLoading, error };
}

export function useAIPlanFromQuestionnaire() {
    const { categories } = useFinance();
    const [advisor, setAdvisor] = useState<AIBudgetAdvice | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const resetPlan = () => {
        setAdvisor(null);
        setError(null);
    };

    const generatePlan = async (questionnaire: FinancialPlanQuestionnaire) => {
        setIsLoading(true);
        setError(null);
        setAdvisor(null);
        try {
            const data = await generateBudgetAdviceAI(
                questionnaire.monthlySalary,
                questionnaire,
                categories.map(c => ({ id: c.id, name: c.name }))
            );
            setAdvisor(data);
        } catch (err: any) {
            console.error("AI Plan Error:", err);
            setError(err.message || "Erro ao gerar plano");
        } finally {
            setIsLoading(false);
        }
    };

    return { advisor, isLoading, error, generatePlan, resetPlan };
}
