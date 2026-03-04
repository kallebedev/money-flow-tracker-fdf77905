import { useMemo } from "react";
import { useFinance } from "@/contexts/FinanceContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Wallet, PiggyBank, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { format, parseISO, subMonths, isAfter, startOfMonth, isBefore, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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

export default function Dashboard() {
  const { transactions, categories, balance } = useFinance();
  const [range, setRange] = useState("current");
  const [startDate, setStartDate] = useState(format(subMonths(new Date(), 1), "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState(format(new Date(), "yyyy-MM-dd"));

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
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <Select value={range} onValueChange={setRange}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Período" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="current">Mês Atual</SelectItem>
            <SelectItem value="3months">Últimos 3 Meses</SelectItem>
            <SelectItem value="6months">Últimos 6 Meses</SelectItem>
            <SelectItem value="all">Todo o Período</SelectItem>
            <SelectItem value="custom">Personalizado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {range === "custom" && (
        <Card className="p-4 border">
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-2">
              <Label htmlFor="start-date" className="text-xs">Data Início</Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full sm:w-auto h-9"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end-date" className="text-xs">Data Fim</Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full sm:w-auto h-9"
              />
            </div>
          </div>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {cards.map((c) => (
          <Card key={c.title} className="finance-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{c.title}</CardTitle>
              <c.icon className={`h-5 w-5 ${c.trend ? "text-primary" : "text-destructive"}`} />
            </CardHeader>
            <CardContent>
              <p className={`text-2xl font-bold ${c.trend ? "text-foreground" : "text-destructive"}`}>
                {formatCurrency(c.value)}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Pie chart */}
        <Card className="finance-card">
          <CardHeader>
            <CardTitle className="text-base">Despesas por Categoria</CardTitle>
          </CardHeader>
          <CardContent>
            {expenseByCategory.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-8">Nenhuma despesa este mês</p>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={expenseByCategory} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={3}>
                    {expenseByCategory.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => formatCurrency(v)} />
                </PieChart>
              </ResponsiveContainer>
            )}
            <div className="flex flex-wrap gap-3 mt-2 justify-center">
              {expenseByCategory.map((e, i) => (
                <div key={e.name} className="flex items-center gap-1.5 text-xs">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                  {e.name}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Line chart */}
        <Card className="finance-card">
          <CardHeader>
            <CardTitle className="text-base">Evolução Mensal</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={monthlyEvolution}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                <Line type="monotone" dataKey="receitas" stroke="hsl(142, 72%, 40%)" strokeWidth={2.5} dot={false} />
                <Line type="monotone" dataKey="despesas" stroke="hsl(0, 84%, 60%)" strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Last transactions */}
      <Card className="finance-card">
        <CardHeader>
          <CardTitle className="text-base">Últimas Transações</CardTitle>
        </CardHeader>
        <CardContent>
          {lastTransactions.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-4">Nenhuma transação registrada</p>
          ) : (
            <div className="space-y-3">
              {lastTransactions.map((t) => {
                const cat = categories.find((c) => c.id === t.category);
                const isIncome = t.type === "income";
                return (
                  <div key={t.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div className="flex items-center gap-3">
                      <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${isIncome ? "bg-accent" : "bg-destructive/10"}`}>
                        {isIncome ? <ArrowUpRight className="h-4 w-4 text-primary" /> : <ArrowDownRight className="h-4 w-4 text-destructive" />}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{t.description}</p>
                        <p className="text-xs text-muted-foreground">{cat?.name || t.category} • {format(parseISO(t.date), "dd/MM/yyyy")}</p>
                      </div>
                    </div>
                    <span className={`font-semibold text-sm ${isIncome ? "text-primary" : "text-destructive"}`}>
                      {isIncome ? "+" : "-"}{formatCurrency(t.amount)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
