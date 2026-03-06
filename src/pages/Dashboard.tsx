import { useMemo, useState } from "react";
import { useFinance } from "@/contexts/FinanceContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  PiggyBank,
  TrendingDown,
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  ArrowUpRight,
  ArrowDownRight,
  Target,
  Lightbulb,
  Tag,
  ArrowRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PieChart, Pie, Cell, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { format, parseISO, subMonths, isAfter, startOfMonth, isBefore, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { TransactionType } from "@/lib/types";
import { toast } from "sonner";
import { useNavigate, Link } from "react-router-dom";
import { SpendingAnalysis } from "@/components/SpendingAnalysis";
import { useSpendingAnalysis } from "@/hooks/useSpendingAnalysis";
import { useAIBudgetAdvisor } from "@/hooks/useAIBudgetAdvisor";
import { ReportExportButton } from "@/components/ReportExportButton";

const CHART_COLORS = [
  "hsl(142, 72%, 40%)",
  "hsl(217, 91%, 53%)",
  "hsl(38, 92%, 50%)",
  "hsl(280, 60%, 55%)",
  "hsl(340, 75%, 55%)",
  "hsl(180, 60%, 45%)",
  "hsl(25, 95%, 53%)",
  "hsl(260, 60%, 48%)",
];

function formatCurrency(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const emptyForm = {
  type: "expense" as TransactionType,
  amount: "",
  category: "",
  date: new Date().toISOString().slice(0, 10),
  description: "",
  paymentMethod: "pix" as "pix" | "cartao"
};

export default function Dashboard() {
  const { balance, transactions, categories, addTransaction } = useFinance();
  const navigate = useNavigate();
  const advisor = useAIBudgetAdvisor();
  const [range, setRange] = useState("current");
  const [startDate, setStartDate] = useState(format(subMonths(new Date(), 1), "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const handleSave = () => {
    const amount = parseFloat(form.amount);
    if (!amount || !form.description) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }
    if (form.type === "expense" && !form.category) {
      toast.error("Por favor, selecione uma categoria para a despesa");
      return;
    }
    addTransaction({
      type: form.type,
      amount,
      category: form.type === "expense" ? form.category : null,
      date: form.date,
      description: form.description,
      paymentMethod: form.type === "expense" ? form.paymentMethod : "pix"
    });
    toast.success("Transação adicionada!");
    setOpen(false);
    setForm(emptyForm);
  };

  const filteredTransactions = useMemo(() => {
    const now = new Date();
    switch (range) {
      case "current":
        return transactions.filter(t => t.date.startsWith(format(now, "yyyy-MM")));
      case "3months":
        return transactions.filter(t => isAfter(parseISO(t.date), subMonths(startOfMonth(now), 2)));
      case "6months":
        return transactions.filter(t => isAfter(parseISO(t.date), subMonths(startOfMonth(now), 5)));
      case "custom":
        return transactions.filter(t => {
          const tDate = parseISO(t.date);
          return isAfter(tDate, parseISO(startDate)) && isBefore(tDate, endOfDay(parseISO(endDate)));
        });
      default:
        return transactions;
    }
  }, [transactions, range, startDate, endDate]);

  const { healthScore, unusualIncreases } = useSpendingAnalysis(filteredTransactions);

  const totalExpense = useMemo(
    () => filteredTransactions
      .filter((t) => t.type === "expense" && t.category !== "cartao")
      .reduce((s, t) => s + t.amount, 0),
    [filteredTransactions]
  );

  const expenseByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    filteredTransactions
      .filter((t) => t.type === "expense")
      .forEach((t) => {
        map[t.category] = (map[t.category] || 0) + t.amount;
      });
    return Object.entries(map).map(([catId, value]) => ({
      name: categories.find((c) => c.id === catId)?.name || catId,
      value,
    }));
  }, [filteredTransactions, categories]);

  const monthlyEvolution = useMemo(() => {
    const months: string[] = [];
    for (let i = 5; i >= 0; i--) {
      months.push(format(subMonths(new Date(), i), "yyyy-MM"));
    }
    return months.map((m) => {
      const mTrans = transactions.filter((t) => t.date.startsWith(m));
      const inc = mTrans.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
      const exp = mTrans.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
      return {
        month: format(parseISO(m + "-01"), "MMM", { locale: ptBR }),
        receitas: inc,
        despesas: exp,
      };
    });
  }, [transactions]);

  const lastTransactions = filteredTransactions.slice(0, 5);

  return (
    <div className="w-full mx-auto py-12 space-y-12 animate-fade-up">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl md:text-title text-[#f0f0f0]">Financial Hub</h1>
          <p className="text-[13px] md:text-[15px] text-[#555] font-light">Gerencie suas finanças e produtividade em um só lugar</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <ReportExportButton
            transactions={transactions}
            categories={categories}
            globalBalance={balance}
          />
          <Select value={range} onValueChange={setRange}>
            <SelectTrigger className="w-full md:w-[160px] bg-[#111] border-white/[0.03] text-[#888] h-10 text-[14px] rounded-lg">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent className="bg-[#111] border-white/[0.08] text-[#f0f0f0] rounded-lg">
              <SelectItem value="current">Mês Atual</SelectItem>
              <SelectItem value="3months">Últimos 3 Meses</SelectItem>
              <SelectItem value="6months">Últimos 6 Meses</SelectItem>
              <SelectItem value="all">Todo o Período</SelectItem>
              <SelectItem value="custom">Personalizado</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {range === "custom" && (
        <div className="p-6 bg-[#111] border border-white/[0.03] rounded-xl flex gap-6 items-end">
          <div className="space-y-2">
            <Label className="text-label">Início</Label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-[#0a0a0a] border-white/[0.03] text-[#f0f0f0] h-10 rounded-lg text-[13px]"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-label">Fim</Label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-[#0a0a0a] border-white/[0.03] text-[#f0f0f0] h-10 rounded-lg text-[13px]"
            />
          </div>
        </div>
      )}

      {/* KPI Strip: 1px Grid Layout */}
      <div className="rounded-xl overflow-hidden border border-white/[0.03] bg-white/[0.03] grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px">
        {/* Card Saldo Total */}
        <div className="bg-[#111] p-7 pb-6 transition-colors hover:bg-[#161616]">
          <p className="text-label mb-3.5">Saldo Total</p>
          <div className="flex items-center gap-3">
            <span className="text-value-mono text-[#f0f0f0]">
              {balance.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </span>
            <span className="inline-flex py-0.5 px-2 rounded-sm bg-[#22c55e]/10 text-[#22c55e] text-[10px] font-bold">
              ↑ 12.5%
            </span>
          </div>
          <p className="text-[12px] text-[#555] mt-4 font-light">Atualizado agora</p>
        </div>

        {/* Card Despesas */}
        <div className="bg-[#111] p-7 pb-6 transition-colors hover:bg-[#161616]">
          <p className="text-label mb-3.5">Despesas do Mês</p>
          <div className="flex items-center gap-3">
            <span className="text-value-mono text-[#f0f0f0]">
              {totalExpense.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </span>
            <span className="inline-flex py-0.5 px-2 rounded-sm bg-[#ef4444]/10 text-[#ef4444] text-[10px] font-bold">
              ↓ 3.2%
            </span>
          </div>
          <p className="text-[11px] text-[#555] mt-4 font-light">Nível de gastos baixo</p>
        </div>

        {/* Card Saúde Financeira */}
        <div className="bg-[#111] p-7 pb-6 transition-colors hover:bg-[#161616]">
          <p className="text-label mb-3.5">Saúde Financeira</p>
          <div className="space-y-3">
            <span className="font-mono-numbers text-[36px] text-[#f59e0b] leading-none">
              {healthScore.toFixed(0)}
            </span>
            <div className="h-[2px] w-full bg-white/[0.04] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#f59e0b] transition-all duration-1000"
                style={{ width: `${healthScore}%` }}
              />
            </div>
          </div>
          <p className="text-[11px] text-[#555] mt-2 font-light">Pontos de saúde</p>
        </div>

        {/* Card Dica IA */}
        <div className="bg-[#111] p-7 pb-6 transition-colors hover:bg-[#161616]">
          <div className="flex items-center gap-2 mb-3.5">
            <div className="h-1.5 w-1.5 rounded-full bg-[#22c55e]" />
            <p className="text-[11px] uppercase tracking-[0.08em] font-medium text-[#22c55e]">Dica da IA</p>
          </div>
          <p className="text-[12px] font-light text-[#888] leading-relaxed line-clamp-3">
            {unusualIncreases[0]?.categoryName ? `Atenção aos gastos em ${unusualIncreases[0].categoryName}! Considere reduzir as despesas nesta categoria.` : "Analise seus gastos fixos para identificar oportunidades de economia este mês."}
          </p>
        </div>
      </div>

      {/* Category Grid: 6 columns, 1px Divider */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-label">Analise de Gastos</h2>
          <Link to="/analysis" className="text-[11px] font-medium text-[#22c55e] hover:opacity-80 transition-opacity flex items-center gap-1 group">
            Ver detalhes <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
        <div className="rounded-xl overflow-hidden border border-white/[0.03] bg-white/[0.03] grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-px">
          {categories.map((cat, i) => {
            const spent = filteredTransactions
              .filter(t => t.type === "expense" && t.category === cat.id)
              .reduce((s, t) => s + t.amount, 0);
            const budget = cat.monthlyBudget || 0;
            const usage = budget > 0 ? (spent / budget) * 100 : 0;

            return (
              <div key={cat.id} className="bg-[#111] p-6 transition-colors hover:bg-[#161616] flex flex-col justify-between min-h-[160px]">
                <div className="space-y-4">
                  <div className="w-8 h-8 rounded-[8px] flex items-center justify-center" style={{ backgroundColor: `rgba(34,197,94,0.12)`, color: `#22c55e` }}>
                    <Tag className="w-5 h-5 text-primary" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-label truncate">{cat.name}</p>
                    <p className="font-mono-numbers text-[18px] text-[#f0f0f0]">
                      {spent.toLocaleString("pt-BR")}
                    </p>
                  </div>
                </div>
                <div className="space-y-2 mt-4">
                  <div className="flex justify-between text-[11px] text-[#555]">
                    <span>{usage.toFixed(0)}% do orçamento</span>
                  </div>
                  <div className="h-px w-full bg-white/[0.04]">
                    <div
                      className="h-full bg-[#22c55e] transition-all duration-1000"
                      style={{ width: `${Math.min(usage, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Panels: 2 columns, 1px divider */}
      <div className="rounded-xl overflow-hidden border border-white/[0.03] bg-white/[0.03] grid grid-cols-1 lg:grid-cols-[1fr_1.6fr] gap-px">
        {/* Donut Chart Panel */}
        <div className="bg-[#111] p-10 space-y-10">
          <div className="flex items-center justify-between">
            <h2 className="text-label">Despesas por Categoria</h2>
          </div>
          <div className="flex flex-col items-center gap-10">
            <div className="relative h-[180px] w-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={expenseByCategory}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={85}
                    paddingAngle={0}
                    stroke="none"
                  >
                    {expenseByCategory.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[10px] text-[#555] font-medium uppercase tracking-widest mt-1">Total</span>
                <span className="font-mono-numbers text-[20px] text-[#f0f0f0] tracking-tighter">
                  R$ {totalExpense.toFixed(0)}
                </span>
              </div>
            </div>

            {/* Legend Rows with 1px border */}
            <div className="w-full border border-white/[0.06] rounded-lg overflow-hidden bg-white/[0.06] grid gap-px">
              {expenseByCategory.slice(0, 4).map((e, i) => (
                <div key={e.name} className="bg-[#111] px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                    <span className="text-[12px] text-[#888]">{e.name}</span>
                  </div>
                  <span className="font-mono-numbers text-[12px] text-[#f0f0f0]">R$ {e.value.toFixed(0)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Area Chart Panel */}
        <div className="bg-[#111] p-10 space-y-10">
          <div className="flex items-center justify-between">
            <h2 className="text-label">Evolução Mensal</h2>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="h-[1px] w-4 bg-[#22c55e]" />
                <span className="text-[12px] text-[#555]">Receitas</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-[1px] w-4 bg-[#ef4444]" />
                <span className="text-[12px] text-[#555]">Despesas</span>
              </div>
            </div>
          </div>
          <div className="h-[300px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyEvolution}>
                <defs>
                  <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.12} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.08} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.03)" strokeDasharray="3 3" />
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: '#555' }}
                  dy={15}
                />
                <YAxis hide />
                <Tooltip
                  contentStyle={{ backgroundColor: '#111', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px' }}
                  itemStyle={{ fontSize: '12px', fontFamily: 'DM Mono' }}
                />
                <Area
                  type="monotone"
                  dataKey="receitas"
                  stroke="#22c55e"
                  strokeWidth={1.5}
                  fillOpacity={1}
                  fill="url(#colorIncome)"
                />
                <Area
                  type="monotone"
                  dataKey="despesas"
                  stroke="#ef4444"
                  strokeWidth={1.5}
                  fillOpacity={1}
                  fill="url(#colorExpense)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Last Transactions: Full width, border 1px, 12px radius */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-label">Últimas Transações</h2>
          <button
            onClick={() => navigate("/transactions")}
            className="text-[11px] font-medium text-[#555] hover:text-[#f0f0f0] transition-colors"
          >
            Ver todas →
          </button>
        </div>

        <div className="border border-white/[0.06] rounded-[12px] overflow-hidden bg-[#111]">
          {lastTransactions.length === 0 ? (
            <div className="p-20 text-center">
              <p className="text-[13px] text-[#555] font-light italic">Nenhuma transação registrada</p>
            </div>
          ) : (
            lastTransactions.map((t, i) => {
              const cat = categories.find((c) => c.id === t.category);
              const isIncome = t.type === "income";
              return (
                <div
                  key={t.id}
                  className={cn(
                    "flex items-center justify-between px-6 py-4 transition-colors hover:bg-[#161616]",
                    i !== lastTransactions.length - 1 && "border-b border-white/[0.06]"
                  )}
                >
                  <div className="flex items-center gap-5">
                    <div className={cn(
                      "h-9 w-9 rounded-[9px] flex items-center justify-center",
                      isIncome ? "bg-[#22c55e]/10 text-[#22c55e]" : "bg-[#ef4444]/10 text-[#ef4444]"
                    )}>
                      {isIncome ? <PiggyBank className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
                    </div>
                    <div className="space-y-1">
                      <p className="text-[14px] font-medium text-[#f0f0f0] tracking-tight">{t.description}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-[12px] text-[#555] font-light">{cat?.name || t.category}</span>
                        <span className="text-[12px] text-[#333]">•</span>
                        <span className="text-[12px] text-[#555] font-light">{format(parseISO(t.date), "dd MMM", { locale: ptBR })}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right space-y-1">
                    <p className={cn(
                      "font-mono-numbers text-[14px]",
                      isIncome ? "text-[#22c55e]" : "text-[#ef4444]"
                    )}>
                      {isIncome ? "+" : "-"}{t.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-[10px] uppercase tracking-[0.05em] text-[#555] font-medium">Confirmado</p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* FAB: Fixed bottom-right 32px, 44x44px, 12px radius */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button
            className="fixed bottom-8 right-8 h-14 rounded-full px-6 bg-[#22c55e] hover:bg-[#22c55e]/85 shadow-[0_8px_32px_rgba(34,197,94,0.25)] z-50 transition-transform hover:scale-[1.05] active:scale-95 text-[#0a0a0a] font-bold"
          >
            <Plus className="mr-2 h-6 w-6" />Nova Transação
          </Button>
        </DialogTrigger>
        <DialogContent className="bg-[#111] border-white/[0.08] text-[#f0f0f0] rounded-xl shadow-2xl">
          <DialogHeader><DialogTitle className="text-title text-[#f0f0f0]">Nova Transação</DialogTitle></DialogHeader>
          <div className="space-y-6 py-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-label">Tipo</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as TransactionType })}>
                  <SelectTrigger className="bg-[#0a0a0a] border-white/[0.06] text-[#f0f0f0] h-10 rounded-lg"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-[#111] border-white/[0.08] text-[#f0f0f0] rounded-lg">
                    <SelectItem value="income">Receita</SelectItem>
                    <SelectItem value="expense">Despesa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-label">Valor (R$)</Label>
                <Input type="number" min="0" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="0,00" className="bg-[#0a0a0a] border-white/[0.06] text-[#f0f0f0] h-10 rounded-lg font-mono-numbers" />
              </div>
            </div>

            <div className={cn("grid gap-4", form.type === "expense" ? "grid-cols-2" : "grid-cols-1")}>
              {form.type === "expense" && (
                <>
                  <div className="space-y-2">
                    <Label className="text-label">Pagamento</Label>
                    <Select
                      value={form.paymentMethod}
                      onValueChange={(v: "pix" | "cartao") => {
                        setForm({ ...form, paymentMethod: v });
                      }}
                    >
                      <SelectTrigger className="bg-[#0a0a0a] border-white/[0.06] text-[#f0f0f0] h-10 rounded-lg"><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-[#111] border-white/[0.08] text-[#f0f0f0] rounded-lg">
                        <SelectItem value="pix">Pix</SelectItem>
                        <SelectItem value="cartao">Cartão de Crédito</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-label">Categoria</Label>
                    <Select
                      value={form.category}
                      onValueChange={(v) => setForm({ ...form, category: v })}
                    >
                      <SelectTrigger className="bg-[#0a0a0a] border-white/[0.06] text-[#f0f0f0] h-10 rounded-lg">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#111] border-white/[0.08] text-[#f0f0f0] rounded-lg">
                        {categories.map((c) => (
                          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-label">Data</Label>
                <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="bg-[#0a0a0a] border-white/[0.06] text-[#f0f0f0] h-10 rounded-lg" />
              </div>
              <div className="space-y-2">
                <Label className="text-label">Descrição</Label>
                <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Ex: Mercado" className="bg-[#0a0a0a] border-white/[0.06] text-[#f0f0f0] h-10 rounded-lg" />
              </div>
            </div>
          </div>
          <DialogFooter className="gap-3">
            <Button variant="ghost" onClick={() => setOpen(false)} className="text-[#555] hover:text-[#f0f0f0] font-medium">Cancelar</Button>
            <Button onClick={handleSave} className="bg-[#22c55e] hover:bg-[#22c55e]/85 text-[#0a0a0a] font-bold px-8 rounded-lg">Salvar Transação</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
