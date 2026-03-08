import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { useFinance } from "@/contexts/FinanceContext";
import { useAIPlanFromQuestionnaire, FinancialPlanQuestionnaire } from "@/hooks/useAIBudgetAdvisor";
import { Brain, Sparkles, Check, ArrowRight, Lightbulb, ArrowLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import confetti from "canvas-confetti";
import { Progress } from "@/components/ui/progress";

const TOTAL_STEPS = 9;

export function AIBudgetPlanner() {
    const { monthlySalary, setMonthlySalary, updateCategory, categories } = useFinance();
    const [open, setOpen] = useState(false);
    const [step, setStep] = useState(1);
    const [questionnaire, setQuestionnaire] = useState<Partial<FinancialPlanQuestionnaire>>({
        monthlySalary: monthlySalary || undefined,
        hasDebt: false,
        hasEmergencyFund: false,
        goal: "moderate",
        lifestyle: "comfortable",
        priority: "essentials",
    });
    const { advisor, isLoading: isAILoading, error: aiError, generatePlan, resetPlan } = useAIPlanFromQuestionnaire();

    useEffect(() => {
        if (open) {
            setQuestionnaire(prev => ({ ...prev, monthlySalary: monthlySalary || undefined }));
            if (!advisor) setStep(1);
        }
    }, [open, monthlySalary]);

    const update = (data: Partial<FinancialPlanQuestionnaire>) => setQuestionnaire(prev => ({ ...prev, ...data }));

    const handleNext = () => {
        if (step === 1) {
            const v = questionnaire.monthlySalary ?? 0;
            if (v <= 0) {
                toast.error("Informe seu salário mensal.");
                return;
            }
            setMonthlySalary(v);
        }
        if (step < TOTAL_STEPS) setStep(step + 1);
    };

    const handleBack = () => {
        if (step > 1) setStep(step - 1);
    };

    const handleGenerate = () => {
        const q = questionnaire as FinancialPlanQuestionnaire;
        if (!q.monthlySalary || q.monthlySalary <= 0) {
            toast.error("Salário é obrigatório.");
            return;
        }
        generatePlan({
            monthlySalary: q.monthlySalary,
            otherIncome: q.otherIncome,
            fixedExpenses: q.fixedExpenses,
            hasDebt: q.hasDebt ?? false,
            debtMonthlyPayment: q.debtMonthlyPayment,
            emergencyFundMonths: q.emergencyFundMonths,
            hasEmergencyFund: q.hasEmergencyFund ?? false,
            goal: q.goal ?? "moderate",
            lifestyle: q.lifestyle ?? "comfortable",
            priority: q.priority ?? "essentials",
            goalsShortTerm: q.goalsShortTerm,
            goalsLongTerm: q.goalsLongTerm,
        });
    };

    const applySuggestions = async () => {
        if (!advisor) return;
        try {
            const promises = advisor.categoryAdvice
                .filter(advice => advice.suggestedAmount > 0)
                .map(advice => updateCategory(advice.categoryId, { monthlyBudget: advice.suggestedAmount }));
            await Promise.all(promises);
            setOpen(false);
            confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, colors: ['#22c55e', '#3b82f6', '#f59e0b'] });
            toast.success("Orçamentos aplicados com sucesso!");
        } catch (error) {
            toast.error("Erro ao aplicar orçamentos");
        }
    };

    const progressPct = (step / TOTAL_STEPS) * 100;

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="h-10 px-4 rounded-xl border-primary/10 bg-primary/2 hover:bg-primary/5 text-primary font-bold transition-all hover:scale-105">
                    <Brain className="mr-2 h-5 w-5" /> Planejador IA
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-popover border-border text-popover-foreground">
                <DialogHeader>
                    <div className="flex items-center gap-2 mb-2">
                        <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center">
                            <Brain className="h-5 w-5 text-primary" />
                        </div>
                        <DialogTitle className="text-xl font-bold">Plano de Controle Financeiro</DialogTitle>
                    </div>
                    {step <= TOTAL_STEPS && (
                        <div className="space-y-2">
                            <div className="flex justify-between text-xs text-muted-foreground">
                                <span>Pergunta {step} de {TOTAL_STEPS}</span>
                                <span>{Math.round(progressPct)}%</span>
                            </div>
                            <Progress value={progressPct} className="h-1.5" />
                        </div>
                    )}
                </DialogHeader>

                <div className="space-y-6 pt-2">
                    {/* Step 1: Renda */}
                    {step === 1 && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            <p className="text-sm text-muted-foreground">Para montarmos seu plano, precisamos conhecer sua situação financeira.</p>
                            <div className="space-y-3">
                                <Label className="text-xs font-black uppercase tracking-widest text-primary/70">Salário mensal (líquido) *</Label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">R$</span>
                                    <Input
                                        type="number"
                                        min="0"
                                        step="100"
                                        value={questionnaire.monthlySalary ?? ""}
                                        onChange={(e) => update({ monthlySalary: parseFloat(e.target.value) || undefined })}
                                        className="pl-10 h-12 text-lg font-bold rounded-xl"
                                        placeholder="0,00"
                                    />
                                </div>
                            </div>
                            <div className="space-y-3">
                                <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Outras fontes de renda (opcional)</Label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">R$</span>
                                    <Input
                                        type="number"
                                        min="0"
                                        step="100"
                                        value={questionnaire.otherIncome ?? ""}
                                        onChange={(e) => update({ otherIncome: parseFloat(e.target.value) || undefined })}
                                        className="pl-10 rounded-xl"
                                        placeholder="Freelas, aluguéis, etc."
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Gastos fixos */}
                    {step === 2 && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            <p className="text-sm text-muted-foreground">Quanto você gasta por mês com itens fixos? (moradia, transporte, contas, assinaturas)</p>
                            <div className="space-y-3">
                                <Label className="text-xs font-black uppercase tracking-widest text-primary/70">Gastos fixos mensais (R$)</Label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">R$</span>
                                    <Input
                                        type="number"
                                        min="0"
                                        step="50"
                                        value={questionnaire.fixedExpenses ?? ""}
                                        onChange={(e) => update({ fixedExpenses: parseFloat(e.target.value) || undefined })}
                                        className="pl-10 h-12 rounded-xl"
                                        placeholder="Ex: 2500"
                                    />
                                </div>
                                <p className="text-[10px] text-muted-foreground">Se não souber, pode deixar em branco. A IA vai estimar.</p>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Dívidas */}
                    {step === 3 && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            <p className="text-sm text-muted-foreground">Você possui dívidas ou parcelas fixas no momento?</p>
                            <div className="flex gap-3">
                                <Button
                                    variant={questionnaire.hasDebt ? "default" : "outline"}
                                    className="flex-1 rounded-xl"
                                    onClick={() => update({ hasDebt: true })}
                                >
                                    Sim
                                </Button>
                                <Button
                                    variant={!questionnaire.hasDebt ? "default" : "outline"}
                                    className="flex-1 rounded-xl"
                                    onClick={() => update({ hasDebt: false, debtMonthlyPayment: undefined })}
                                >
                                    Não
                                </Button>
                            </div>
                            {questionnaire.hasDebt && (
                                <div className="space-y-3 pt-2">
                                    <Label className="text-xs font-black uppercase tracking-widest">Valor total das parcelas por mês (R$)</Label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">R$</span>
                                        <Input
                                            type="number"
                                            min="0"
                                            step="50"
                                            value={questionnaire.debtMonthlyPayment ?? ""}
                                            onChange={(e) => update({ debtMonthlyPayment: parseFloat(e.target.value) || undefined })}
                                            className="pl-10 rounded-xl"
                                            placeholder="Ex: 800"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Step 4: Reserva de emergência */}
                    {step === 4 && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            <p className="text-sm text-muted-foreground">Você já possui uma reserva de emergência?</p>
                            <div className="flex gap-3">
                                <Button
                                    variant={questionnaire.hasEmergencyFund ? "default" : "outline"}
                                    className="flex-1 rounded-xl"
                                    onClick={() => update({ hasEmergencyFund: true })}
                                >
                                    Sim
                                </Button>
                                <Button
                                    variant={!questionnaire.hasEmergencyFund ? "default" : "outline"}
                                    className="flex-1 rounded-xl"
                                    onClick={() => update({ hasEmergencyFund: false, emergencyFundMonths: undefined })}
                                >
                                    Não
                                </Button>
                            </div>
                            {questionnaire.hasEmergencyFund && (
                                <div className="space-y-3 pt-2">
                                    <Label className="text-xs font-black uppercase tracking-widest">Quantos meses de gastos sua reserva cobre?</Label>
                                    <Input
                                        type="number"
                                        min="1"
                                        max="24"
                                        value={questionnaire.emergencyFundMonths ?? ""}
                                        onChange={(e) => update({ emergencyFundMonths: parseInt(e.target.value, 10) || undefined })}
                                        className="rounded-xl"
                                        placeholder="Ex: 6"
                                    />
                                </div>
                            )}
                            {!questionnaire.hasEmergencyFund && (
                                <p className="text-[10px] text-muted-foreground">O plano vai sugerir priorizar a formação da reserva.</p>
                            )}
                        </div>
                    )}

                    {/* Step 5: Meta principal */}
                    {step === 5 && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            <p className="text-sm text-muted-foreground">Qual sua meta financeira principal no momento?</p>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                {[
                                    { id: "debt" as const, label: "Quitar dívidas", icon: "💸" },
                                    { id: "moderate" as const, label: "Equilíbrio", icon: "⚖️" },
                                    { id: "savings" as const, label: "Investir / Poupar", icon: "🚀" },
                                ].map((opt) => (
                                    <Button
                                        key={opt.id}
                                        variant={questionnaire.goal === opt.id ? "default" : "outline"}
                                        onClick={() => update({ goal: opt.id })}
                                        className="h-auto py-4 flex flex-col gap-1 rounded-xl"
                                    >
                                        <span className="text-2xl">{opt.icon}</span>
                                        <span className="text-xs font-bold">{opt.label}</span>
                                    </Button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Step 6: Estilo de vida */}
                    {step === 6 && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            <p className="text-sm text-muted-foreground">Como você descreveria seu estilo de vida em relação a gastos?</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {[
                                    { id: "frugal" as const, label: "Frugal", desc: "Economizo ao máximo" },
                                    { id: "comfortable" as const, label: "Confortável", desc: "Equilibrado entre economia e lazer" },
                                    { id: "custom" as const, label: "Flexível", desc: "Varia conforme o mês" },
                                ].map((opt) => (
                                    <Button
                                        key={opt.id}
                                        variant={questionnaire.lifestyle === opt.id ? "default" : "outline"}
                                        onClick={() => update({ lifestyle: opt.id })}
                                        className="h-auto py-3 px-4 flex flex-col items-start gap-0.5 rounded-xl text-left"
                                    >
                                        <span className="text-xs font-bold">{opt.label}</span>
                                        <span className="text-[10px] opacity-70">{opt.desc}</span>
                                    </Button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Step 7: Prioridade */}
                    {step === 7 && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            <p className="text-sm text-muted-foreground">O que é prioridade absoluta para você hoje?</p>
                            <div className="flex flex-wrap gap-2">
                                {[
                                    { id: "essentials" as const, label: "Essencial (contas, moradia, comida)" },
                                    { id: "future" as const, label: "Meu futuro (reserva, investimentos)" },
                                    { id: "lifestyle" as const, label: "Qualidade de vida (lazer, bem-estar)" },
                                ].map((opt) => (
                                    <Button
                                        key={opt.id}
                                        variant={questionnaire.priority === opt.id ? "default" : "outline"}
                                        onClick={() => update({ priority: opt.id })}
                                        className="rounded-full text-xs font-bold"
                                    >
                                        {opt.label}
                                    </Button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Step 8: Metas curto e longo prazo */}
                    {step === 8 && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            <p className="text-sm text-muted-foreground">Conte um pouco sobre suas metas (opcional). A IA usará isso para personalizar o plano.</p>
                            <div className="space-y-3">
                                <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Metas de curto prazo (ex: viagem, trocar celular)</Label>
                                <Input
                                    value={questionnaire.goalsShortTerm ?? ""}
                                    onChange={(e) => update({ goalsShortTerm: e.target.value })}
                                    className="rounded-xl"
                                    placeholder="Ex: Férias em 6 meses, notebook novo"
                                />
                            </div>
                            <div className="space-y-3">
                                <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Metas de longo prazo (ex: casa própria, aposentadoria)</Label>
                                <Input
                                    value={questionnaire.goalsLongTerm ?? ""}
                                    onChange={(e) => update({ goalsLongTerm: e.target.value })}
                                    className="rounded-xl"
                                    placeholder="Ex: Comprar apartamento, independência financeira"
                                />
                            </div>
                        </div>
                    )}

                    {/* Step 9: Resumo e Gerar */}
                    {step === 9 && !advisor && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            <p className="text-sm text-muted-foreground">Revise suas respostas e gere seu plano personalizado.</p>
                            <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-2 text-sm">
                                <p><strong>Renda:</strong> R$ {(questionnaire.monthlySalary ?? 0).toLocaleString("pt-BR")} {questionnaire.otherIncome ? `+ R$ ${questionnaire.otherIncome.toLocaleString("pt-BR")} extras` : ""}</p>
                                {questionnaire.fixedExpenses != null && questionnaire.fixedExpenses > 0 && <p><strong>Gastos fixos:</strong> R$ {questionnaire.fixedExpenses.toLocaleString("pt-BR")}</p>}
                                <p><strong>Dívidas:</strong> {questionnaire.hasDebt ? `R$ ${(questionnaire.debtMonthlyPayment ?? 0).toLocaleString("pt-BR")}/mês` : "Nenhuma"}</p>
                                <p><strong>Reserva de emergência:</strong> {questionnaire.hasEmergencyFund ? `${questionnaire.emergencyFundMonths ?? "?"} meses` : "Ainda não"}</p>
                                <p><strong>Meta principal:</strong> {questionnaire.goal === "debt" ? "Quitar dívidas" : questionnaire.goal === "savings" ? "Investir/Poupar" : "Equilíbrio"}</p>
                            </div>
                            <Button
                                onClick={handleGenerate}
                                disabled={isAILoading}
                                className="w-full h-12 rounded-xl font-bold bg-primary hover:bg-primary/90"
                            >
                                {isAILoading ? (
                                    <>Gerando seu plano...</>
                                ) : (
                                    <>Gerar meu plano com IA <Sparkles className="ml-2 h-5 w-5" /></>
                                )}
                            </Button>
                        </div>
                    )}

                    {/* Resultado do plano (após IA) */}
                    {advisor && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            <h3 className="font-bold flex items-center gap-2">
                                <Sparkles className="h-5 w-5 text-primary" /> Seu plano de controle financeiro
                            </h3>
                            <div className="p-4 bg-primary/5 border border-primary/10 rounded-2xl">
                                <p className="text-sm leading-relaxed whitespace-pre-line">{advisor.overview}</p>
                            </div>
                            {advisor.buckets?.length > 0 && (
                                <div className="grid gap-3 sm:grid-cols-3">
                                    {advisor.buckets.map((b) => (
                                        <div key={b.category} className="bg-card border rounded-xl p-4">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="text-[10px] font-bold uppercase text-muted-foreground">{b.category}</span>
                                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">{b.percentage}%</span>
                                            </div>
                                            <div className="text-lg font-bold">R$ {b.suggestedAmount.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}</div>
                                        </div>
                                    ))}
                                </div>
                            )}
                            <div className="pt-2">
                                <div className="flex items-center justify-between mb-4">
                                    <h4 className="text-sm font-bold flex items-center gap-2">
                                        <Lightbulb className="h-4 w-4 text-yellow-500" /> Por categoria
                                    </h4>
                                    <Button onClick={applySuggestions} className="h-9 px-4 rounded-xl font-bold bg-primary">
                                        <Check className="mr-2 h-4 w-4" /> Aplicar orçamentos
                                    </Button>
                                </div>
                                <div className="grid gap-2">
                                    {advisor.categoryAdvice?.filter(a => a.suggestedAmount > 0).map((advice) => (
                                        <div key={advice.categoryId} className="flex items-center justify-between p-3 bg-muted/30 border rounded-xl text-sm">
                                            <span className="font-medium">{advice.categoryName}</span>
                                            <span className="text-muted-foreground text-xs">R$ {advice.suggestedAmount.toFixed(0)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {aiError && (
                        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-xl text-sm text-destructive">
                            {aiError}
                            <Button variant="outline" size="sm" className="mt-2" onClick={handleGenerate}>Tentar novamente</Button>
                        </div>
                    )}

                    {/* Navegação */}
                    {step <= TOTAL_STEPS && !advisor && (
                        <div className="flex items-center justify-between pt-4 border-t">
                            <Button variant="ghost" onClick={handleBack} disabled={step === 1} className="rounded-xl">
                                <ArrowLeft className="mr-1 h-4 w-4" /> Voltar
                            </Button>
                            {step < 9 ? (
                                <Button onClick={handleNext} className="rounded-xl">
                                    Próxima <ChevronRight className="ml-1 h-4 w-4" />
                                </Button>
                            ) : null}
                        </div>
                    )}
                    {advisor && (
                        <Button variant="ghost" size="sm" onClick={() => { resetPlan(); setStep(1); setQuestionnaire({ ...questionnaire, monthlySalary }); }} className="rounded-xl">
                            <ArrowLeft className="mr-1 h-4 w-4" /> Refazer questionário
                        </Button>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
