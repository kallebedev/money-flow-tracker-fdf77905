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
  /** ISO date-time; omit for tasks without a scheduled time */
  scheduledStartTime?: string | null;
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
  type: 'annual' | 'monthly' | 'daily';
  /** Para metas diárias recorrentes pode ser omitido */
  targetDate?: string;
  youtubeLink?: string;
  youtubeTimestamp?: number;
  progress?: number;
  notes?: string;
  status: 'pending' | 'achieved' | 'failed';
};

export type DocItem = {
  id: string;
  name: string;
  type: 'file' | 'folder';
  content?: string;
  parentId: string | null;
  createdAt: number;
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
  deadline?: string | null; // ISO string, opcional
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
  { id: "outros", name: "Outros", icon: "MoreHorizontal", color: "chart-9" },
];

export type Medal = {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt: string;
};

export type UserStats = {
  userId: string;
  level: number;
  experience: number;
  points: number;
  streakCurrent: number;
  streakMax: number;
  medals: Medal[];
  totalFocusMinutes: number;
  lastActiveDate: string;
  updatedAt: string;
};
