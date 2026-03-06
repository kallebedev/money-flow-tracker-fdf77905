import React, { useState } from 'react';
import { Goal, Project } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Target, Briefcase, Plus, CheckCircle2, Circle, Trophy, Trash2, Pencil, X, Check } from 'lucide-react';
import { useProductivity } from '@/hooks/useProductivity';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const StrategicView: React.FC = () => {
    const {
        goals, projects,
        addGoal, deleteGoal, updateGoal, toggleGoalStatus,
        addProject, deleteProject, updateProject, toggleProjectStatus
    } = useProductivity();

    const [newGoal, setNewGoal] = useState('');
    const [newProject, setNewProject] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editValue, setEditValue] = useState('');

    const submitGoal = (type: 'annual' | 'monthly') => {
        if (!newGoal.trim()) return;
        addGoal({
            title: newGoal.trim(),
            type,
            targetDate: new Date().toISOString(),
            status: 'pending'
        });
        setNewGoal('');
        toast.success(`Meta ${type === 'annual' ? 'anual' : 'mensal'} adicionada!`);
    };

    const submitProject = () => {
        if (!newProject.trim()) return;
        addProject({
            name: newProject.trim(),
            color: 'hsl(var(--primary))',
            status: 'active'
        });
        setNewProject('');
        toast.success('Projeto criado!');
    };

    const handleStartEdit = (id: string, currentTitle: string) => {
        setEditingId(id);
        setEditValue(currentTitle);
    };

    const handleSaveEditGoal = (id: string) => {
        if (!editValue.trim()) return;
        updateGoal(id, { title: editValue.trim() });
        setEditingId(null);
        toast.success('Meta atualizada');
    };

    const handleSaveEditProject = (id: string) => {
        if (!editValue.trim()) return;
        updateProject(id, { name: editValue.trim() });
        setEditingId(null);
        toast.success('Projeto atualizado');
    };

    const renderGoalItem = (goal: Goal) => (
        <div key={goal.id} className="flex items-center justify-between p-3 rounded-xl bg-background/30 border border-white/[0.03] hover:border-primary/20 transition-all group">
            <div className="flex items-center gap-3 flex-1 min-w-0">
                <button onClick={() => toggleGoalStatus(goal.id)} className="shrink-0">
                    {goal.status === 'achieved' ?
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" /> :
                        <Circle className="w-5 h-5 text-muted-foreground hover:text-primary transition-colors" />
                    }
                </button>

                {editingId === goal.id ? (
                    <div className="flex items-center gap-2 flex-1">
                        <Input
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSaveEditGoal(goal.id)}
                            className="h-8 text-sm py-0"
                            autoFocus
                        />
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-emerald-500" onClick={() => handleSaveEditGoal(goal.id)}>
                            <Check className="w-4 h-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground" onClick={() => setEditingId(null)}>
                            <X className="w-4 h-4" />
                        </Button>
                    </div>
                ) : (
                    <span className={cn(
                        "text-sm font-medium truncate",
                        goal.status === 'achieved' && "line-through opacity-40 text-muted-foreground"
                    )}>
                        {goal.title}
                    </span>
                )}
            </div>

            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2 shrink-0">
                {goal.status === 'achieved' && <Trophy className="w-4 h-4 text-amber-500 mr-1" />}
                {editingId !== goal.id && (
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => handleStartEdit(goal.id, goal.title)}>
                        <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                    </Button>
                )}
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:text-destructive hover:bg-destructive/10" onClick={() => deleteGoal(goal.id)}>
                    <Trash2 className="w-3.5 h-3.5 text-muted-foreground" />
                </Button>
            </div>
        </div>
    );

    return (
        <div className="grid gap-8 lg:grid-cols-2">
            {/* Goals Column */}
            <div className="space-y-8">
                <Card className="border-primary/5 bg-primary/[0.01] rounded-[32px] overflow-hidden shadow-2xl ring-1 ring-white/[0.03]">
                    <CardHeader className="pb-4">
                        <CardTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-xl">
                                <Target className="w-5 h-5 text-primary" />
                            </div>
                            Metas Estratégicas
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-8">
                        <div className="flex gap-2 p-1 bg-background/50 border border-white/[0.03] rounded-2xl">
                            <Input
                                placeholder="Defina um novo norte..."
                                value={newGoal}
                                onChange={(e) => setNewGoal(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && submitGoal('monthly')}
                                className="h-11 bg-transparent border-none focus-visible:ring-0 text-sm font-medium"
                            />
                            <div className="flex gap-1 pr-1">
                                <Button size="sm" onClick={() => submitGoal('monthly')} className="h-9 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95 shadow-lg shadow-primary/20">Mensal</Button>
                                <Button size="sm" onClick={() => submitGoal('annual')} variant="outline" className="h-9 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest border-white/[0.05] hover:bg-white/[0.03]">Anual</Button>
                            </div>
                        </div>

                        {/* Monthly Goals */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between px-2">
                                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-60">Foco do Mês</h4>
                                <Badge variant="outline" className="text-[9px] border-primary/20 text-primary">{goals.filter(g => g.type === 'monthly').length}</Badge>
                            </div>
                            <div className="space-y-2">
                                {goals.filter(g => g.type === 'monthly').length === 0 ? (
                                    <p className="text-xs text-center py-8 text-muted-foreground italic border border-dashed border-white/[0.03] rounded-2xl bg-white/[0.01]">Defina suas prioridades imediatas.</p>
                                ) : (
                                    goals.filter(g => g.type === 'monthly').map(goal => renderGoalItem(goal))
                                )}
                            </div>
                        </div>

                        {/* Annual Goals */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between px-2">
                                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-60">Visão de Longo Prazo</h4>
                                <Badge variant="outline" className="text-[9px] border-amber-500/20 text-amber-500">{goals.filter(g => g.type === 'annual').length}</Badge>
                            </div>
                            <div className="space-y-2">
                                {goals.filter(g => g.type === 'annual').length === 0 ? (
                                    <p className="text-xs text-center py-8 text-muted-foreground italic border border-dashed border-white/[0.03] rounded-2xl bg-white/[0.01]">Aonde você quer estar no final do ano?</p>
                                ) : (
                                    goals.filter(g => g.type === 'annual').map(goal => renderGoalItem(goal))
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Projects Column */}
            <div className="space-y-8">
                <Card className="bg-card/20 border-white/[0.03] rounded-[32px] overflow-hidden shadow-2xl ring-1 ring-white/[0.03]">
                    <CardHeader className="pb-4 flex flex-row items-center justify-between">
                        <CardTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-3">
                            <div className="p-2 bg-white/[0.03] rounded-xl">
                                <Briefcase className="w-5 h-5 text-muted-foreground" />
                            </div>
                            Sistemas & Projetos
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-8">
                        <div className="flex gap-2 p-1 bg-background/50 border border-white/[0.03] rounded-2xl">
                            <Input
                                placeholder="Novo projeto estrutural..."
                                value={newProject}
                                onChange={(e) => setNewProject(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && submitProject()}
                                className="h-11 bg-transparent border-none focus-visible:ring-0 text-sm font-medium"
                            />
                            <div className="pr-1">
                                <Button size="sm" onClick={submitProject} className="h-9 px-6 rounded-xl text-[10px] font-black uppercase tracking-widest bg-white/[0.05] hover:bg-white/[0.08] text-foreground border border-white/[0.05]">Criar</Button>
                            </div>
                        </div>

                        <div className="grid gap-4">
                            {projects.length === 0 ? (
                                <div className="text-center py-12 border border-dashed border-white/[0.05] rounded-[32px] bg-white/[0.01]">
                                    <Briefcase className="w-8 h-8 mx-auto text-muted-foreground/20 mb-3" />
                                    <p className="text-xs text-muted-foreground font-medium">Nenhum projeto estruturado ainda.</p>
                                </div>
                            ) : (
                                projects.map(project => (
                                    <div key={project.id} className={cn(
                                        "p-6 rounded-[32px] bg-card/40 border border-white/[0.03] hover:border-primary/10 transition-all group relative overflow-hidden ring-1 ring-white/[0.03]",
                                        project.status === 'completed' && "opacity-60 grayscale-[0.5]"
                                    )}>
                                        <div className="flex justify-between items-start mb-6 relative z-10">
                                            <div className="flex items-start gap-4 flex-1 min-w-0">
                                                <button
                                                    onClick={() => toggleProjectStatus(project.id)}
                                                    className="mt-0.5 hover:scale-110 transition-transform shrink-0"
                                                >
                                                    {project.status === 'completed' ?
                                                        <CheckCircle2 className="w-6 h-6 text-emerald-500" /> :
                                                        <Circle className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
                                                    }
                                                </button>

                                                {editingId === project.id ? (
                                                    <div className="flex items-center gap-2 flex-1">
                                                        <Input
                                                            value={editValue}
                                                            onChange={(e) => setEditValue(e.target.value)}
                                                            onKeyDown={(e) => e.key === 'Enter' && handleSaveEditProject(project.id)}
                                                            className="h-8 text-sm font-bold bg-background/50 border-white/[0.1]"
                                                            autoFocus
                                                        />
                                                        <Button size="icon" variant="ghost" className="h-7 w-7 text-emerald-500" onClick={() => handleSaveEditProject(project.id)}>
                                                            <Check className="w-4 h-4" />
                                                        </Button>
                                                        <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground" onClick={() => setEditingId(null)}>
                                                            <X className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <div className="min-w-0">
                                                        <h4 className={cn(
                                                            "font-black text-lg tracking-tight leading-tight truncate",
                                                            project.status === 'completed' && "line-through text-muted-foreground"
                                                        )}>{project.name}</h4>
                                                        <Badge variant="outline" className={cn(
                                                            "text-[9px] font-black uppercase tracking-widest mt-2 border-none px-0",
                                                            project.status === 'completed' ? "text-emerald-500" : "text-primary"
                                                        )}>
                                                            {project.status === 'completed' ? 'Missão Cumprida' : 'Execução Ativa'}
                                                        </Badge>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                                {editingId !== project.id && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-9 w-9 rounded-xl hover:bg-white/5"
                                                        onClick={() => handleStartEdit(project.id, project.name)}
                                                    >
                                                        <Pencil className="w-4 h-4 text-muted-foreground" />
                                                    </Button>
                                                )}
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-9 w-9 rounded-xl hover:text-destructive hover:bg-destructive/10"
                                                    onClick={() => deleteProject(project.id)}
                                                >
                                                    <Trash2 className="w-4 h-4 text-muted-foreground" />
                                                </Button>
                                            </div>
                                        </div>

                                        <div className="space-y-3 relative z-10">
                                            <div className="flex justify-between items-end">
                                                <div className="space-y-1">
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-50">Impacto Estratégico</p>
                                                    <p className="text-xs font-bold">{project.status === 'completed' ? '100%' : 'Em andamento'}</p>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-[10px] font-black font-mono-numbers">{project.status === 'completed' ? '100%' : '0%'}</span>
                                                </div>
                                            </div>
                                            <Progress value={project.status === 'completed' ? 100 : 0} className="h-1.5 bg-white/[0.03]" />
                                        </div>

                                        {project.status === 'completed' && (
                                            <div className="absolute top-0 right-0 p-4 opacity-[0.03] scale-150 -rotate-12 group-hover:scale-175 transition-transform">
                                                <Trophy className="w-24 h-24" />
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default StrategicView;
