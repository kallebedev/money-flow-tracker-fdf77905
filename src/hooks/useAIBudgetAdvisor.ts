import { useState, useEffect } from "react";
import { useFinance } from "../contexts/FinanceContext";
import { generateBudgetAdvice, AIBudgetAdvice } from "../lib/openai";

export interface BudgetProfileData {
    goal: "debt" | "savings" | "moderate";
    lifestyle: "frugal" | "comfortable" | "custom";
    priority: "essentials" | "future" | "lifestyle";
}

/** Respostas do questionário completo para o plano de controle financeiro */
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

export function useAIBudgetAdvisor(profileData?: BudgetProfileData, trigger: boolean = false) {
    const { monthlySalary, categories } = useFinance();
    const [advisor, setAdvisor] = useState<AIBudgetAdvice | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!trigger || !monthlySalary || monthlySalary <= 0 || !profileData) {
            return;
        }

        const fetchAdvice = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const data = await generateBudgetAdvice(monthlySalary, profileData, categories);
                setAdvisor(data);
            } catch (err: any) {
                console.error("AI Budget Error:", err);
                setError(err.message || "Erro ao gerar conselho de IA");
            } finally {
                setIsLoading(false);
            }
        };

        fetchAdvice();
    }, [monthlySalary, profileData, trigger]);

    return { advisor, isLoading, error };
}

/** Gera plano completo a partir do questionário */
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
            const { generateFinancialPlan } = await import("../lib/openai");
            const data = await generateFinancialPlan(
                {
                    ...questionnaire,
                    goal: questionnaire.goal ?? "moderate",
                    lifestyle: questionnaire.lifestyle ?? "comfortable",
                    priority: questionnaire.priority ?? "essentials",
                },
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
