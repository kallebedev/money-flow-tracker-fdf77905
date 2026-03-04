import { useMemo } from "react";
import { useFinanceData } from "./useFinanceData";

export interface SpendingInsight {
    categoryId: string;
    categoryName: string;
    currentAmount: number;
    averageAmount: number;
    percentageChange: number;
    type: "increase" | "decrease" | "stable";
    isUnusual: boolean;
}

export function useSpendingAnalysis() {
    const { transactions, categories } = useFinanceData();

    const insights = useMemo(() => {
        if (transactions.length === 0 || categories.length === 0) return [];

        const now = new Date();
        const currentMonthStr = now.toISOString().slice(0, 7); // YYYY-MM

        // Group transactions by month and category
        const monthlySpending: Record<string, Record<string, number>> = {};
        const monthsSet = new Set<string>();

        transactions.filter(t => t.type === "expense").forEach(t => {
            const month = t.date.slice(0, 7);
            monthsSet.add(month);

            if (!monthlySpending[month]) {
                monthlySpending[month] = {};
            }

            if (!monthlySpending[month][t.category]) {
                monthlySpending[month][t.category] = 0;
            }

            monthlySpending[month][t.category] += t.amount;
        });

        const months = Array.from(monthsSet).sort();
        const previousMonths = months.filter(m => m < currentMonthStr);
        const currentMonthExpenses = monthlySpending[currentMonthStr] || {};

        const categoryInsights: SpendingInsight[] = categories.map(cat => {
            const currentAmount = currentMonthExpenses[cat.id] || 0;

            // Calculate average for previous months
            let totalPrevious = 0;
            let monthsWithSpending = 0;

            previousMonths.forEach(m => {
                if (monthlySpending[m][cat.id] !== undefined) {
                    totalPrevious += monthlySpending[m][cat.id];
                    monthsWithSpending++;
                }
            });

            const averageAmount = cat.monthlyBudget || (monthsWithSpending > 0 ? totalPrevious / monthsWithSpending : 0);

            let percentageChange = 0;
            if (averageAmount > 0) {
                percentageChange = ((currentAmount - averageAmount) / averageAmount) * 100;
            } else if (currentAmount > 0) {
                percentageChange = 100; // New spending in this category
            }

            let type: "increase" | "decrease" | "stable" = "stable";
            if (percentageChange > 5) type = "increase";
            else if (percentageChange < -5) type = "decrease";

            // Detect unusual increase (e.g., > 15% above average)
            const isUnusual = percentageChange > 15;

            return {
                categoryId: cat.id,
                categoryName: cat.name,
                currentAmount,
                averageAmount,
                percentageChange,
                type,
                isUnusual
            };
        });

        // Return all categories sorted by percentage change
        return categoryInsights.sort((a, b) => Math.abs(b.percentageChange) - Math.abs(a.percentageChange));

    }, [transactions, categories]);

    const healthScore = useMemo(() => {
        if (transactions.length === 0) return 100;

        // 1. Budget Compliance (40%)
        // How much of the set budgets are being respected
        const categoriesWithBudgets = categories.filter(c => (c.monthlyBudget || 0) > 0);
        let budgetScore = 100;

        if (categoriesWithBudgets.length > 0) {
            let totalOverbudget = 0;
            let totalBudgets = 0;

            categoriesWithBudgets.forEach(cat => {
                const current = insights.find(i => i.categoryId === cat.id)?.currentAmount || 0;
                const budget = cat.monthlyBudget || 0;
                totalBudgets += budget;
                if (current > budget) {
                    totalOverbudget += (current - budget);
                }
            });

            const overbudgetRatio = totalBudgets > 0 ? totalOverbudget / totalBudgets : 0;
            budgetScore = Math.max(0, 100 - (overbudgetRatio * 150)); // Aggressive penalty for overbudget
        }

        // 2. Savings Rate / Balance Health (30%)
        // Relation between income and expenses
        const totalIncome = transactions
            .filter(t => t.type === "income")
            .reduce((acc, t) => acc + t.amount, 0);
        const totalExpenses = transactions
            .filter(t => t.type === "expense")
            .reduce((acc, t) => acc + t.amount, 0);

        let savingsScore = 100;
        if (totalIncome > 0) {
            const expenseRatio = totalExpenses / totalIncome;
            // Ideal is spending <= 70% of income
            if (expenseRatio > 0.7) {
                savingsScore = Math.max(0, 100 - (expenseRatio - 0.7) * 200);
            }
        } else if (totalExpenses > 0) {
            savingsScore = 30; // No income but spending
        }

        // 3. Trend Stability (30%)
        // Current month vs historical average
        const totalAverage = insights.reduce((acc, i) => acc + i.averageAmount, 0);
        const totalCurrent = insights.reduce((acc, i) => acc + i.currentAmount, 0);

        let trendScore = 100;
        if (totalAverage > 0) {
            const trendRatio = totalCurrent / totalAverage;
            if (trendRatio > 1.1) { // More than 10% above average
                trendScore = Math.max(0, 100 - (trendRatio - 1) * 100);
            }
        }

        // Final Weighted Score
        const finalScore = (budgetScore * 0.4) + (savingsScore * 0.3) + (trendScore * 0.3);
        return Math.round(Math.max(0, Math.min(100, finalScore)));
    }, [transactions, categories, insights]);

    return {
        insights,
        healthScore,
        unusualIncreases: insights.filter(i => i.isUnusual),
        topSpendingIncreases: insights.filter(i => i.type === "increase").slice(0, 3)
    };
}
