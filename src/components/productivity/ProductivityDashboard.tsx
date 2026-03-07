import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Zap, Trophy, Target, Flame, Brain, Sparkles,
    TrendingUp, AlertTriangle, Lightbulb, ArrowRight
} from 'lucide-react';
import { useProductivityStats } from '@/hooks/useProductivityStats';
import { useProductivity } from '@/hooks/useProductivity';
import { cn } from '@/lib/utils';
import {
    Dialog, DialogContent, DialogHeader,
    DialogTitle, DialogDescription, DialogFooter
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import {
    transformIdeaToProject,
    generateWeeklyPlan,
    getAIAdvisorNote
} from '@/lib/openai';

type AIProposal = {
    title: string;
    description: string;
    tasks: string[];
    color?: string;
};

export const ProductivityDashboard = ({ tasks = [], goals = [] }: { tasks: any[], goals: any[] }) => {
    const { stats, isLoading } = useProductivityStats();
    const { addProjectAsync, addTaskAsync, updateGoal } = useProductivity();

    // Modal States
    const [isIdeaModalOpen, setIsIdeaModalOpen] = React.useState(false);
    const [isWeeklyModalOpen, setIsWeeklyModalOpen] = React.useState(false);
    const [isRecalibrationModalOpen, setIsRecalibrationModalOpen] = React.useState(false);

    // AI Processing States
    const [ideaText, setIdeaText] = React.useState('');
    const [aiProposal, setAiProposal] = React.useState<AIProposal | null>(null);
    const [weeklyPlan, setWeeklyPlan] = React.useState<string[]>([]);
    const [isAILoading, setIsAILoading] = React.useState(false);
    const [aiNote, setAiNote] = React.useState<string>('Carregando conselho da IA...');
    const [aiError, setAiError] = React.useState<boolean>(false);

    const fetchAIAdvice = React.useCallback(async () => {
        if (!stats) return;
        setAiError(false);
        setIsAILoading(true);
        const completedToday = tasks.filter(t => t.status === 'completed').length;
        try {
            const note = await getAIAdvisorNote(stats, completedToday);
            setAiNote(note);
        } catch (error) {
            console.error("AI Advisor Error:", error);
            setAiNote("Mantenha o foco nas suas metas estratégicas hoje!");
            setAiError(true);
        } finally {
            setIsAILoading(false);
        }
    }, [stats, tasks]);

    React.useEffect(() => {
        if (!isLoading && stats) {
            fetchAIAdvice();
        }
    }, [stats, isLoading, fetchAIAdvice]);

    const handleGenerateWeeklyPlan = async () => {
        setIsAILoading(true);
        try {
            const plan = await generateWeeklyPlan(goals, tasks);
            setWeeklyPlan(plan);
        } catch (error) {
            toast.error("Erro ao gerar plano semanal.");
        } finally {
            setIsAILoading(false);
        }
    };

    const confirmWeeklyPlan = async () => {
        try {
            for (const task of weeklyPlan) {
                await addTaskAsync({
                    title: task,
                    status: 'todo',
                    scheduledStartTime: new Date().toISOString(),
                    estimatedDuration: 30,
                    impact: 8,
                    urgency: 7
                });
            }
            toast.success("Plano semanal agendado no seu Tático!");
            setIsWeeklyModalOpen(false);
            setWeeklyPlan([]);
        } catch (error) {
            toast.error("Erro ao agendar tarefas.");
        }
    };

    const handleGenerateIdea = async () => {
        if (!ideaText.trim()) return;
        setIsAILoading(true);
        try {
            const proposal = await transformIdeaToProject(ideaText);
            setAiProposal(proposal);
        } catch (error) {
            toast.error("Não consegui processar a ideia agora.");
        } finally {
            setIsAILoading(false);
        }
    };

    const confirmAIProject = async () => {
        if (!aiProposal) return;
        try {
            const project = await addProjectAsync({
                name: aiProposal.title,
                description: aiProposal.description,
                color: aiProposal.color || '#3b82f6',
                status: 'active'
            });

            if (project) {
                for (const taskTitle of aiProposal.tasks) {
                    await addTaskAsync({
                        title: taskTitle,
                        projectId: project.id,
                        status: 'todo',
                        scheduledStartTime: new Date().toISOString(),
                        estimatedDuration: 30,
                        impact: 5,
                        urgency: 5
                    });
                }
            }

            toast.success("Projeto criado com sucesso!");
            setAiProposal(null);
            setIdeaText('');
            setIsIdeaModalOpen(false);
        } catch (error) {
            toast.error("Erro ao criar projeto.");
        }
    };


    if (isLoading || !stats) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
                {[1, 2, 3].map(i => <div key={i} className="h-40 bg-white/[0.02] rounded-[32px] border border-white/[0.05]" />)}
            </div>
        );
    }

    const xpToNextLevel = (stats.level || 1) * 1000;
    const progressToNextLevel = Math.min(100, ((stats.experience || 0) / xpToNextLevel) * 100);
    const completedTasksToday = tasks.filter(t => t?.status === 'completed').length;
    const delayedTasks = tasks.filter(t => t?.status === 'delayed').length;
    const goalProgressAverage = goals.length > 0 ? goals.reduce((acc, g) => acc + (g.progress || 0), 0) / goals.length : 0;

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Top Stats: High Performance Mode */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2 bg-[#0d0d0d] border-white/[0.05] rounded-[40px] p-8 shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Brain className="w-32 h-32 text-primary" />
                    </div>

                    <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center">
                        <div className="relative">
                            <div className="w-32 h-32 rounded-full border-4 border-white/[0.03] flex items-center justify-center p-2">
                                <div className="w-full h-full rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                            </div>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-3xl font-black text-white italic">Lvl {stats.level}</span>
                                <span className="text-[10px] font-bold text-primary uppercase tracking-widest">{stats.experience}/{xpToNextLevel} XP</span>
                            </div>
                        </div>

                        <div className="flex-1 space-y-4 text-center md:text-left">
                            <div>
                                <h3 className="text-2xl font-black text-white/90 uppercase tracking-tight flex items-center justify-center md:justify-start gap-3">
                                    <Sparkles className="w-6 h-6 text-primary" strokeWidth={3} />
                                    Conselho do Mentor
                                </h3>
                                <div className="mt-2 min-h-[40px] flex items-center">
                                    {aiError ? (
                                        <div className="flex flex-col items-start gap-2">
                                            <p className="text-red-400/80 text-xs italic leading-relaxed">
                                                Não foi possível carregar o conselho agora (Limite de API atingido).
                                            </p>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={fetchAIAdvice}
                                                className="h-7 px-3 text-[10px] font-black uppercase tracking-widest bg-white/5 hover:bg-white/10"
                                            >
                                                Tentar Novamente
                                            </Button>
                                        </div>
                                    ) : (
                                        <p className="text-white/60 text-sm italic leading-relaxed">
                                            "{aiNote}"
                                        </p>
                                    )}
                                </div>
                            </div>
                            <div className="pt-2">
                                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">
                                    <span>Progresso do Nível</span>
                                    <span>{Math.round(progressToNextLevel)}%</span>
                                </div>
                                <Progress value={progressToNextLevel} className="h-2 bg-white/[0.05]" />
                            </div>
                        </div>
                    </div>
                </Card>

                <Card className="bg-[#0d0d0d] border-white/[0.05] rounded-[40px] p-8 flex flex-col items-center justify-center text-center space-y-4 hover:border-primary/20 transition-colors">
                    <div className="relative">
                        <Flame className={cn("w-12 h-12 mb-2", (stats.streakCurrent || 0) > 0 ? "text-orange-500 animate-pulse" : "text-white/10")} />
                        <div className="absolute -top-1 -right-1">
                            <Badge className="bg-orange-500 text-white border-none font-black text-[10px]">HOT</Badge>
                        </div>
                    </div>
                    <div>
                        <p className="text-4xl font-black text-white">{stats.streakCurrent || 0}</p>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Dias de Consistência</p>
                    </div>
                    <div className="flex gap-2">
                        <div className="flex -space-x-2">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="w-8 h-8 rounded-full border-2 border-[#0d0d0d] bg-white/[0.05] flex items-center justify-center">
                                    <Trophy className="w-4 h-4 text-yellow-500/50" />
                                </div>
                            ))}
                        </div>
                        <span className="text-[10px] font-black text-white/40 mt-2">{(stats.medals || []).length} Medalhas</span>
                    </div>
                </Card>
            </div>

            {/* Smart Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard
                    title="Missões HOJE"
                    value={completedTasksToday.toString()}
                    icon={<Zap className="w-4 h-4" />}
                    trend="Excelente ritmo"
                    color="primary"
                />
                <MetricCard
                    title="Meta Progress"
                    value={`${Math.round(goalProgressAverage)}%`}
                    icon={<Target className="w-4 h-4" />}
                    trend="+12% vs week"
                    color="blue"
                />
                <MetricCard
                    title="Foco Total"
                    value={`${Math.round((stats.totalFocusMinutes || 0) / 60)}h`}
                    icon={<Brain className="w-4 h-4" />}
                    trend="Meta: 40h/mês"
                    color="blue"
                />
                <MetricCard
                    title="Consistência"
                    value={(stats.points || 0).toString()}
                    icon={<TrendingUp className="w-4 h-4" />}
                    trend="Pontos de Mérito"
                    color="emerald"
                />
            </div>

            {/* AI Action Area */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                    <h2 className="text-xl font-black text-white/90 uppercase tracking-tighter flex items-center gap-3">
                        <Zap className="w-5 h-5 text-primary" /> Ativadores de Inteligência
                    </h2>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <button
                            onClick={() => setIsIdeaModalOpen(true)}
                            className="p-6 rounded-[32px] bg-primary/5 border border-primary/10 hover:bg-primary/10 transition-all text-left group"
                        >
                            <Lightbulb className="w-8 h-8 text-primary mb-4 group-hover:scale-110 transition-transform" />
                            <h4 className="text-sm font-black text-white/90 mb-1">Ideia para Projeto</h4>
                            <p className="text-[10px] text-white/40 leading-relaxed uppercase tracking-widest">Transforme uma frase em um plano de ação completo com IA.</p>
                        </button>

                        <button
                            onClick={() => setIsWeeklyModalOpen(true)}
                            className="p-6 rounded-[32px] bg-blue-500/5 border border-blue-500/10 hover:bg-blue-500/10 transition-all text-left group"
                        >
                            <Sparkles className="w-8 h-8 text-blue-500 mb-4 group-hover:scale-110 transition-transform" />
                            <h4 className="text-sm font-black text-white/90 mb-1">Plano Semanal IA</h4>
                            <p className="text-[10px] text-white/40 leading-relaxed uppercase tracking-widest">A IA analisa suas metas e sugere 3 ações críticas para a semana.</p>
                        </button>

                        <button
                            onClick={() => setIsRecalibrationModalOpen(true)}
                            className="p-6 rounded-[32px] bg-emerald-500/5 border border-emerald-500/10 hover:bg-emerald-500/10 transition-all text-left group"
                        >
                            <Target className="w-8 h-8 text-emerald-500 mb-4 group-hover:scale-110 transition-transform" />
                            <h4 className="text-sm font-black text-white/90 mb-1">Goal Guard</h4>
                            <p className="text-[10px] text-white/40 leading-relaxed uppercase tracking-widest">Recalibre metas atrasadas e ajuste prazos automaticamente.</p>
                        </button>

                        <div className="p-6 rounded-[32px] bg-orange-500/5 border border-orange-500/10 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <AlertTriangle className="w-6 h-6 text-orange-500" />
                                <div>
                                    <p className="text-xs font-black text-white/90 uppercase tracking-tighter">{delayedTasks} Atrasadas</p>
                                    <p className="text-[9px] text-white/40 font-bold uppercase tracking-widest">Aja agora para não perder o streak</p>
                                </div>
                            </div>
                            <ArrowRight className="w-4 h-4 text-white/20" />
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <h2 className="text-xl font-black text-white/90 uppercase tracking-tighter flex items-center gap-3">
                        <Trophy className="w-5 h-5 text-yellow-500" /> Medalhas de Conquista
                    </h2>
                    <Card className="bg-[#0d0d0d] border-white/[0.05] rounded-[40px] p-8 h-[280px] flex items-center justify-center text-center">
                        <div className="space-y-4">
                            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto border border-white/5">
                                <Trophy className="w-8 h-8 text-white/10" />
                            </div>
                            <p className="text-xs font-black text-white/40 uppercase tracking-[0.2em]">Próxima medalha em 5 tarefas</p>
                            <div className="w-48 h-1.5 bg-white/5 rounded-full overflow-hidden mx-auto">
                                <div className="w-1/2 h-full bg-yellow-500/50" />
                            </div>
                        </div>
                    </Card>
                </div>
            </div>

            {/* AI Action Dialogs */}

            {/* 1. Idea Transformer */}
            <Dialog open={isIdeaModalOpen} onOpenChange={setIsIdeaModalOpen}>
                <DialogContent className="sm:max-w-[600px] bg-[#0d0d0d] border-white/[0.05] rounded-[40px] p-8">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-black text-white/90 uppercase tracking-tight flex items-center gap-3">
                            <Lightbulb className="w-6 h-6 text-primary" /> Transformador de Ideias
                        </DialogTitle>
                        <DialogDescription className="text-white/40 text-xs uppercase tracking-widest font-bold">
                            Descreva uma ideia em uma frase e a IA criará um projeto estruturado.
                        </DialogDescription>
                    </DialogHeader>

                    {!aiProposal ? (
                        <div className="py-6 space-y-4">
                            <Textarea
                                placeholder="Ex: Criar um curso de investimentos em 30 dias..."
                                value={ideaText}
                                onChange={(e) => setIdeaText(e.target.value)}
                                className="min-h-[120px] bg-white/[0.02] border-white/[0.05] rounded-2xl resize-none text-white/80 placeholder:text-white/20 focus-visible:ring-primary/30"
                            />
                            <Button
                                onClick={handleGenerateIdea}
                                disabled={isAILoading || !ideaText.trim()}
                                className="w-full bg-primary text-white rounded-xl h-12 font-black uppercase text-[10px] tracking-widest shadow-lg shadow-primary/20"
                            >
                                {isAILoading ? "IA Processando..." : "Converter em Projeto"}
                            </Button>
                        </div>
                    ) : (
                        <div className="py-6 space-y-6 animate-in fade-in slide-in-from-bottom-4">
                            <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/[0.05] space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: aiProposal.color }} />
                                    <h4 className="text-lg font-black text-white">{aiProposal.title}</h4>
                                </div>
                                <p className="text-sm text-white/60 leading-relaxed">{aiProposal.description}</p>
                                <div className="space-y-2">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Tarefas Sugeridas:</p>
                                    <div className="grid grid-cols-1 gap-2">
                                        {aiProposal.tasks.map((task, i) => (
                                            <div key={i} className="flex items-center gap-2 text-xs text-white/70">
                                                <div className="w-1 h-1 rounded-full bg-primary" /> {task}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <Button onClick={() => setAiProposal(null)} variant="ghost" className="flex-1 rounded-xl h-12 font-black uppercase text-[10px] tracking-widest">
                                    Refazer
                                </Button>
                                <Button onClick={confirmAIProject} className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl h-12 font-black uppercase text-[10px] tracking-widest">
                                    Confirmar Projeto
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* 2. Weekly Plan Modal */}
            <Dialog open={isWeeklyModalOpen} onOpenChange={setIsWeeklyModalOpen}>
                <DialogContent className="sm:max-w-[600px] bg-[#0d0d0d] border-white/[0.05] rounded-[40px] p-8">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-black text-white/90 uppercase tracking-tight flex items-center gap-3">
                            <Sparkles className="w-6 h-6 text-primary" /> Planejador Semanal IA
                        </DialogTitle>
                    </DialogHeader>
                    <div className="py-6 space-y-6">
                        {weeklyPlan.length === 0 ? (
                            <div className="py-12 flex flex-col items-center justify-center text-center">
                                <Zap className={cn("w-12 h-12 mb-4 text-primary", isAILoading && "animate-pulse")} />
                                <p className="text-xs font-black uppercase tracking-[0.2em]">{isAILoading ? "IA Analisando Metas..." : "Pronto para Planejar"}</p>
                                <Button
                                    onClick={handleGenerateWeeklyPlan}
                                    disabled={isAILoading}
                                    className="mt-6 bg-primary/10 text-primary border border-primary/20 rounded-xl px-8"
                                >
                                    Gerar Novo Plano
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                                <div className="space-y-3">
                                    {weeklyPlan.map((sug, i) => (
                                        <div key={i} className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05] text-xs text-white/70 flex gap-3">
                                            <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1 shadow-[0_0_8px_primary]" />
                                            {sug}
                                        </div>
                                    ))}
                                </div>
                                <div className="flex gap-4 pt-4 border-t border-white/[0.05]">
                                    <Button onClick={() => setWeeklyPlan([])} variant="ghost" className="flex-1 rounded-xl font-black uppercase text-[10px] tracking-widest">
                                        Limpar
                                    </Button>
                                    <Button onClick={confirmWeeklyPlan} className="flex-1 bg-primary text-white rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-primary/20">
                                        Agendar Tudo
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* 3. Goal Recalibration Modal */}
            <Dialog open={isRecalibrationModalOpen} onOpenChange={setIsRecalibrationModalOpen}>
                <DialogContent className="sm:max-w-[600px] bg-[#0d0d0d] border-white/[0.05] rounded-[40px] p-8">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-black text-white/90 uppercase tracking-tight flex items-center gap-3">
                            <Target className="w-6 h-6 text-emerald-500" /> Goal Guard: Recalibração
                        </DialogTitle>
                    </DialogHeader>

                    <div className="py-6 space-y-6">
                        <p className="text-xs text-muted-foreground uppercase tracking-widest font-black">Metas com Atraso ou Baixo Progresso:</p>

                        <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                            {(goals || []).filter(g => (g?.progress || 0) < 50 && g?.status !== 'achieved').map(goal => (
                                <div key={goal?.id} className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05] flex items-center justify-between">
                                    <div>
                                        <p className="text-xs font-bold text-white/90">{goal?.title}</p>
                                        <p className="text-[10px] text-red-500/60 font-medium">Progresso: {goal?.progress || 0}%</p>
                                    </div>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => {
                                            if (goal?.id) updateGoal(goal.id, { targetDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() });
                                            toast.success(`Prazo de "${goal?.title}" estendido em 7 dias.`);
                                        }}
                                        className="h-8 rounded-lg text-[9px] font-black uppercase border-emerald-500/20 text-emerald-500"
                                    >
                                        Adiar 7d
                                    </Button>
                                </div>
                            ))}
                            {(goals || []).filter(g => (g?.progress || 0) < 50 && g?.status !== 'achieved').length === 0 && (
                                <p className="text-center py-8 text-xs text-muted-foreground font-medium">Todas as metas estão em dia! 🎯</p>
                            )}
                        </div>

                        <DialogFooter>
                            <Button
                                onClick={() => setIsRecalibrationModalOpen(false)}
                                className="w-full bg-white/[0.05] hover:bg-white/[0.1] text-white rounded-xl h-12 font-black uppercase text-[10px] tracking-widest"
                            >
                                Fechar Análise
                            </Button>
                        </DialogFooter>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

interface MetricCardProps {
    title: string;
    value: string;
    icon: React.ReactNode;
    trend: string;
    color: 'blue' | 'primary' | 'emerald';
}

const MetricCard = ({ title, value, icon, trend, color }: MetricCardProps) => (
    <Card className="bg-white/[0.02] border-white/[0.05] rounded-[32px] p-6 hover:bg-white/[0.03] transition-all">
        <div className="flex items-center justify-between mb-4">
            <div className={cn("p-2 rounded-xl",
                color === 'blue' ? "bg-blue-500/10 text-blue-500" :
                    color === 'primary' ? "bg-primary/10 text-primary" :
                        "bg-emerald-500/10 text-emerald-500"
            )}>
                {icon}
            </div>
            <span className="text-[10px] font-medium text-muted-foreground">{trend}</span>
        </div>
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">{title}</p>
        <p className="text-2xl font-black text-white/90">{value}</p>
    </Card>
);
