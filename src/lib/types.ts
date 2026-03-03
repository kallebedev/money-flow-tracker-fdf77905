export type TransactionType = "income" | "expense";

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  category: string;
  date: string; // ISO string
  description: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string; // lucide icon name
  color: string; // tailwind color token
}

export interface FinancialGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string; // ISO string
}

export interface MonthlyBudget {
  categoryId: string;
  limit: number;
  month: string; // YYYY-MM
}

export const DEFAULT_CATEGORIES: Category[] = [
  { id: "alimentacao", name: "Alimentação", icon: "UtensilsCrossed", color: "chart-1" },
  { id: "transporte", name: "Transporte", icon: "Car", color: "chart-2" },
  { id: "moradia", name: "Moradia", icon: "Home", color: "chart-3" },
  { id: "lazer", name: "Lazer", icon: "Gamepad2", color: "chart-4" },
  { id: "saude", name: "Saúde", icon: "Heart", color: "chart-5" },
  { id: "educacao", name: "Educação", icon: "GraduationCap", color: "chart-6" },
  { id: "investimentos", name: "Investimentos", icon: "TrendingUp", color: "chart-7" },
  { id: "outros", name: "Outros", icon: "MoreHorizontal", color: "chart-8" },
];
