export type TransactionType = "income" | "expense";

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  category: string;
  date: string; // ISO string
  description: string;
  paymentMethod?: "pix" | "cartao";
}

export interface Category {
  id: string;
  name: string;
  icon: string; // lucide icon name
  color: string; // tailwind color token
  monthlyBudget?: number; // Manual budget limit
}

export interface UserProfile {
  id: string;
  monthlySalary: number;
}

export type FinancialAccount = {
  id: string;
  name: string;
  type: 'checking' | 'savings' | 'investment' | 'credit';
  balance: number;
  lastUpdated: string;
  color?: string;
  userId: string;
};

export type TaskStatus = 'todo' | 'in-progress' | 'completed' | 'delayed';

export type ProductivityTask = {
  id: string;
  title: string;
  description?: string;
  impact: number;
  urgency: number;
  estimatedDuration: number;
  scheduledStartTime: string;
  status: TaskStatus;
  createdAt: string;
  projectId?: string;
  isTopThree?: boolean;
};

export type Project = {
  id: string;
  name: string;
  description?: string;
  color: string;
  deadline?: string;
  status: 'active' | 'completed' | 'on-hold';
};

export type Goal = {
  id: string;
  title: string;
  type: 'annual' | 'monthly';
  targetDate: string;
  status: 'pending' | 'achieved' | 'failed';
};

export type PersonalLog = {
  id: string;
  date: string;
  energyLevel: number; // 1-10
  mood: number; // 1-10
  journal?: string;
};

export type FocusSession = {
  id: string;
  taskId?: string;
  startTime: string;
  duration: number; // total focus time in minutes
  type: 'pomodoro' | 'deep-work';
};

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
  { id: "cartao", name: "Fatura do Cartão", icon: "CreditCard", color: "chart-8" },
  { id: "outros", name: "Outros", icon: "MoreHorizontal", color: "chart-9" },
];
