import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSpendingAnalysis, SpendingInsight } from "@/hooks/useSpendingAnalysis";
import { TrendingUp, TrendingDown, Minus, AlertTriangle, Info, Zap, Brain, HeartPulse } from "lucide-react";
import { cn } from "@/lib/utils";

export function SpendingAnalysis() {
    const { insights, unusualIncreases } = useSpendingAnalysis();

    if (insights.length === 0) return null;

    const normalInsights = insights.filter(i => !i.isUnusual);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold tracking-tight text-foreground/90">Análise de Gastos</h2>
            </div>

            {unusualIncreases.length > 0 && (
                <div className="space-y-4 animate-in fade-in duration-700">
                    <h3 className="text-sm font-black uppercase tracking-widest text-destructive flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 animate-bounce" /> Alertas Críticos
                    </h3>
                    <div className="grid gap-6 grid-cols-[repeat(auto-fit,minmax(280px,1fr))]">
                        {unusualIncreases.map((insight) => (
                            <AnalysisCard key={insight.categoryId} insight={insight} highlight />
                        ))}
                    </div>
                </div>
            )}

            <div className="grid gap-6 grid-cols-[repeat(auto-fit,minmax(280px,1fr))]">
                {normalInsights.map((insight) => (
                    <AnalysisCard key={insight.categoryId} insight={insight} />
                ))}
            </div>
        </div>
    );
}


export function HealthScoreCard({ score, status, advice, breakdown }: { score: number; status?: string; advice?: string; breakdown?: Record<string, number> }) {
    const isGood = score >= 80;
    const isWarning = score < 80 && score >= 50;

    return (
        <Card className="relative overflow-hidden transition-all duration-500 hover:shadow-2xl hover:-translate-y-1 border-primary/5 group bg-primary/[0.02] backdrop-blur-xl rounded-[32px] p-2 shadow-xl shadow-primary/5 h-full">
            <div className={cn(
                "absolute -right-8 -top-8 w-32 h-32 rounded-full blur-3xl opacity-20 transition-all duration-700 group-hover:scale-150",
                isGood ? "bg-emerald-500" : isWarning ? "bg-amber-500" : "bg-destructive"
            )} />

            <CardContent className="pt-4 pb-3 relative z-10 flex flex-col h-full">
                <div className="flex items-center gap-3 mb-4">
                    <div className="h-12 w-12 rounded-2xl flex items-center justify-center bg-primary/20 shadow-inner group-hover:rotate-3 transition-transform text-primary">
                        <HeartPulse className={cn("h-6 w-6", isGood ? "text-emerald-500" : isWarning ? "text-amber-500" : "text-destructive")} />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase tracking-widest text-foreground/50">Saúde Financeira</span>
                        <span className="text-xs font-bold text-foreground">Score Inteligente</span>
                    </div>
                </div>

                <div className="flex flex-col items-center justify-center py-2">
                    <div className={cn(
                        "text-4xl font-black tracking-tighter group-hover:scale-110 transition-transform",
                        isGood ? "text-emerald-500" : isWarning ? "text-amber-500" : "text-destructive"
                    )}>
                        {score.toFixed(0)}
                    </div>
                    <div className="text-[9px] font-bold uppercase tracking-widest opacity-40">Pontos de Saúde</div>
                </div>

                <div className="mt-auto pt-4 space-y-1.5 border-t border-primary/10">
                    <div className="h-1.5 w-full bg-muted/30 rounded-full overflow-hidden">
                        <div
                            className={cn(
                                "h-full rounded-full transition-all duration-1000 ease-out",
                                isGood ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]" :
                                    isWarning ? "bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.3)]" :
                                        "bg-destructive shadow-[0_0_10px_rgba(239,68,68,0.3)]"
                            )}
                            style={{ width: `${score}%` }}
                        />
                    </div>
                    <div className="space-y-2 mt-2">
                        <div className={cn(
                            "text-[10px] font-black uppercase tracking-tighter px-2 py-0.5 rounded-md w-fit mx-auto",
                            isGood ? "bg-emerald-500/10 text-emerald-500" : isWarning ? "bg-amber-500/10 text-amber-500" : "bg-destructive/10 text-destructive"
                        )}>
                            {status || (isGood ? "Excelente" : isWarning ? "Regular" : "Crítico")}
                        </div>
                        <p className="text-[11px] text-center text-muted-foreground font-medium leading-relaxed italic">
                            {advice || (isGood ? "Excelente! Gastos sob controle." : isWarning ? "Atenção em categorias." : "Cuidado! Score baixo.")}
                        </p>
                    </div>

                    {breakdown && Object.keys(breakdown).length > 0 && (
                        <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 pt-4 border-t border-primary/5">
                            {Object.entries(breakdown).map(([key, value]) => {
                                const labels: Record<string, string> = {
                                    savings: "Poupança",
                                    reserve: "Reserva",
                                    distribution: "Essenciais",
                                    debt: "Crédito",
                                    habits: "Hábitos",
                                    regularity: "Registros"
                                };
                                const maxValues: Record<string, number> = {
                                    savings: 25, reserve: 20, distribution: 20, debt: 15, habits: 10, regularity: 10
                                };
                                const max = maxValues[key] || 10;
                                return (
                                    <div key={key} className="flex flex-col gap-1">
                                        <div className="flex justify-between items-center">
                                            <span className="text-[8px] font-black uppercase tracking-widest opacity-40">{labels[key] || key}</span>
                                            <span className="text-[9px] font-bold opacity-60">{value}</span>
                                        </div>
                                        <div className="h-1 w-full bg-muted/20 rounded-full overflow-hidden">
                                            <div
                                                className={cn(
                                                    "h-full transition-all duration-1000",
                                                    value / max > 0.8 ? "bg-emerald-500/60" : value / max > 0.5 ? "bg-amber-500/60" : "bg-destructive/60"
                                                )}
                                                style={{ width: `${(value / max) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}


function AnalysisCard({ insight, highlight = false }: { insight: SpendingInsight; highlight?: boolean }) {
    const isIncrease = insight.type === "increase";
    const isDecrease = insight.type === "decrease";

    // Calculate progress (spent vs average/budget)
    const progress = Math.min(Math.max((insight.currentAmount / (insight.averageAmount || 1)) * 100, 0), 100);
    const isOverBudget = insight.currentAmount > insight.averageAmount && insight.averageAmount > 0;

    return (
        <Card className={cn(
            "relative overflow-hidden transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 border-none group",
            "bg-card/40 backdrop-blur-xl border border-border/10 shadow-lg",
            highlight && "ring-2 ring-destructive/50 bg-destructive/5"
        )}>
            {/* Animated decorative backgrounds */}
            <div className={cn(
                "absolute -right-8 -top-8 w-32 h-32 rounded-full blur-3xl opacity-20 transition-all duration-700 group-hover:scale-150 group-hover:opacity-30",
                isOverBudget ? "bg-destructive animate-pulse" : isDecrease ? "bg-emerald-500" : "bg-primary"
            )} />

            <CardHeader className="flex flex-row items-center justify-between pb-3 relative z-10">
                <div className="flex items-center gap-3">
                    <div className={cn(
                        "h-10 w-10 rounded-2xl flex items-center justify-center transition-all duration-300 group-hover:rotate-6 group-hover:scale-110 shadow-inner",
                        isOverBudget ? "bg-destructive/20" : isDecrease ? "bg-emerald-500/20" : "bg-primary/20"
                    )}>
                        {highlight ? (
                            <AlertTriangle className="h-5 w-5 text-destructive" />
                        ) : isIncrease ? (
                            <TrendingUp className="h-5 w-5 text-destructive" />
                        ) : isDecrease ? (
                            <TrendingDown className="h-5 w-5 text-emerald-500" />
                        ) : (
                            <Minus className="h-5 w-5 text-muted-foreground" />
                        )}
                    </div>
                    <div className="flex flex-col">
                        <CardTitle className="text-sm font-black uppercase tracking-widest text-foreground/70 group-hover:text-foreground transition-colors">
                            {insight.categoryName}
                        </CardTitle>
                        <span className="text-[10px] font-medium text-muted-foreground">Análise Mensal</span>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="relative z-10 pt-2 space-y-4">
                <div className="flex flex-col">
                    <div className="text-3xl font-black tracking-tighter text-foreground group-hover:scale-[1.02] transition-transform origin-left">
                        {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(insight.currentAmount)}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                        <div className={cn(
                            "flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold",
                            isIncrease ? "text-destructive" : isDecrease ? "text-emerald-500" : "text-muted-foreground"
                        )}>
                            {isIncrease ? "+" : ""}{insight.percentageChange.toFixed(1)}%
                        </div>
                        <span className="text-[10px] text-muted-foreground/60 font-medium italic">
                            {insight.averageAmount > 0 ? `vs média R$ ${insight.averageAmount.toFixed(0)}` : "Novo gasto"}
                        </span>
                    </div>
                </div>

                {/* Sleek Progress Bar */}
                <div className="space-y-1.5 pt-1">
                    <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-tight">
                        <span className="text-muted-foreground/80">Uso do Orçamento</span>
                        <span className={cn(isOverBudget ? "text-destructive" : "text-primary")}>
                            {progress.toFixed(0)}%
                        </span>
                    </div>
                    <div className="h-2 w-full bg-muted/30 rounded-full overflow-hidden border border-border/5">
                        <div
                            className={cn(
                                "h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(0,0,0,0.1)]",
                                isOverBudget
                                    ? "bg-gradient-to-r from-destructive/80 to-destructive"
                                    : "bg-gradient-to-r from-primary/80 to-primary"
                            )}
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>

                {insight.isUnusual && (
                    <div className="mt-2 p-2 bg-destructive/10 rounded-xl border border-destructive/20 flex items-center gap-2 text-[10px] text-destructive font-black animate-pulse">
                        <Info className="h-4 w-4 shrink-0" />
                        <span>ALERTA: GASTO ATÍPICO!</span>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
