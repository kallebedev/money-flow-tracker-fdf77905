import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { useFinance } from "@/contexts/FinanceContext";
import { useAIBudgetAdvisor, BudgetProfileData } from "@/hooks/useAIBudgetAdvisor";
import { Brain, Sparkles, Check, ArrowRight, Lightbulb, Trash2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import confetti from "canvas-confetti";

type Step = "salary" | "profile" | "advice";

export function AIBudgetPlanner() {
    const { monthlySalary, setMonthlySalary, updateCategory, categories } = useFinance();
    const [step, setStep] = useState<Step>(monthlySalary > 0 ? "profile" : "salary");
    const [profileData, setProfileData] = useState<BudgetProfileData>({
        goal: "moderate",
        lifestyle: "comfortable",
        priority: "essentials"
    });
    const advisor = useAIBudgetAdvisor(profileData);
    const [tempSalary, setTempSalary] = useState(monthlySalary > 0 ? monthlySalary.toString() : "");
    const [open, setOpen] = useState(false);

    const handleSaveSalary = () => {
        const s = parseFloat(tempSalary);
        if (isNaN(s) || s < 0) {
            toast.error("Salário inválido");
            return;
        }
        setMonthlySalary(s);
        setStep("profile");
        toast.success("Salário atualizado!");
    };

    const handleRemoveSalary = () => {
        setMonthlySalary(0);
        setTempSalary("");
        setStep("salary");
        toast.success("Salário removido!");
    };

    const applySuggestions = async () => {
        if (!advisor) return;

        try {
            const promises = advisor.categoryAdvice
                .filter(advice => advice.suggestedAmount > 0)
                .map(advice =>
                    updateCategory(advice.categoryId, { monthlyBudget: advice.suggestedAmount })
                );

            await Promise.all(promises);
            setOpen(false);
            confetti({
                particleCount: 150,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#22c55e', '#3b82f6', '#f59e0b']
            });
            toast.success("Orçamentos aplicados com sucesso!");
        } catch (error) {
            console.error("Error applying suggestions:", error);
            toast.error("Erro ao aplicar orçamentos");
        }
    };

    return (
        <Dialog open={open} onOpenChange={(val) => {
            setOpen(val);
            if (!val && monthlySalary > 0) {
                // Reset to profile step when closing if salary is set
                setStep("profile");
            }
        }}>
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
                        <DialogTitle className="text-xl font-bold">Planejador com IA</DialogTitle>
                    </div>
                </DialogHeader>

                <div className="space-y-6 pt-2">
                    {step === "salary" && (
                        <div className="flex flex-col items-center justify-center space-y-8 py-10 animate-in fade-in zoom-in-95 duration-500 text-center">
                            <div className="space-y-2 max-w-sm">
                                <p className="text-muted-foreground text-sm font-medium">Para começarmos a planejar sua liberdade financeira, qual foi o seu último salário recebido?</p>
                            </div>

                            <div className="w-full max-w-sm space-y-6">
                                <div className="space-y-3">
                                    <Label htmlFor="salary" className="text-xs font-black uppercase tracking-widest text-primary/70">Seu Salário Mensal</Label>
                                    <div className="group relative">
                                        <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none transition-colors group-focus-within:text-primary">
                                            <span className="text-lg font-bold">R$</span>
                                        </div>
                                        <Input
                                            id="salary"
                                            type="number"
                                            value={tempSalary}
                                            onChange={(e) => setTempSalary(e.target.value)}
                                            className="pl-12 h-16 text-2xl font-black bg-white/[0.02] border-2 border-primary/10 rounded-2xl focus:border-primary/40 focus:ring-4 focus:ring-primary/5 transition-all placeholder:text-muted-foreground/30"
                                            placeholder="0,00"
                                        />
                                    </div>
                                </div>

                                <div className="flex flex-col gap-4">
                                    <Button
                                        onClick={handleSaveSalary}
                                        className="h-14 w-full rounded-2xl font-black uppercase tracking-widest text-sm transition-all hover:scale-[1.02] active:scale-95 shadow-lg shadow-primary/20"
                                    >
                                        Continuar para o Perfil <ArrowRight className="ml-2 h-5 w-5" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        onClick={() => {
                                            const s = parseFloat(tempSalary);
                                            if (isNaN(s) || s < 0) {
                                                toast.error("Salário inválido");
                                                return;
                                            }
                                            setMonthlySalary(s);
                                            setOpen(false);
                                            toast.success("Salário salvo e orçamento registrado.");
                                        }}
                                        className="text-[10px] font-black uppercase tracking-widest py-2 text-muted-foreground hover:text-foreground hover:bg-white/5 rounded-xl transition-colors"
                                    >
                                        Pular instruções da IA (Apenas salvar)
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}

                    {step === "profile" && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div className="flex items-center justify-between">
                                <p className="text-muted-foreground text-sm">Conte um pouco sobre seu perfil financeiro:</p>
                                <Button variant="ghost" size="sm" onClick={() => setStep("salary")} className="text-xs h-8">
                                    <ArrowLeft className="mr-1 h-4 w-4" /> Alterar Salário
                                </Button>
                            </div>

                            <div className="grid gap-6">
                                <div className="space-y-3">
                                    <Label className="text-sm font-bold">Qual sua meta principal no momento?</Label>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                        {[
                                            { id: "debt", label: "Quitar Dívidas", icon: "💸" },
                                            { id: "moderate", label: "Equilíbrio", icon: "⚖️" },
                                            { id: "savings", label: "Investir/Poupar", icon: "🚀" }
                                        ].map((opt) => (
                                            <Button
                                                key={opt.id}
                                                variant={profileData.goal === opt.id ? "default" : "outline"}
                                                onClick={() => setProfileData({ ...profileData, goal: opt.id as any })}
                                                className="h-auto py-3 px-4 flex flex-col items-center gap-1 rounded-xl"
                                            >
                                                <span className="text-xl">{opt.icon}</span>
                                                <span className="text-xs font-bold">{opt.label}</span>
                                            </Button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <Label className="text-sm font-bold">Como você descreveria seu estilo de vida?</Label>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        {[
                                            { id: "frugal", label: "Frugal (Economizo ao máximo)", desc: "Menos gastos com lazer" },
                                            { id: "comfortable", label: "Confortável (Equilibrado)", desc: "Gastos moderados com lazer" }
                                        ].map((opt) => (
                                            <Button
                                                key={opt.id}
                                                variant={profileData.lifestyle === opt.id ? "default" : "outline"}
                                                onClick={() => setProfileData({ ...profileData, lifestyle: opt.id as any })}
                                                className="h-auto py-3 px-4 flex flex-col items-start gap-0.5 rounded-xl text-left"
                                            >
                                                <span className="text-xs font-bold">{opt.label}</span>
                                                <span className="text-[10px] opacity-70 font-normal">{opt.desc}</span>
                                            </Button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <Label className="text-sm font-bold">O que é prioridade absoluta hoje?</Label>
                                    <div className="flex flex-wrap gap-2">
                                        {[
                                            { id: "essentials", label: "Essencial" },
                                            { id: "future", label: "Meu Futuro" },
                                            { id: "lifestyle", label: "Meu Lazer" }
                                        ].map((opt) => (
                                            <Button
                                                key={opt.id}
                                                variant={profileData.priority === opt.id ? "secondary" : "outline"}
                                                onClick={() => setProfileData({ ...profileData, priority: opt.id as any })}
                                                className={cn(
                                                    "h-9 px-4 rounded-full text-xs font-bold",
                                                    profileData.priority === opt.id && "bg-primary text-primary-foreground hover:bg-primary/90"
                                                )}
                                            >
                                                {opt.label}
                                            </Button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col gap-3">
                                <Button
                                    onClick={() => setStep("advice")}
                                    className="w-full h-12 rounded-xl font-bold bg-primary hover:bg-primary/90 transition-all hover:scale-[1.02]"
                                >
                                    Gerar Orçamento Personalizado <Sparkles className="ml-2 h-5 w-5" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    onClick={() => setOpen(false)}
                                    className="text-xs text-muted-foreground hover:text-foreground"
                                >
                                    Não quero instruções da IA agora
                                </Button>
                            </div>
                        </div>
                    )}

                    {step === "advice" && advisor && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div className="flex items-center justify-between">
                                <h3 className="font-bold flex items-center gap-2">
                                    <Sparkles className="h-5 w-5 text-primary" /> Sugestão da IA
                                </h3>
                                <Button variant="ghost" size="sm" onClick={() => setStep("profile")} className="text-xs h-8">
                                    <ArrowLeft className="mr-1 h-4 w-4" /> Ajustar Perfil
                                </Button>
                            </div>

                            <div className="p-4 bg-primary/2 border border-primary/5 rounded-2xl">
                                <p className="text-sm leading-relaxed text-foreground">
                                    {advisor.overview}
                                </p>
                            </div>

                            <div className="grid gap-3 sm:grid-cols-3">
                                {advisor.buckets.map((bucket) => (
                                    <div key={bucket.category} className="bg-card border border-white/[0.03] p-4 rounded-2xl shadow-sm">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{bucket.category}</span>
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">{bucket.percentage}%</span>
                                        </div>
                                        <div className="text-lg font-bold">
                                            R$ {bucket.suggestedAmount.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="pt-2">
                                <div className="flex items-center justify-between mb-4">
                                    <h4 className="text-sm font-bold flex items-center gap-2">
                                        <Lightbulb className="h-4 w-4 text-yellow-500" />
                                        Dicas por Categoria
                                    </h4>
                                    <Button
                                        onClick={applySuggestions}
                                        className="h-9 px-4 rounded-xl font-bold bg-primary hover:bg-primary/90 transition-all hover:scale-105"
                                    >
                                        <Check className="mr-2 h-4 w-4" /> Aplicar Orçamentos
                                    </Button>
                                </div>
                                <div className="grid gap-2">
                                    {advisor.categoryAdvice.filter(a => a.suggestedAmount > 0).map((advice) => (
                                        <div key={advice.categoryId} className="flex items-center justify-between p-3 bg-background/50 border border-white/[0.03] rounded-xl text-sm">
                                            <span className="font-medium">{advice.categoryName}</span>
                                            <div className="flex items-center gap-3">
                                                <span className="text-muted-foreground text-xs">Sugerido: <span className="text-foreground font-bold">R$ {advice.suggestedAmount.toFixed(0)}</span></span>
                                                <ArrowRight className="h-3 w-3 text-muted-foreground" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
