import { useMemo, useState } from "react";
import { useSpendingAnalysis } from "@/hooks/useSpendingAnalysis";
import { useAIBudgetAdvisor } from "@/hooks/useAIBudgetAdvisor";
import { useFinance } from "@/contexts/FinanceContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { HealthScoreCard } from "@/components/SpendingAnalysis";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    Cell, PieChart, Pie, Legend
} from 'recharts';
import { Brain, TrendingUp, AlertTriangle, ArrowLeft, ArrowUpRight, ArrowDownRight, Zap, Filter } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { format, parseISO, subMonths, isAfter, startOfMonth, isBefore, endOfDay } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export default function SpendingAnalysisPage() {
    const location = useLocation();
    const { transactions } = useFinance();

    // Period State (initialized from location state if coming from Dashboard)
    const [range, setRange] = useState(location.state?.range || "current");
    const [startDate, setStartDate] = useState(location.state?.startDate || format(subMonths(new Date(), 1), "yyyy-MM-dd"));
    const [endDate, setEndDate] = useState(location.state?.endDate || format(new Date(), "yyyy-MM-dd"));

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

    const { insights, healthScore, healthAdvice, healthStatus, healthBreakdown, unusualIncreases } = useSpendingAnalysis(filteredTransactions);
    const advisor = useAIBudgetAdvisor();

    // Data for Distribution Chart
    const pieData = insights
        .filter(i => i.currentAmount > 0)
        .map(i => ({ name: i.categoryName, value: i.currentAmount }))
        .sort((a, b) => b.value - a.value);

    // Data for Comparison Chart (Top 6)
    const barData = insights
        .slice(0, 6)
        .map(i => ({
            name: i.categoryName,
            Atual: i.currentAmount,
            Média: i.averageAmount
        }));

    const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

    return (
        <div className="space-y-8 animate-fade-in pb-20">
            {/* Header */}
            <div className="flex flex-col gap-4">
                <Link to="/dashboard" className="flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-primary transition-colors w-fit">
                    <ArrowLeft className="h-4 w-4" /> Voltar ao Dashboard
                </Link>
                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
                    <div>
                        <h1 className="text-4xl font-black text-foreground tracking-tighter">Análise de Gastos</h1>
                        <p className="text-muted-foreground mt-2 text-lg">Visão completa do seu comportamento financeiro.</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        <Select value={range} onValueChange={setRange}>
                            <SelectTrigger className="w-full md:w-[180px] bg-[#111] border-white/[0.03] text-[#888] h-12 text-[14px] rounded-xl">
                                <SelectValue placeholder="Período" />
                            </SelectTrigger>
                            <SelectContent className="bg-[#111] border-white/[0.08] text-[#f0f0f0] rounded-xl">
                                <SelectItem value="current">Mês Atual</SelectItem>
                                <SelectItem value="3months">Últimos 3 Meses</SelectItem>
                                <SelectItem value="6months">Últimos 6 Meses</SelectItem>
                                <SelectItem value="all">Todo o Período</SelectItem>
                                <SelectItem value="custom">Personalizado</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>

            {range === "custom" && (
                <div className="p-6 bg-[#111] border border-white/[0.03] rounded-2xl flex flex-wrap gap-6 items-end animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest opacity-50 pl-1">Início</Label>
                        <Input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="bg-[#0a0a0a] border-white/[0.03] text-[#f0f0f0] h-11 rounded-xl text-[13px] w-full sm:w-[200px]"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest opacity-50 pl-1">Fim</Label>
                        <Input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="bg-[#0a0a0a] border-white/[0.03] text-[#f0f0f0] h-11 rounded-xl text-[13px] w-full sm:w-[200px]"
                        />
                    </div>
                </div>
            )}

            {/* Top Row: Health and AI Overview */}
            <div className="grid gap-6 md:grid-cols-12">
                <div className="md:col-span-12">
                    <HealthScoreCard
                        score={healthScore}
                        status={healthStatus}
                        advice={healthAdvice}
                        breakdown={healthBreakdown}
                    />
                </div>
                <div className="md:col-span-8 lg:col-span-9">
                    <Card className="bg-[#111] border-white/[0.03] rounded-[32px] overflow-hidden group h-full">
                        <CardHeader className="flex flex-row items-center gap-3 pb-2 pt-8 px-8">
                            <div className="h-10 w-10 rounded-2xl bg-primary/20 flex items-center justify-center text-primary">
                                <Brain className="h-6 w-6" />
                            </div>
                            <div>
                                <CardTitle className="text-xl font-black tracking-tight">Conselheiro de IA</CardTitle>
                                <CardDescription className="text-xs font-bold uppercase tracking-widest opacity-50">Resumo Estratégico</CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent className="px-8 pb-8 flex flex-col justify-center">
                            <p className="text-lg font-medium leading-relaxed text-foreground/90 italic">
"{(advisor as any)?.overview || "Comece a registrar suas transações para receber conselhos personalizados sobre sua distribuição de gastos."}"
                            </p>
                            <div className="mt-6 flex flex-wrap gap-3">
                                {(advisor as any)?.buckets?.map((bucket: any) => (
                                    <div key={bucket.category} className="bg-white/[0.03] border border-white/[0.03] px-4 py-2 rounded-2xl">
                                        <span className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground">{bucket.category}</span>
                                        <span className="text-sm font-bold text-foreground">{bucket.percentage}% sugerido</span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Main Charts Row */}
            <div className="grid gap-6 lg:grid-cols-2">
                {/* Spending Distribution */}
                <Card className="bg-[#111] border-white/[0.03] rounded-[32px] overflow-hidden p-2">
                    <CardHeader className="px-6 pt-6">
                        <CardTitle className="text-lg font-black uppercase tracking-widest opacity-80">Distribuição por Categoria</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={80}
                                    outerRadius={120}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="transparent" />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ background: '#111', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', fontWeight: 'bold' }}
                                    formatter={(value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)}
                                />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Spending Comparison */}
                <Card className="bg-[#111] border-white/[0.03] rounded-[32px] overflow-hidden p-2">
                    <CardHeader className="px-6 pt-6">
                        <CardTitle className="text-lg font-black uppercase tracking-widest opacity-80">Atual vs Consumo Médio</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={barData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.02)" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#555', fontSize: 10, fontWeight: 'bold' }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#555', fontSize: 10 }} />
                                <Tooltip
                                    cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                                    contentStyle={{ background: '#111', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', fontWeight: 'bold' }}
                                />
                                <Legend verticalAlign="top" align="right" height={36} />
                                <Bar dataKey="Atual" fill="#22c55e" radius={[6, 6, 0, 0]} />
                                <Bar dataKey="Média" fill="#333" radius={[6, 6, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {/* Alert Row */}
            {unusualIncreases.length > 0 && (
                <div className="space-y-4">
                    <h3 className="text-sm font-black uppercase tracking-widest text-destructive flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 animate-pulse" /> Atenção Necessária
                    </h3>
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {unusualIncreases.map(insight => (
                            <Card key={insight.categoryId} className="bg-destructive/5 border-destructive/10 rounded-[28px] p-6 group">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="h-10 w-10 min-w-10 rounded-xl bg-destructive/20 flex items-center justify-center text-destructive group-hover:rotate-12 transition-transform">
                                        <TrendingUp className="h-6 w-6" />
                                    </div>
                                    <div className="text-right">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-destructive opacity-70">Aumento de</span>
                                        <div className="text-xl font-black text-destructive">{insight.percentageChange.toFixed(0)}%</div>
                                    </div>
                                </div>
                                <h4 className="text-lg font-bold text-foreground">{insight.categoryName}</h4>
                                <p className="text-xs text-muted-foreground mt-1">Este gasto está significativamente acima da sua média habitual.</p>
                                <div className="mt-4 pt-4 border-t border-destructive/10 flex justify-between items-end">
                                    <div className="text-[10px] font-bold text-muted-foreground uppercase">Atual</div>
                                    <div className="text-lg font-black text-foreground">
                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(insight.currentAmount)}
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                </div>
            )}

            {/* Deep Analysis Row */}
            <div className="grid gap-6 lg:grid-cols-3">
                {insights.slice(0, 9).map((insight, idx) => {
                    const isIncrease = insight.type === "increase" && insight.percentageChange > 5;
                    const isDecrease = insight.type === "decrease" && insight.percentageChange < -5;

                    return (
                        <Card key={insight.categoryId} className="bg-[#111] border-white/[0.03] rounded-[28px] p-6 hover:bg-white/[0.02] transition-colors border-l-4"
                            style={{ borderLeftColor: COLORS[idx % COLORS.length] }}>
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h4 className="text-base font-black uppercase tracking-widest text-foreground/80">{insight.categoryName}</h4>
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Análise de Categoria</p>
                                </div>
                                {isIncrease ? <ArrowUpRight className="h-5 w-5 text-destructive" /> :
                                    isDecrease ? <ArrowDownRight className="h-5 w-5 text-primary" /> :
                                        <Zap className="h-5 w-5 text-muted-foreground opacity-30" />}
                            </div>

                            <div className="flex flex-col gap-1">
                                <div className="text-2xl font-black tracking-tighter text-foreground">
                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(insight.currentAmount)}
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={cn(
                                        "text-[10px] font-black px-2 py-0.5 rounded-full",
                                        isIncrease ? "bg-destructive/10 text-destructive" :
                                            isDecrease ? "bg-primary/10 text-primary" :
                                                "bg-white/5 text-muted-foreground"
                                    )}>
                                        {isIncrease ? "+" : ""}{insight.percentageChange.toFixed(1)}%
                                    </span>
                                    <span className="text-[10px] font-medium text-muted-foreground">desde o mês passado</span>
                                </div>
                            </div>

                            <div className="mt-6 flex items-center justify-between">
                                <span className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest">Gasto Médio</span>
                                <span className="text-xs font-bold text-foreground/70">
                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(insight.averageAmount)}
                                </span>
                            </div>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}
