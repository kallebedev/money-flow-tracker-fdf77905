import { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Transaction, Category, FinancialGoal, DEFAULT_CATEGORIES } from "@/lib/types";
import { toast } from "sonner";

export function useFinanceData() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Transactions Query
  const { data: transactions = [] } = useQuery({
    queryKey: ["transactions", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", user.id)
        .order("date", { ascending: false });

      if (error) throw error;

      // Map database snake_case to frontend camelCase if necessary
      return (data || []).map(t => ({
        id: t.id,
        type: t.type,
        amount: Number(t.amount),
        category: t.category_id, // Map category_id to category
        date: t.date,
        description: t.description
      })) as Transaction[];
    },
    enabled: !!user,
  });

  // Categories Query (User + Default)
  const { data: userCategories = [] } = useQuery({
    queryKey: ["categories", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("user_id", user.id);

      if (error) throw error;
      return data as Category[];
    },
    enabled: !!user,
  });

  const categories = useMemo(() => [...DEFAULT_CATEGORIES, ...userCategories], [userCategories]);

  // Goals Query
  const { data: goals = [] } = useQuery({
    queryKey: ["goals", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("goals")
        .select("*")
        .eq("user_id", user.id);

      if (error) throw error;

      return (data || []).map(g => ({
        id: g.id,
        name: g.name,
        targetAmount: Number(g.target_amount),
        currentAmount: Number(g.current_amount),
        deadline: g.deadline
      })) as FinancialGoal[];
    },
    enabled: !!user,
  });

  // Mutations
  const addTransactionMutation = useMutation({
    mutationFn: async (t: Omit<Transaction, "id">) => {
      const { data, error } = await supabase
        .from("transactions")
        .insert([{
          type: t.type,
          amount: t.amount,
          category_id: t.category, // Map category to category_id
          date: t.date,
          description: t.description,
          user_id: user?.id
        }])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      toast.success("Transação adicionada");
    },
  });

  const updateTransactionMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Transaction> }) => {
      const updateData: any = {};
      if (data.type) updateData.type = data.type;
      if (data.amount !== undefined) updateData.amount = data.amount;
      if (data.category) updateData.category_id = data.category;
      if (data.date) updateData.date = data.date;
      if (data.description !== undefined) updateData.description = data.description;

      const { error } = await supabase
        .from("transactions")
        .update(updateData)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["transactions"] }),
  });

  const deleteTransactionMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("transactions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["transactions"] }),
  });

  // Categories Mutations
  const addCategoryMutation = useMutation({
    mutationFn: async (c: Omit<Category, "id">) => {
      const { data, error } = await supabase
        .from("categories")
        .insert([{ ...c, user_id: user?.id }])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["categories"] }),
  });

  const updateCategoryMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Category> }) => {
      const { error } = await supabase
        .from("categories")
        .update(data)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["categories"] }),
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("categories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["categories"] }),
  });

  // Goals Mutations
  const addGoalMutation = useMutation({
    mutationFn: async (g: Omit<FinancialGoal, "id">) => {
      const { data, error } = await supabase
        .from("goals")
        .insert([{
          name: g.name,
          target_amount: g.targetAmount,
          current_amount: g.currentAmount,
          deadline: g.deadline,
          user_id: user?.id
        }])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      toast.success("Meta adicionada");
    },
  });

  const updateGoalMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<FinancialGoal> }) => {
      const updateData: any = {};
      if (data.name) updateData.name = data.name;
      if (data.targetAmount !== undefined) updateData.target_amount = data.targetAmount;
      if (data.currentAmount !== undefined) updateData.current_amount = data.currentAmount;
      if (data.deadline !== undefined) updateData.deadline = data.deadline;

      const { error } = await supabase
        .from("goals")
        .update(updateData)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["goals"] }),
  });

  const deleteGoalMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("goals").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["goals"] }),
  });

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
    addTransaction: addTransactionMutation.mutate,
    updateTransaction: (id: string, data: Partial<Transaction>) => updateTransactionMutation.mutate({ id, data }),
    deleteTransaction: deleteTransactionMutation.mutate,
    addCategory: (c: Omit<Category, "id">) => addCategoryMutation.mutate(c),
    updateCategory: (id: string, data: Partial<Category>) => updateCategoryMutation.mutate({ id, data }),
    deleteCategory: (id: string) => deleteCategoryMutation.mutate(id),
    addGoal: addGoalMutation.mutate,
    updateGoal: (id: string, data: Partial<FinancialGoal>) => updateGoalMutation.mutate({ id, data }),
    deleteGoal: deleteGoalMutation.mutate,
    monthlyTransactions,
    totalIncome,
    totalExpense,
    balance,
    savings,
    currentMonth,
    isLoading: addTransactionMutation.isPending || updateTransactionMutation.isPending || deleteTransactionMutation.isPending,
  };
}
