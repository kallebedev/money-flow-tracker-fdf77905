import { useMemo } from "react";
import { useFinance } from "@/contexts/FinanceContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Wallet, PiggyBank, ArrowUpRight, ArrowDownRight, Sun, Moon, Plus, MoreHorizontal } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { cn } from "@/lib/utils";
import { format, parseISO, subMonths, isAfter, startOfMonth, isBefore, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { TransactionType } from "@/lib/types";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { SpendingAnalysis, HealthScoreCard, AITipCard } from "@/components/SpendingAnalysis";
import { useSpendingAnalysis } from "@/hooks/useSpendingAnalysis";
import { useAIBudgetAdvisor } from "@/hooks/useAIBudgetAdvisor";
import { AIBudgetPlanner } from "@/components/AIBudgetPlanner";
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

  const { healthScore, insights } = useSpendingAnalysis(filteredTransactions);

  const totalIncome = useMemo(
    () => filteredTransactions.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0),
    [filteredTransactions]
  );

  const totalExpense = useMemo(
    () => filteredTransactions
      .filter((t) => t.type === "expense" && t.paymentMethod !== "cartao")
      .reduce((s, t) => s + t.amount, 0),
    [filteredTransactions]
  );

  const totalCardExpense = useMemo(
    () => filteredTransactions
      .filter((t) => t.type === "expense" && t.paymentMethod === "cartao")
      .reduce((s, t) => s + t.amount, 0),
    [filteredTransactions]
  );

  const savings = totalIncome - totalExpense;

  const reportRangeLabel = useMemo(() => {
    switch (range) {
      case "current": return "Mês Atual";
      case "3months": return "Últimos 3 Meses";
      case "6months": return "Últimos 6 Meses";
      case "all": return "Todo o Período";
      case "custom": return `${format(parseISO(startDate), "dd/MM/yyyy")} - ${format(parseISO(endDate), "dd/MM/yyyy")}`;
      default: return "";
    }
  }, [range, startDate, endDate]);

  const reportData = {
    transactions: filteredTransactions,
    categories,
    totalIncome,
    totalExpense,
    periodBalance: totalIncome - totalExpense,
    globalBalance: balance,
    healthScore,
    insights,
    advisorOverview: advisor?.overview,
    dateRange: {
      start: range === "custom" ? startDate : undefined,
      end: range === "custom" ? endDate : undefined,
      label: reportRangeLabel
    }
  };

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

  const cards = [
    { title: "Saldo Total", value: balance, icon: Wallet, trend: balance >= 0 },
    { title: "Despesas (mês)", value: totalExpense, icon: TrendingDown, trend: false },
  ];

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Bem-vindo de volta! Aqui está o resumo do seu mês.</p>
        </div>
        <div className="flex items-center gap-3">
          <ReportExportButton {...reportData} />
          <Select value={range} onValueChange={setRange}>
            <SelectTrigger className="w-full sm:w-[160px] bg-card border border-border text-foreground h-11 px-4 rounded-xl shadow-sm">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border text-popover-foreground">
              <SelectItem value="current">Mês Atual</SelectItem>
              <SelectItem value="3months">Últimos 3 Meses</SelectItem>
              <SelectItem value="6months">Últimos 6 Meses</SelectItem>
              <SelectItem value="all">Todo o Período</SelectItem>
              <SelectItem value="custom">Personalizado</SelectItem>
            </SelectContent>
          </Select>
          <AIBudgetPlanner />
        </div>
      </div>

      {range === "custom" && (
        <Card className="p-4 border bg-card border-border mb-6">
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-2">
              <Label htmlFor="start-date" className="text-xs text-muted-foreground">Data Início</Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full sm:w-auto h-10 bg-background/50 border-border text-foreground"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end-date" className="text-xs text-muted-foreground">Data Fim</Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full sm:w-auto h-10 bg-background/50 border-border text-foreground"
              />
            </div>
          </div>
        </Card>
      )}

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card Saldo Total */}
        <Card className="bg-primary/5 border border-primary/10 rounded-[32px] p-2 relative overflow-hidden group shadow-xl shadow-primary/5 transition-all duration-500 hover:shadow-primary/10 hover:-translate-y-1">
          <div className="absolute -right-4 -top-4 w-28 h-28 bg-primary/20 rounded-full blur-3xl transition-all duration-700 group-hover:scale-150 group-hover:opacity-40" />
          <CardContent className="pt-4 pb-3 relative z-10 flex flex-col">
            <div className="flex justify-between items-start mb-4">
              <div className="h-12 w-12 rounded-2xl bg-primary/20 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform duration-500 text-primary">
                <Wallet className="h-6 w-6" />
              </div>
              <div className="flex flex-col items-end">
                <span className="text-[10px] font-black uppercase tracking-widest text-primary/60 mb-0.5">Tendência</span>
                <span className="text-[11px] font-black text-emerald-500 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20 shadow-sm">+12.5%</span>
              </div>
            </div>
            <div className="space-y-0.5">
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider opacity-80">Saldo Total</p>
              <h3 className="text-3xl font-black text-foreground tracking-tighter group-hover:scale-[1.02] transition-transform origin-left">
                {formatCurrency(balance)}
              </h3>
            </div>
            <div className="mt-4 pt-4 flex items-center justify-between text-[9px] font-bold uppercase tracking-tight text-muted-foreground border-t border-primary/10">
              <span>Atualizado agora</span>
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
          </CardContent>
        </Card>

        {/* Card Despesas */}
        <Card className="bg-destructive/5 border border-destructive/10 rounded-[32px] p-2 relative overflow-hidden group shadow-xl shadow-destructive/5 transition-all duration-500 hover:shadow-destructive/10 hover:-translate-y-1">
          <div className="absolute -right-4 -top-4 w-28 h-28 bg-destructive/20 rounded-full blur-3xl transition-all duration-700 group-hover:scale-150 group-hover:opacity-40" />
          <CardContent className="pt-4 pb-3 relative z-10 flex flex-col">
            <div className="flex justify-between items-start mb-4">
              <div className="h-12 w-12 rounded-2xl bg-destructive/20 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform duration-500 text-destructive">
                <TrendingDown className="h-6 w-6" />
              </div>
              <div className="flex flex-col items-end">
                <span className="text-[10px] font-black uppercase tracking-widest text-destructive/60 mb-0.5">Impacto</span>
                <span className="text-[11px] font-black text-destructive bg-destructive/10 px-2.5 py-0.5 rounded-full border border-destructive/20 shadow-sm">-3.2%</span>
              </div>
            </div>
            <div className="space-y-0.5">
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider opacity-80">Despesas (mês)</p>
              <h3 className="text-3xl font-black text-foreground tracking-tighter group-hover:scale-[1.02] transition-transform origin-left">
                {formatCurrency(totalExpense)}
              </h3>
            </div>
            <div className="mt-4 pt-4 flex items-center justify-between text-[9px] font-bold uppercase tracking-tight text-muted-foreground border-t border-destructive/10">
              <span>Nível de gastos</span>
              <div className="flex gap-1.5">
                <div className="h-2.5 w-1.5 rounded-full bg-destructive shadow-[0_0_8px_rgba(239,68,68,0.4)]" />
                <div className="h-2.5 w-1.5 rounded-full bg-destructive/20" />
                <div className="h-2.5 w-1.5 rounded-full bg-destructive/20" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Relocated Cards */}
        <div className="h-full">
          <HealthScoreCard score={healthScore} />
        </div>
        <div className="h-full">
          <AITipCard />
        </div>
      </div>

      <SpendingAnalysis />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Pie chart */}
        <Card className="bg-card/30 backdrop-blur-sm border border-border/10 rounded-[32px] overflow-hidden shadow-2xl shadow-black/5">
          <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-border/5">
            <CardTitle className="text-lg font-black text-foreground tracking-tight uppercase">Despesas por Categoria</CardTitle>
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:bg-primary/10 rounded-xl"><MoreHorizontal className="h-4 w-4" /></Button>
          </CardHeader>
          <CardContent className="pt-6">
            {expenseByCategory.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-12">Nenhuma despesa este mês</p>
            ) : (
              <div className="flex flex-col md:flex-row items-center gap-10 py-2">
                <div className="relative h-[240px] w-[240px] shrink-0 group">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={expenseByCategory}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={75}
                        outerRadius={105}
                        paddingAngle={6}
                        stroke="none"
                        cornerRadius={8}
                      >
                        {expenseByCategory.map((_, i) => (
                          <Cell
                            key={i}
                            fill={CHART_COLORS[i % CHART_COLORS.length]}
                            className="hover:opacity-80 transition-opacity duration-300"
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'rgba(23, 23, 23, 0.9)',
                          backdropFilter: 'blur(12px)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          borderRadius: '16px',
                          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                        }}
                        itemStyle={{ color: '#fff', fontSize: '11px', fontWeight: 'bold' }}
                        formatter={(v: number) => formatCurrency(v)}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-sm font-black text-muted-foreground uppercase tracking-widest leading-none mb-1 opacity-60">Total</span>
                    <span className="text-2xl font-black text-foreground tracking-tighter group-hover:scale-110 transition-transform duration-500">{formatCurrency(totalExpense)}</span>
                  </div>
                </div>
                <div className="flex-1 space-y-4 w-full pr-4">
                  {expenseByCategory.slice(0, 5).map((e, i) => (
                    <div key={e.name} className="flex items-center justify-between group/item cursor-default">
                      <div className="flex items-center gap-3">
                        <div className="h-3 w-3 rounded-full shadow-sm group-hover/item:scale-125 transition-transform" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                        <span className="text-xs font-bold text-foreground/80 group-hover/item:text-foreground transition-colors">{e.name}</span>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-sm font-black text-foreground">{formatCurrency(e.value)}</span>
                        <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-tighter">
                          {((e.value / totalExpense) * 100).toFixed(0)}% do total
                        </span>
                      </div>
                    </div>
                  ))}
                  {expenseByCategory.length > 5 && (
                    <p className="text-[10px] text-center text-muted-foreground font-bold uppercase tracking-widest pt-2 opacity-50">+ {expenseByCategory.length - 5} outras categorias</p>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Area chart */}
        <Card className="bg-card/30 backdrop-blur-sm border border-border/10 rounded-[32px] overflow-hidden shadow-2xl shadow-black/5">
          <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-border/5">
            <CardTitle className="text-lg font-black text-foreground tracking-tight uppercase">Evolução Mensal</CardTitle>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="h-2 w-4 rounded-full bg-primary" />
                <span className="text-[10px] font-black uppercase text-muted-foreground tracking-wider leading-none">Receitas</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-4 rounded-full bg-destructive" />
                <span className="text-[10px] font-black uppercase text-muted-foreground tracking-wider leading-none">Despesas</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-8">
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={monthlyEvolution}>
                <defs>
                  <linearGradient id="colorReceitas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorDespesas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="hsl(var(--border))" strokeDasharray="3 3" opacity={0.1} />
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))', fontWeight: 'bold' }}
                  dy={15}
                  textAnchor="middle"
                />
                <YAxis hide />
                <Tooltip
                  cursor={{ stroke: 'hsl(var(--primary))', strokeWidth: 1, strokeDasharray: '4 4' }}
                  contentStyle={{
                    backgroundColor: 'rgba(23, 23, 23, 0.9)',
                    backdropFilter: 'blur(12px)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '16px',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                  }}
                  itemStyle={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase' }}
                />
                <Area
                  type="monotone"
                  dataKey="receitas"
                  stroke="hsl(var(--primary))"
                  strokeWidth={4}
                  fillOpacity={1}
                  fill="url(#colorReceitas)"
                  activeDot={{ r: 6, stroke: 'hsl(var(--background))', strokeWidth: 2 }}
                />
                <Area
                  type="monotone"
                  dataKey="despesas"
                  stroke="hsl(var(--destructive))"
                  strokeWidth={4}
                  fillOpacity={1}
                  fill="url(#colorDespesas)"
                  activeDot={{ r: 6, stroke: 'hsl(var(--background))', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Last transactions */}
      <Card className="bg-card/20 backdrop-blur-sm border border-border/10 rounded-[32px] overflow-hidden shadow-2xl shadow-black/5">
        <CardHeader className="flex flex-row items-center justify-between border-b border-border/5 py-6">
          <CardTitle className="text-lg font-black text-foreground tracking-tight uppercase">Últimas Transações</CardTitle>
          <Button
            variant="outline"
            className="text-[10px] font-black uppercase tracking-widest border-primary/20 text-primary hover:bg-primary/10 rounded-full h-8 px-6"
            onClick={() => navigate("/transactions")}
          >
            Ver todas
          </Button>
        </CardHeader>
        <CardContent className="pt-4">
          {lastTransactions.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-12">Nenhuma transação registrada</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {lastTransactions.map((t) => {
                const cat = categories.find((c) => c.id === t.category);
                const isIncome = t.type === "income";
                return (
                  <div key={t.id} className="flex items-center justify-between p-4 rounded-[24px] hover:bg-primary/5 border border-transparent hover:border-primary/10 transition-all duration-300 group cursor-default">
                    <div className="flex items-center gap-5">
                      <div className={cn(
                        "h-14 w-14 rounded-2xl flex items-center justify-center shadow-inner transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3",
                        isIncome ? "bg-emerald-500/10 text-emerald-500" : "bg-destructive/10 text-destructive"
                      )}>
                        <div className="relative">
                          {isIncome ? <PiggyBank className="h-7 w-7" /> : <TrendingDown className="h-7 w-7" />}
                          <div className={cn(
                            "absolute -top-1 -right-1 h-2 w-2 rounded-full border-2 border-background",
                            isIncome ? "bg-emerald-500" : "bg-destructive"
                          )} />
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-black text-foreground tracking-tight group-hover:text-primary transition-colors">{t.description}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground bg-muted/30 px-2 py-0.5 rounded-md">
                            {cat?.name || t.category}
                          </span>
                          <span className="text-[10px] font-bold text-muted-foreground/60 italic">
                            {format(parseISO(t.date), "dd MMM, HH:mm", { locale: ptBR })}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={cn(
                        "font-black text-lg tracking-tighter group-hover:scale-105 transition-transform origin-right",
                        isIncome ? "text-emerald-500" : "text-destructive"
                      )}>
                        {isIncome ? "+" : "-"}{formatCurrency(t.amount)}
                      </p>
                      <span className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-widest">Confirmado</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* FAB */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button
            size="icon"
            className="fixed bottom-8 right-8 h-14 w-14 rounded-2xl bg-primary hover:bg-primary/90 shadow-2xl shadow-primary/40 z-50 transition-transform hover:scale-110 active:scale-95"
            onClick={() => {
              setForm(emptyForm);
              setOpen(true);
            }}
          >
            <Plus className="h-7 w-7 text-white" />
          </Button>
        </DialogTrigger>
        <DialogContent className="bg-popover border-border text-popover-foreground">
          <DialogHeader><DialogTitle className="text-foreground">Nova Transação</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-muted-foreground font-medium">Tipo</Label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as TransactionType })}>
                <SelectTrigger className="bg-background border-border text-foreground h-11"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-popover border-border text-popover-foreground">
                  <SelectItem value="income">Receita</SelectItem>
                  <SelectItem value="expense">Despesa</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground font-medium">Valor (R$)</Label>
              <Input type="number" min="0" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="0,00" className="bg-background border-border text-foreground h-11" />
            </div>
            <div className={cn("grid gap-4", form.type === "expense" ? "grid-cols-2" : "grid-cols-1")}>
              {form.type === "expense" && (
                <>
                  <div className="space-y-2">
                    <Label className="text-muted-foreground font-medium">Método de Pagamento</Label>
                    <Select
                      value={form.paymentMethod}
                      onValueChange={(v: "pix" | "cartao") => {
                        setForm({ ...form, paymentMethod: v });
                      }}
                    >
                      <SelectTrigger className="bg-background border-border text-foreground h-11"><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-popover border-border text-popover-foreground">
                        <SelectItem value="pix">Pix</SelectItem>
                        <SelectItem value="cartao">Cartão de Crédito</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-muted-foreground font-medium">Categoria</Label>
                    <Select
                      value={form.category}
                      onValueChange={(v) => setForm({ ...form, category: v })}
                    >
                      <SelectTrigger className="bg-background border-border text-foreground h-11">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-border text-popover-foreground">
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
                <Label className="text-muted-foreground font-medium">Data</Label>
                <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="bg-background border-border text-foreground h-11" />
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground font-medium">Descrição</Label>
                <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Ex: Mercado" className="bg-background border-border text-foreground h-11" />
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" onClick={() => setOpen(false)} className="hover:bg-accent text-foreground">Cancelar</Button>
            <Button onClick={handleSave} className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 font-bold">Salvar Transação</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
