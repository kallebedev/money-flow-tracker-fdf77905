import { useMemo, useState, useEffect } from "react";
import { useFinanceData } from "./useFinanceData";
import { Transaction } from "@/lib/types";
import { useAuth } from "@/contexts/AuthContext";
import { analyzeFinanceHealth } from "../lib/aiClient";
import { AIFinanceHealth } from "../lib/openai";

export interface SpendingInsight {
    categoryId: string;
    categoryName: string;
    currentAmount: number;
    averageAmount: number;
    percentageChange: number;
    type: "increase" | "decrease" | "stable";
    isUnusual: boolean;
}

export function useSpendingAnalysis(transactionsOverride?: Transaction[]) {
    const { user } = useAuth();
    const { transactions: rawTransactions, categories, monthlySalary, goals } = useFinanceData();
    const transactions = transactionsOverride || rawTransactions;

    // User Settings for Score
    const idealSavingsRate = user?.user_metadata?.idealSavingsRate ?? 0.2;
    const emergencyFundMonths = user?.user_metadata?.emergencyFundMonths ?? 6;
    const maxDebtRatio = user?.user_metadata?.maxDebtRatio ?? 0.3;

    const [aiHealth, setAiHealth] = useState<AIFinanceHealth | null>(null);
    const [isAILoading, setIsAILoading] = useState(false);

    const triggerAIAnalysis = async () => {
        setIsAILoading(true);
        try {
            const result = await analyzeFinanceHealth(transactions, categories, monthlySalary);
            setAiHealth(result);
        } catch (err) {
            console.error("AI Health Error:", err);
        } finally {
            setIsAILoading(false);
        }
    };

    const insights = useMemo(() => {
        // ... (existing logic remains same)
        if (transactions.length === 0 || categories.length === 0) return [];
        const now = new Date();
        const currentMonthStr = now.toISOString().slice(0, 7);
        const transactionMonths = Array.from(new Set(transactions.map(t => t.date.slice(0, 7)))).sort();
        const isSingleMonth = transactionMonths.length === 1;
        const targetMonth = isSingleMonth ? transactionMonths[0] : currentMonthStr;
        const monthlySpending: Record<string, Record<string, number>> = {};
        const monthsSet = new Set<string>();

        transactions.filter(t => t.type === "expense").forEach(t => {
            const month = t.date.slice(0, 7);
            monthsSet.add(month);
            if (!monthlySpending[month]) monthlySpending[month] = {};
            if (!monthlySpending[month][t.category]) monthlySpending[month][t.category] = 0;
            monthlySpending[month][t.category] += t.amount;
        });

        const months = Array.from(monthsSet).sort();
        const previousMonths = months.filter(m => m < targetMonth);
        const currentMonthExpenses = monthlySpending[targetMonth] || {};
        const totalExpensesByCat: Record<string, number> = {};
        if (!isSingleMonth) {
            transactions.filter(t => t.type === "expense").forEach(t => {
                totalExpensesByCat[t.category] = (totalExpensesByCat[t.category] || 0) + t.amount;
            });
        }

        const categoryInsights: SpendingInsight[] = categories.map(cat => {
            const currentAmount = isSingleMonth ? (currentMonthExpenses[cat.id] || 0) : (totalExpensesByCat[cat.id] || 0);
            let totalPrevious = 0;
            let monthsWithSpending = 0;
            previousMonths.forEach(m => {
                if (monthlySpending[m] && monthlySpending[m][cat.id] !== undefined) {
                    totalPrevious += monthlySpending[m][cat.id];
                    monthsWithSpending++;
                }
            });
            let averageAmount = cat.monthlyBudget || (monthsWithSpending > 0 ? totalPrevious / monthsWithSpending : 0);
            if (!isSingleMonth && transactionMonths.length > 0) averageAmount = averageAmount * transactionMonths.length;
            let percentageChange = 0;
            if (averageAmount > 0) percentageChange = ((currentAmount - averageAmount) / averageAmount) * 100;
            else if (currentAmount > 0) percentageChange = 100;
            let type: "increase" | "decrease" | "stable" = "stable";
            if (percentageChange > 5) type = "increase";
            else if (percentageChange < -5) type = "decrease";
            const isUnusual = percentageChange > 20;
            return { categoryId: cat.id, categoryName: cat.name, currentAmount, averageAmount, percentageChange, type, isUnusual };
        });
        return categoryInsights.sort((a, b) => Math.abs(b.percentageChange) - Math.abs(a.percentageChange));
    }, [transactions, categories]);

    const healthScoreData = useMemo(() => {
        // Use AI result if available, otherwise use original heuristics
        if (aiHealth) {
            return {
                score: aiHealth.score,
                advice: aiHealth.advice,
                status: aiHealth.status,
                breakdown: aiHealth.breakdown
            };
        }

        if (transactions.length === 0) {
            return {
                score: 100,
                advice: "Comece a registrar suas transações para receber uma análise completa de saúde financeira.",
                status: "Iniciante",
                breakdown: { savings: 0, reserve: 0, distribution: 0, debt: 0, habits: 0, regularity: 0 }
            };
        }

        const NEEDS_KEYWORDS = ["alimentação", "mercado", "aluguel", "moradia", "transporte", "combustível", "saúde", "farmácia", "educação", "contas", "luz", "água", "internet", "assinatura"];
        const numMonths = Math.max(1, Array.from(new Set(transactions.map(t => t.date.slice(0, 7)))).length);

        const actualIncome = transactions.filter(t => t.type === "income").reduce((acc, t) => acc + t.amount, 0);
        const projectedIncome = Math.max(actualIncome, monthlySalary * numMonths);
        const totalExpenses = transactions.filter(t => t.type === "expense").reduce((acc, t) => acc + t.amount, 0);

        let savingsScore = 0;
        if (projectedIncome > 0) {
            const savingsRate = (projectedIncome - totalExpenses) / projectedIncome;
            if (savingsRate >= idealSavingsRate) savingsScore = 25;
            else if (savingsRate > 0) savingsScore = (savingsRate / idealSavingsRate) * 25;
        }

        const reserveGoals = goals.filter(g => g.name.toLowerCase().includes("reserva") || g.name.toLowerCase().includes("emergência"));
        const currentReserve = reserveGoals.reduce((acc, g) => acc + g.currentAmount, 0);
        const avgMonthlyExpense = totalExpenses / numMonths;
        const targetReserve = avgMonthlyExpense * emergencyFundMonths;

        let reserveScore = 0;
        if (targetReserve > 0) reserveScore = Math.min(20, (currentReserve / targetReserve) * 20);
        else if (currentReserve > 0 || totalExpenses === 0) reserveScore = 20;

        const needsExpenses = transactions
            .filter(t => t.type === "expense" && NEEDS_KEYWORDS.some(k => categories.find(c => c.id === t.category)?.name.toLowerCase().includes(k)))
            .reduce((acc, t) => acc + t.amount, 0);

        let distributionScore = 0;
        if (projectedIncome > 0) {
            const needsRatio = needsExpenses / projectedIncome;
            if (needsRatio <= 0.5) distributionScore = 20;
            else if (needsRatio <= 0.8) distributionScore = 20 - ((needsRatio - 0.5) / 0.3) * 20;
        } else if (totalExpenses === 0) distributionScore = 20;

        const cardExpense = transactions
            .filter(t => t.type === "expense" && t.paymentMethod === "cartao")
            .reduce((acc, t) => acc + t.amount, 0);

        let debtScore = 15;
        if (projectedIncome > 0 && cardExpense > 0) {
            const debtRatio = cardExpense / projectedIncome;
            if (debtRatio <= maxDebtRatio) debtScore = 15;
            else if (debtRatio <= (maxDebtRatio * 2)) debtScore = Math.max(0, 15 - ((debtRatio - maxDebtRatio) / maxDebtRatio) * 15);
            else debtScore = 0;
        } else if (cardExpense === 0) debtScore = 15;

        const nonEssentialCats = insights.filter(i => !NEEDS_KEYWORDS.some(k => i.categoryName.toLowerCase().includes(k)));
        const totalWants = nonEssentialCats.reduce((acc, c) => acc + c.currentAmount, 0);
        const maxWant = Math.max(0, ...nonEssentialCats.map(c => c.currentAmount));
        let diversificationScore = 10;
        if (totalWants > 0 && maxWant / totalWants > 0.6) diversificationScore = 5;
        if (nonEssentialCats.length < 2 && totalExpenses > 0) diversificationScore = Math.min(diversificationScore, 5);

        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const recentTrans = transactions.filter(t => new Date(t.date) >= thirtyDaysAgo);
        const distinctDays = new Set(recentTrans.map(t => t.date.slice(0, 10))).size;
        const regularityScore = Math.min(10, (distinctDays / 12) * 10);

        const finalScore = Math.round(savingsScore + reserveScore + distributionScore + debtScore + diversificationScore + regularityScore);

        let advice = "Seu padrão de gastos está exemplar. Continue mantendo o foco em seus objetivos de longo prazo.";
        if (reserveScore < 10) advice = `Sua reserva de emergência está baixa. Ter pelo menos ${emergencyFundMonths} meses de despesas guardados é vital para sua segurança conforme sua meta.`;
        else if (savingsScore < 15) advice = `Sua taxa de poupança está abaixo do ideal de ${idealSavingsRate * 100}%. Tente otimizar seus gastos.`;
        else if (distributionScore < 12) advice = "Gastos fixos/essenciais estão muito altos. Tente reduzir contas básicas para liberar mais fluxo de caixa.";
        else if (debtScore < 8) advice = "Cuidado com o uso do cartão. Você está comprometendo uma fatia perigosa da sua renda futura.";

        let status = "Crítico";
        if (finalScore >= 90) status = "Excelente";
        else if (finalScore >= 75) status = "Bom";
        else if (finalScore >= 50) status = "Regular";

        return {
            score: finalScore,
            advice,
            status,
            breakdown: {
                savings: Math.round(savingsScore),
                reserve: Math.round(reserveScore),
                distribution: Math.round(distributionScore),
                debt: Math.round(debtScore),
                habits: Math.round(diversificationScore),
                regularity: Math.round(regularityScore)
            }
        };
    }, [transactions, categories, goals, monthlySalary, insights, aiHealth]);

    return {
        insights,
        healthScore: healthScoreData?.score ?? 0,
        healthAdvice: healthScoreData?.advice ?? "",
        healthStatus: healthScoreData?.status ?? "Normal",
        healthBreakdown: healthScoreData?.breakdown ?? {},
        unusualIncreases: insights.filter(i => i.isUnusual),
        topSpendingIncreases: insights.filter(i => i.type === "increase").slice(0, 3),
        triggerAIAnalysis,
        isAILoading,
        isUsingAI: !!aiHealth
    };
}
