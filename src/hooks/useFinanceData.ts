import { useState, useCallback, useMemo } from "react";
import { Transaction, Category, FinancialGoal, DEFAULT_CATEGORIES } from "@/lib/types";

function loadFromLS<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveToLS(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function useFinanceData() {
  const [transactions, setTransactions] = useState<Transaction[]>(() =>
    loadFromLS("mf_transactions", [])
  );
  const [categories, setCategories] = useState<Category[]>(() =>
    loadFromLS("mf_categories", DEFAULT_CATEGORIES)
  );
  const [goals, setGoals] = useState<FinancialGoal[]>(() =>
    loadFromLS("mf_goals", [])
  );

  // Transactions
  const addTransaction = useCallback((t: Omit<Transaction, "id">) => {
    const newT = { ...t, id: crypto.randomUUID() };
    setTransactions((prev) => {
      const next = [newT, ...prev];
      saveToLS("mf_transactions", next);
      return next;
    });
  }, []);

  const updateTransaction = useCallback((id: string, data: Partial<Transaction>) => {
    setTransactions((prev) => {
      const next = prev.map((t) => (t.id === id ? { ...t, ...data } : t));
      saveToLS("mf_transactions", next);
      return next;
    });
  }, []);

  const deleteTransaction = useCallback((id: string) => {
    setTransactions((prev) => {
      const next = prev.filter((t) => t.id !== id);
      saveToLS("mf_transactions", next);
      return next;
    });
  }, []);

  // Categories
  const addCategory = useCallback((c: Omit<Category, "id">) => {
    const newC = { ...c, id: crypto.randomUUID() };
    setCategories((prev) => {
      const next = [...prev, newC];
      saveToLS("mf_categories", next);
      return next;
    });
  }, []);

  const updateCategory = useCallback((id: string, data: Partial<Category>) => {
    setCategories((prev) => {
      const next = prev.map((c) => (c.id === id ? { ...c, ...data } : c));
      saveToLS("mf_categories", next);
      return next;
    });
  }, []);

  const deleteCategory = useCallback((id: string) => {
    setCategories((prev) => {
      const next = prev.filter((c) => c.id !== id);
      saveToLS("mf_categories", next);
      return next;
    });
  }, []);

  // Goals
  const addGoal = useCallback((g: Omit<FinancialGoal, "id">) => {
    const newG = { ...g, id: crypto.randomUUID() };
    setGoals((prev) => {
      const next = [...prev, newG];
      saveToLS("mf_goals", next);
      return next;
    });
  }, []);

  const updateGoal = useCallback((id: string, data: Partial<FinancialGoal>) => {
    setGoals((prev) => {
      const next = prev.map((g) => (g.id === id ? { ...g, ...data } : g));
      saveToLS("mf_goals", next);
      return next;
    });
  }, []);

  const deleteGoal = useCallback((id: string) => {
    setGoals((prev) => {
      const next = prev.filter((g) => g.id !== id);
      saveToLS("mf_goals", next);
      return next;
    });
  }, []);

  // Computed
  const currentMonth = new Date().toISOString().slice(0, 7);

  const monthlyTransactions = useMemo(
    () => transactions.filter((t) => t.date.startsWith(currentMonth)),
    [transactions, currentMonth]
  );

  const totalIncome = useMemo(
    () => monthlyTransactions.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0),
    [monthlyTransactions]
  );

  const totalExpense = useMemo(
    () => monthlyTransactions.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0),
    [monthlyTransactions]
  );

  const balance = useMemo(
    () => transactions.reduce((s, t) => s + (t.type === "income" ? t.amount : -t.amount), 0),
    [transactions]
  );

  const savings = totalIncome - totalExpense;

  return {
    transactions,
    categories,
    goals,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    addCategory,
    updateCategory,
    deleteCategory,
    addGoal,
    updateGoal,
    deleteGoal,
    monthlyTransactions,
    totalIncome,
    totalExpense,
    balance,
    savings,
    currentMonth,
  };
}
