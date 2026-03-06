import { useMemo } from "react";
import { useFinanceData } from "./useFinanceData";
import { Transaction } from "@/lib/types";

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
    const { transactions: rawTransactions, categories, monthlySalary } = useFinanceData();
    const transactions = transactionsOverride || rawTransactions;

    const insights = useMemo(() => {
        if (transactions.length === 0 || categories.length === 0) return [];

        const now = new Date();
        const currentMonthStr = now.toISOString().slice(0, 7);

        // Detect if we are looking at a specific month or a range
        const transactionMonths = Array.from(new Set(transactions.map(t => t.date.slice(0, 7)))).sort();
        const isSingleMonth = transactionMonths.length === 1;
        const targetMonth = isSingleMonth ? transactionMonths[0] : currentMonthStr;

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
        const previousMonths = months.filter(m => m < targetMonth);
        const currentMonthExpenses = monthlySpending[targetMonth] || {};

        // If viewing range, aggregate all expenses
        const totalExpensesByCat: Record<string, number> = {};
        if (!isSingleMonth) {
            transactions.filter(t => t.type === "expense").forEach(t => {
                totalExpensesByCat[t.category] = (totalExpensesByCat[t.category] || 0) + t.amount;
            });
        }

        const categoryInsights: SpendingInsight[] = categories.map(cat => {
            const currentAmount = isSingleMonth ? (currentMonthExpenses[cat.id] || 0) : (totalExpensesByCat[cat.id] || 0);

            // Calculate average for previous months or use budget
            let totalPrevious = 0;
            let monthsWithSpending = 0;

            previousMonths.forEach(m => {
                if (monthlySpending[m] && monthlySpending[m][cat.id] !== undefined) {
                    totalPrevious += monthlySpending[m][cat.id];
                    monthsWithSpending++;
                }
            });

            // Adjust comparison based on period length
            let averageAmount = cat.monthlyBudget || (monthsWithSpending > 0 ? totalPrevious / monthsWithSpending : 0);
            if (!isSingleMonth && transactionMonths.length > 0) {
                averageAmount = averageAmount * transactionMonths.length;
            }

            let percentageChange = 0;
            if (averageAmount > 0) {
                percentageChange = ((currentAmount - averageAmount) / averageAmount) * 100;
            } else if (currentAmount > 0) {
                percentageChange = 100;
            }

            let type: "increase" | "decrease" | "stable" = "stable";
            if (percentageChange > 5) type = "increase";
            else if (percentageChange < -5) type = "decrease";

            const isUnusual = percentageChange > 20;

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

        return categoryInsights.sort((a, b) => Math.abs(b.percentageChange) - Math.abs(a.percentageChange));

    }, [transactions, categories]);

    const healthScore = useMemo(() => {
        if (transactions.length === 0) return 100;

        const transactionMonths = Array.from(new Set(transactions.map(t => t.date.slice(0, 7))));
        const numMonths = Math.max(1, transactionMonths.length);

        // 1. Budget Compliance (40% weight)
        const categoriesWithBudgets = categories.filter(c => (c.monthlyBudget || 0) > 0);
        let budgetScore = 100;

        if (categoriesWithBudgets.length > 0) {
            let weightedOverbudget = 0;
            let totalBudgets = 0;

            categoriesWithBudgets.forEach(cat => {
                const current = insights.find(i => i.categoryId === cat.id)?.currentAmount || 0;
                const budget = (cat.monthlyBudget || 0) * numMonths;
                totalBudgets += budget;
                if (current > budget) {
                    weightedOverbudget += (current - budget);
                }
            });

            const overbudgetRatio = totalBudgets > 0 ? weightedOverbudget / totalBudgets : 0;
            // Use a smoother penalty
            budgetScore = Math.max(0, 100 - (overbudgetRatio * 120));
        }

        // 2. Savings Rate / Balance Health (40% weight - Increased)
        // Uses monthlySalary if actual entries are missing (Projected Income)
        const actualIncome = transactions
            .filter(t => t.type === "income")
            .reduce((acc, t) => acc + t.amount, 0);

        const projectedIncome = Math.max(actualIncome, monthlySalary * numMonths);
        const totalExpenses = transactions
            .filter(t => t.type === "expense")
            .reduce((acc, t) => acc + t.amount, 0);

        let savingsScore = 100;
        if (projectedIncome > 0) {
            const expenseRatio = totalExpenses / projectedIncome;
            // Ideal is spending <= 70% of income. 
            // 70%-100% is safe but lower score. >100% is critical.
            if (expenseRatio <= 0.5) savingsScore = 100;
            else if (expenseRatio <= 0.7) savingsScore = 90;
            else if (expenseRatio <= 1.0) {
                savingsScore = 90 - (expenseRatio - 0.7) * 200; // 90 to 30
            } else {
                savingsScore = Math.max(0, 30 - (expenseRatio - 1.0) * 100); // Below 30
            }
        } else if (totalExpenses > 0) {
            savingsScore = 20; // Spending with no registered or projected income
        }

        // 3. Trend Stability (20% weight - Reduced)
        const totalAverage = insights.reduce((acc, i) => acc + i.averageAmount, 0);
        const totalCurrent = insights.reduce((acc, i) => acc + i.currentAmount, 0);

        let trendScore = 100;
        if (totalAverage > 0) {
            const trendRatio = totalCurrent / totalAverage;
            if (trendRatio > 1.05) {
                trendScore = Math.max(0, 100 - (trendRatio - 1.05) * 150);
            }
        }

        // Final Adaptive Weighted Score
        // If there are no budgets set, redistribute weights to Savings and Trend
        const hasBudgets = categoriesWithBudgets.length > 0;
        const weights = hasBudgets
            ? { budget: 0.4, savings: 0.4, trend: 0.2 }
            : { budget: 0, savings: 0.7, trend: 0.3 };

        const finalScore = (budgetScore * weights.budget) + (savingsScore * weights.savings) + (trendScore * weights.trend);
        return Math.round(Math.max(0, Math.min(100, finalScore)));
    }, [transactions, categories, insights, monthlySalary]);

    return {
        insights,
        healthScore,
        unusualIncreases: insights.filter(i => i.isUnusual),
        topSpendingIncreases: insights.filter(i => i.type === "increase").slice(0, 3)
    };
}
