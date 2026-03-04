import { useMemo } from "react";
import { useFinance } from "@/contexts/FinanceContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Wallet, PiggyBank, ArrowUpRight, ArrowDownRight, Sun, Moon, Plus, MoreHorizontal } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
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

const emptyForm = { type: "expense" as TransactionType, amount: "", category: "", date: new Date().toISOString().slice(0, 10), description: "" };

export default function Dashboard() {
  const { transactions, categories, balance, addTransaction } = useFinance();
  const [range, setRange] = useState("current");
  const [startDate, setStartDate] = useState(format(subMonths(new Date(), 1), "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const handleSave = () => {
    const amount = parseFloat(form.amount);
    if (!amount || !form.category || !form.description) {
      toast.error("Preencha todos os campos");
      return;
    }
    addTransaction({
      type: form.type,
      amount,
      category: form.category,
      date: form.date,
      description: form.description
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

  const totalIncome = useMemo(
    () => filteredTransactions.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0),
    [filteredTransactions]
  );

  const totalExpense = useMemo(
    () => filteredTransactions.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0),
    [filteredTransactions]
  );

  const savings = totalIncome - totalExpense;

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

      <div className="grid gap-6 sm:grid-cols-2">
        {/* Card Saldo Total */}
        <Card className="bg-card border-none rounded-3xl p-2 relative overflow-hidden group shadow-sm transition-shadow hover:shadow-md">
          <div className="absolute right-0 top-0 w-24 h-24 bg-primary/10 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-110" />
          <CardContent className="pt-6 relative">
            <div className="flex justify-between items-start mb-6">
              <div className="h-12 w-12 rounded-2xl bg-primary/20 flex items-center justify-center">
                <Wallet className="h-6 w-6 text-primary" />
              </div>
              <span className="text-[12px] font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-full">+12.5%</span>
            </div>
            <p className="text-sm font-medium text-muted-foreground mb-1">Saldo Total</p>
            <h3 className="text-3xl font-bold text-foreground tracking-tight">{formatCurrency(balance)}</h3>
          </CardContent>
        </Card>

        {/* Card Despesas */}
        <Card className="bg-card border-none rounded-3xl p-2 relative overflow-hidden group shadow-sm transition-shadow hover:shadow-md">
          <div className="absolute right-0 top-0 w-24 h-24 bg-destructive/10 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-110" />
          <CardContent className="pt-6 relative">
            <div className="flex justify-between items-start mb-6">
              <div className="h-12 w-12 rounded-2xl bg-destructive/20 flex items-center justify-center">
                <TrendingDown className="h-6 w-6 text-destructive" />
              </div>
              <span className="text-[12px] font-bold text-destructive bg-destructive/10 px-2.5 py-1 rounded-full">-3.2%</span>
            </div>
            <p className="text-sm font-medium text-muted-foreground mb-1">Despesas (mês)</p>
            <h3 className="text-3xl font-bold text-foreground tracking-tight">{formatCurrency(totalExpense)}</h3>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Pie chart */}
        <Card className="bg-card border-none rounded-3xl overflow-hidden shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-bold text-foreground tracking-tight">Despesas por Categoria</CardTitle>
            <Button variant="ghost" size="icon" className="text-muted-foreground"><MoreHorizontal className="h-4 w-4" /></Button>
          </CardHeader>
          <CardContent>
            {expenseByCategory.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-12">Nenhuma despesa este mês</p>
            ) : (
              <div className="flex flex-col md:flex-row items-center gap-8 py-4">
                <div className="relative h-[220px] w-[220px] shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={expenseByCategory}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={65}
                        outerRadius={95}
                        paddingAngle={4}
                        stroke="none"
                      >
                        {expenseByCategory.map((_, i) => (
                          <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--popover))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '12px'
                        }}
                        itemStyle={{ color: 'hsl(var(--foreground))' }}
                        formatter={(v: number) => formatCurrency(v)}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-xl font-bold text-foreground">{formatCurrency(totalExpense)}</span>
                    <span className="text-[10px] text-muted-foreground uppercase tracking-widest">Total</span>
                  </div>
                </div>
                <div className="flex-1 space-y-3 w-full">
                  {expenseByCategory.map((e, i) => (
                    <div key={e.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="h-3 w-3 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                        <span className="text-sm font-medium text-foreground">{e.name}</span>
                      </div>
                      <span className="text-sm font-bold text-foreground">{formatCurrency(e.value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Line chart */}
        <Card className="bg-card border-none rounded-3xl overflow-hidden shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-bold text-foreground tracking-tight">Evolução Mensal</CardTitle>
            <div className="flex items-center gap-4 text-[12px]">
              <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-primary" /> <span className="text-muted-foreground">Receitas</span></div>
              <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-destructive" /> <span className="text-muted-foreground">Despesas</span></div>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={monthlyEvolution}>
                <defs>
                  <linearGradient id="colorInc" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="hsl(var(--border))" strokeDasharray="3 3" opacity={0.5} />
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  dy={10}
                />
                <YAxis hide />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '12px'
                  }}
                  itemStyle={{ fontSize: '12px', color: 'hsl(var(--foreground))' }}
                />
                <Line
                  type="monotone"
                  dataKey="receitas"
                  stroke="hsl(var(--primary))"
                  strokeWidth={4}
                  dot={false}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                />
                <Line
                  type="monotone"
                  dataKey="despesas"
                  stroke="hsl(var(--destructive))"
                  strokeWidth={4}
                  dot={false}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Last transactions */}
      <Card className="bg-card border-none rounded-3xl overflow-hidden shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between border-b border-border/50">
          <CardTitle className="text-lg font-bold text-foreground tracking-tight">Últimas Transações</CardTitle>
          <Button variant="link" className="text-primary font-bold">Ver todas</Button>
        </CardHeader>
        <CardContent>
          {lastTransactions.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-8">Nenhuma transação registrada</p>
          ) : (
            <div className="space-y-1">
              {lastTransactions.map((t) => {
                const cat = categories.find((c) => c.id === t.category);
                const isIncome = t.type === "income";
                return (
                  <div key={t.id} className="flex items-center justify-between p-4 rounded-2xl hover:bg-accent/50 transition-colors group">
                    <div className="flex items-center gap-4">
                      <div className={`h-12 w-12 rounded-2xl flex items-center justify-center ${isIncome ? "bg-primary/10" : "bg-destructive/10"}`}>
                        <PiggyBank className={`h-6 w-6 ${isIncome ? "text-primary" : "text-destructive"}`} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-foreground">{t.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {cat?.name || t.category} • {format(parseISO(t.date), "dd MMM yyyy", { locale: ptBR })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold text-base ${isIncome ? "text-primary" : "text-destructive"}`}>
                        {isIncome ? "+" : "-"}{formatCurrency(t.amount)}
                      </p>
                      <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight opacity-70">Cartão de Crédito</p>
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
            <div className="space-y-2">
              <Label className="text-muted-foreground font-medium">Categoria</Label>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
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
