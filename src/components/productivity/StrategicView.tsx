import React, { useState, useEffect } from 'react';
import { Goal, Project, parseGoalMeta, stringifyGoalMeta, parseProjectMeta } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
    Target, Briefcase, Plus, CheckCircle2, Circle, Trophy, Trash2,
    Pencil, X, Check, Youtube, Play, Folder, FileText,
    ChevronRight, Save, ArrowLeft, Search, Clock3, Calendar, Repeat
} from 'lucide-react';
import { useProductivity } from '@/hooks/useProductivity';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { YoutubePlayerDialog } from './YoutubePlayerDialog';
import { RichTextEditor } from './RichTextEditor';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";

type DocItem = {
    id: string; name: string; type: 'file' | 'folder'; content?: string; parentId: string | null; createdAt: number;
};

const PROJECT_STATUSES = [
    { value: 'planning', label: 'Planejamento', color: 'text-blue-400 bg-blue-500/10' },
    { value: 'active', label: 'Em Execução', color: 'text-emerald-400 bg-emerald-500/10' },
    { value: 'on-hold', label: 'Pausado', color: 'text-amber-400 bg-amber-500/10' },
    { value: 'completed', label: 'Concluído', color: 'text-muted-foreground bg-white/[0.05]' },
];

const DAY_LABELS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

const mergeItemsIntoGoalNotes = (goal: Goal, items: DocItem[]) => {
    const parsed = parseGoalMeta(goal.notes);
    return stringifyGoalMeta({ ...parsed, items });
};

const StrategicView: React.FC = () => {
    const {
        tasks, goals, projects,
        addGoal, deleteGoal, updateGoal, toggleGoalStatus,
        addProject, deleteProject, updateProject, toggleProjectStatus
    } = useProductivity();

    const [newGoal, setNewGoal] = useState('');
    const [newGoalDailyTarget, setNewGoalDailyTarget] = useState('');
    const [newGoalYoutubeLink, setNewGoalYoutubeLink] = useState('');
    const [showNewGoalYoutubeInput, setShowNewGoalYoutubeInput] = useState(false);
    const [newGoalFrequency, setNewGoalFrequency] = useState<'daily' | 'specific-days'>('daily');
    const [newGoalFrequencyDays, setNewGoalFrequencyDays] = useState<number[]>([1, 2, 3, 4, 5]);
    const [newProject, setNewProject] = useState('');
    const [newProjectDesc, setNewProjectDesc] = useState('');
    const [newProjectObjective, setNewProjectObjective] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editValue, setEditValue] = useState('');
    const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
    const [editProjectName, setEditProjectName] = useState('');
    const [editProjectDesc, setEditProjectDesc] = useState('');
    const [editProjectObjective, setEditProjectObjective] = useState('');

    // YouTube states
    const [editingYoutubeId, setEditingYoutubeId] = useState<string | null>(null);
    const [youtubeLinkValue, setYoutubeLinkValue] = useState('');
    const [activeVideoGoal, setActiveVideoGoal] = useState<Goal | null>(null);
    const [videoProgressMap, setVideoProgressMap] = useState<Record<string, number>>({});

    // Documentation System States
    const [docGoal, setDocGoal] = useState<Goal | null>(null);
    const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
    const [activeFileId, setActiveFileId] = useState<string | null>(null);
    const [fileSystem, setFileSystem] = useState<DocItem[]>([]);
    const [noteDraft, setNoteDraft] = useState<string>('');
    const [searchTerm, setSearchTerm] = useState('');
    const [editingDocId, setEditingDocId] = useState<string | null>(null);
    const [editNameValue, setEditNameValue] = useState('');

    useEffect(() => {
        if (docGoal) {
            try {
                if (docGoal.notes && docGoal.notes.startsWith('{')) {
                    const parsed = JSON.parse(docGoal.notes);
                    setFileSystem(parsed.items || []);
                } else {
                    setFileSystem(docGoal.notes ? [{ id: 'root-doc', name: 'Anotações Iniciais', type: 'file' as const, content: docGoal.notes || '', parentId: null, createdAt: Date.now() }] : []);
                }
            } catch { setFileSystem([]); }
        } else {
            setFileSystem([]); setCurrentFolderId(null); setActiveFileId(null);
        }
    }, [docGoal]);

    const submitGoal = (type: 'annual' | 'monthly') => {
        if (!newGoal.trim()) return;
        const parsedDailyTarget = Number(newGoalDailyTarget);
        const hasDailyTarget = Number.isFinite(parsedDailyTarget) && parsedDailyTarget > 0;

        let finalUrl = newGoalYoutubeLink.trim();
        if (finalUrl) {
            const urlMatch = finalUrl.match(/https?:\/\/[^\s]+/);
            if (urlMatch) finalUrl = urlMatch[0];
            if (!/^https?:\/\//i.test(finalUrl) && (finalUrl.includes('youtube.com') || finalUrl.includes('youtu.be'))) finalUrl = 'https://' + finalUrl;
        }

        const meta: any = {};
        if (hasDailyTarget) meta.dailyTargetMinutes = Math.round(parsedDailyTarget);
        meta.frequency = newGoalFrequency;
        if (newGoalFrequency === 'specific-days') meta.frequencyDays = newGoalFrequencyDays;

        addGoal({
            title: newGoal.trim(), type, targetDate: new Date().toISOString(),
            youtubeLink: finalUrl || undefined,
            notes: Object.keys(meta).length > 0 ? stringifyGoalMeta(meta) : undefined,
            status: 'pending'
        });

        setNewGoal(''); setNewGoalDailyTarget(''); setNewGoalYoutubeLink('');
        setShowNewGoalYoutubeInput(false); setNewGoalFrequency('daily'); setNewGoalFrequencyDays([1, 2, 3, 4, 5]);
        toast.success(`Meta ${type === 'annual' ? 'anual' : 'mensal'} adicionada!`);
    };

    const submitProject = () => {
        if (!newProject.trim()) return;
        const desc = newProjectDesc.trim() || newProjectObjective.trim()
            ? JSON.stringify({ description: newProjectDesc.trim(), objective: newProjectObjective.trim() }) : undefined;
        addProject({ name: newProject.trim(), description: desc, color: 'hsl(var(--primary))', status: 'planning' });
        setNewProject(''); setNewProjectDesc(''); setNewProjectObjective('');
        toast.success('Projeto criado!');
    };

    const handleStartEdit = (id: string, currentTitle: string) => { setEditingId(id); setEditValue(currentTitle); };
    const handleSaveEditGoal = (id: string) => { if (!editValue.trim()) return; updateGoal(id, { title: editValue.trim() }); setEditingId(null); toast.success('Meta atualizada'); };
    const handleSaveEditProject = (id: string) => {
        const desc = JSON.stringify({ description: editProjectDesc, objective: editProjectObjective });
        updateProject(id, { name: editProjectName, description: desc });
        setEditingProjectId(null); toast.success('Projeto atualizado');
    };
    const handleSaveYoutubeLink = (id: string) => {
        let finalUrl = youtubeLinkValue.trim();
        if (!finalUrl) { toast.error('O link não pode estar vazio.'); return; }
        const urlMatch = finalUrl.match(/https?:\/\/[^\s]+/);
        if (urlMatch) finalUrl = urlMatch[0];
        if (!/^https?:\/\//i.test(finalUrl) && (finalUrl.includes('youtube.com') || finalUrl.includes('youtu.be'))) finalUrl = 'https://' + finalUrl;
        updateGoal(id, { youtubeLink: finalUrl }); setEditingYoutubeId(null); setYoutubeLinkValue(''); toast.success('Link atualizado!');
    };
    const handleLiveProgressUpdate = (goalId: string, globalProgress: number) => { setVideoProgressMap(prev => ({ ...prev, [goalId]: globalProgress })); };
    const handleSaveProgress = (goalId: string, progress: number, timestamp: number) => {
        const goal = goals.find(g => g.id === goalId);
        if (!goal) return;
        const updates: Partial<Goal> = {};
        let shouldUpdate = false;
        if (progress !== goal.progress) { updates.progress = progress; shouldUpdate = true; }
        if (timestamp !== goal.youtubeTimestamp) { updates.youtubeTimestamp = timestamp; shouldUpdate = true; }
        if (shouldUpdate) {
            if (progress >= 95 && goal.status !== 'achieved') { updates.progress = 100; updates.status = 'achieved'; toast.success('Meta concluída pelo progresso do vídeo!'); }
            updateGoal(goalId, updates);
        }
    };

    // File System Helpers
    const persistFileSystem = (items: DocItem[]) => { if (!docGoal) return; updateGoal(docGoal.id, { notes: mergeItemsIntoGoalNotes(docGoal, items) }); };
    const handleCreateItem = (type: 'file' | 'folder') => {
        const newItem: DocItem = { id: Math.random().toString(36).substr(2, 9), name: type === 'file' ? 'Novo Documento' : 'Nova Pasta', type, content: '', parentId: currentFolderId, createdAt: Date.now() };
        const updated = [...fileSystem, newItem]; setFileSystem(updated); persistFileSystem(updated);
        if (type === 'file') { setActiveFileId(newItem.id); setNoteDraft(''); }
        toast.success(type === 'file' ? 'Documento criado!' : 'Pasta criada!');
    };
    const handleDeleteItem = (id: string) => {
        const getIdsToDelete = (parentId: string): string[] => {
            const children = fileSystem.filter(i => i.parentId === parentId);
            let ids = [parentId];
            children.forEach(c => { if (c.type === 'folder') ids = [...ids, ...getIdsToDelete(c.id)]; else ids.push(c.id); });
            return ids;
        };
        const idsToDelete = new Set(getIdsToDelete(id));
        const updated = fileSystem.filter(item => !idsToDelete.has(item.id)); setFileSystem(updated); persistFileSystem(updated);
        if (activeFileId && idsToDelete.has(activeFileId)) setActiveFileId(null);
        toast.success('Item removido!');
    };
    const handleSaveFileContent = () => { if (!activeFileId) return; const updated = fileSystem.map(item => item.id === activeFileId ? { ...item, content: noteDraft } : item); setFileSystem(updated); persistFileSystem(updated); toast.success('Documento salvo!'); };
    const handleRenameDoc = (id: string) => { if (!editNameValue.trim()) return; const updated = fileSystem.map(item => item.id === id ? { ...item, name: editNameValue.trim() } : item); setFileSystem(updated); persistFileSystem(updated); setEditingDocId(null); toast.success('Renomeado!'); };
    const openDocFile = (docId: string) => { const doc = fileSystem.find(i => i.id === docId); if (doc && doc.type === 'file') { setActiveFileId(doc.id); setNoteDraft(doc.content || ''); } };

    const displayedItems = searchTerm.trim()
        ? fileSystem.filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()))
        : fileSystem.filter(item => item.parentId === currentFolderId);

    const breadcrumbs: DocItem[] = [];
    let tempId = currentFolderId;
    while (tempId) { const folder = fileSystem.find(i => i.id === tempId); if (folder) { breadcrumbs.unshift(folder); tempId = folder.parentId; } else break; }

    const renderGoalItem = (goal: Goal) => {
        const currentProgress = videoProgressMap[goal.id] !== undefined ? videoProgressMap[goal.id] : (goal.progress || 0);
        const meta = parseGoalMeta(goal.notes);

        return (
            <div key={goal.id} className="flex flex-col gap-2 p-3 rounded-xl bg-background/30 border border-white/[0.03] hover:border-primary/20 transition-all group">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                        <button onClick={() => toggleGoalStatus(goal.id)} className="shrink-0">
                            {goal.status === 'achieved' ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <Circle className="w-5 h-5 text-muted-foreground hover:text-primary transition-colors" />}
                        </button>
                        {editingId === goal.id ? (
                            <div className="flex items-center gap-2 flex-1">
                                <Input value={editValue} onChange={(e) => setEditValue(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSaveEditGoal(goal.id)} className="h-8 text-sm py-0" autoFocus />
                                <Button size="icon" variant="ghost" className="h-7 w-7 text-emerald-500" onClick={() => handleSaveEditGoal(goal.id)}><Check className="w-4 h-4" /></Button>
                                <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground" onClick={() => setEditingId(null)}><X className="w-4 h-4" /></Button>
                            </div>
                        ) : (
                            <span className={cn("text-sm font-medium break-words flex items-center gap-2 flex-wrap", goal.status === 'achieved' && "line-through opacity-40 text-muted-foreground")}>
                                {goal.title}
                                {meta.dailyTargetMinutes && (
                                    <Badge variant="outline" className="text-[9px] border-none bg-primary/10 text-primary px-1 py-0 h-4">
                                        <Clock3 className="w-2.5 h-2.5 mr-0.5" /> {meta.dailyTargetMinutes} min/dia
                                    </Badge>
                                )}
                                {meta.frequency && (
                                    <Badge variant="outline" className="text-[9px] border-none bg-amber-500/10 text-amber-500 px-1 py-0 h-4">
                                        {meta.frequency === 'daily' ? <><Repeat className="w-2.5 h-2.5 mr-0.5" /> Diário</> : <><Calendar className="w-2.5 h-2.5 mr-0.5" /> {meta.frequencyDays?.map(d => DAY_LABELS[d]).join(',')}</>}
                                    </Badge>
                                )}
                                {goal.youtubeLink && (
                                    <Badge variant="outline" className="text-[9px] border-none bg-red-500/10 text-red-500 px-1 py-0 h-4 cursor-pointer" onClick={() => setActiveVideoGoal(goal)}>
                                        <Play className="w-2.5 h-2.5 mr-0.5" /> Vídeo
                                    </Badge>
                                )}
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2 shrink-0">
                        {goal.status === 'achieved' && <Trophy className="w-4 h-4 text-amber-500 mr-1" />}
                        {editingId !== goal.id && editingYoutubeId !== goal.id && (
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:text-red-500 hover:bg-red-500/10" onClick={() => { setEditingYoutubeId(goal.id); setYoutubeLinkValue(goal.youtubeLink || ''); }}>
                                <Youtube className="w-3.5 h-3.5" />
                            </Button>
                        )}
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

                {editingYoutubeId === goal.id && (
                    <div className="flex items-center gap-2 mt-2 pl-8 border-t border-white/[0.05] pt-3">
                        <Youtube className="w-4 h-4 text-red-500 shrink-0" />
                        <Input value={youtubeLinkValue} onChange={(e) => setYoutubeLinkValue(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSaveYoutubeLink(goal.id)} className="h-8 text-xs py-0 bg-background/50 border-white/[0.1]" placeholder="Link do YouTube ou Playlist..." autoFocus />
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground" onClick={() => setEditingYoutubeId(null)}><X className="w-4 h-4" /></Button>
                    </div>
                )}

                {goal.youtubeLink && (
                    <div className="pl-8 pr-2 w-full">
                        <div className="mt-3 flex items-center justify-between gap-3 cursor-pointer" onClick={() => setActiveVideoGoal(goal)}>
                            <Progress value={currentProgress} className="h-1 bg-white/[0.05]" />
                            <span className="text-[9px] font-mono text-muted-foreground">{currentProgress}%</span>
                        </div>
                    </div>
                )}

                <div className="mt-4 pl-8 border-t border-white/[0.03] pt-4">
                    <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/[0.03] cursor-pointer transition-all group/drive active:scale-[0.98]" onClick={() => setDocGoal(goal)}>
                        <div className="p-2 bg-blue-500/10 rounded-lg group-hover/drive:bg-blue-500/20 transition-colors"><Folder className="w-4 h-4 text-blue-500" /></div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-foreground/80 group-hover/drive:text-blue-400 transition-colors">Pasta de Documentos</p>
                            <p className="text-[10px] text-muted-foreground">Drive das Metas • Ver arquivos</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover/drive:opacity-100 transition-opacity" />
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="grid gap-8 lg:grid-cols-2">
            <div className="space-y-8">
                <Card className="border-primary/5 bg-primary/[0.01] rounded-[32px] overflow-hidden shadow-2xl ring-1 ring-white/[0.03]">
                    <CardHeader className="pb-4">
                        <CardTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-xl"><Target className="w-5 h-5 text-primary" /></div>
                            Metas Estratégicas
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-8">
                        <div className="flex flex-col gap-2 p-3 bg-background/50 border border-white/[0.03] rounded-2xl">
                            <div className="flex gap-2 items-center">
                                <Input placeholder="Defina um novo norte..." value={newGoal} onChange={(e) => setNewGoal(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && submitGoal('monthly')} className="h-11 bg-transparent border-none focus-visible:ring-0 text-sm font-medium flex-1 px-1" />
                                <div className="flex gap-1 pr-1 shrink-0">
                                    <Button size="sm" onClick={() => submitGoal('monthly')} className="h-9 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest bg-primary/10 hover:bg-primary/20 text-primary">Mensal</Button>
                                    <Button size="sm" onClick={() => submitGoal('annual')} variant="outline" className="h-9 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest">Anual</Button>
                                </div>
                            </div>
                            <div className="px-2 pb-1 space-y-2">
                                <div className="flex items-center gap-2">
                                    <Clock3 className="w-3 h-3 text-primary shrink-0" />
                                    <Input type="number" min={1} step={1} value={newGoalDailyTarget} onChange={(e) => setNewGoalDailyTarget(e.target.value)} className="h-8 text-xs bg-background/50 border-white/[0.1]" placeholder="Tempo alvo diário (min)" />
                                </div>
                                {/* Frequency */}
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-[9px] font-bold text-muted-foreground uppercase shrink-0">Frequência:</span>
                                    <div className="flex gap-1">
                                        <Button type="button" size="sm" variant={newGoalFrequency === 'daily' ? 'default' : 'outline'} className="h-6 text-[8px] px-2 rounded-lg" onClick={() => setNewGoalFrequency('daily')}>Diário</Button>
                                        <Button type="button" size="sm" variant={newGoalFrequency === 'specific-days' ? 'default' : 'outline'} className="h-6 text-[8px] px-2 rounded-lg" onClick={() => setNewGoalFrequency('specific-days')}>Dias Específicos</Button>
                                    </div>
                                </div>
                                {newGoalFrequency === 'specific-days' && (
                                    <div className="flex gap-1">
                                        {DAY_LABELS.map((day, idx) => (
                                            <button key={idx} type="button" className={cn("w-7 h-7 rounded-full text-[9px] font-bold transition-colors", newGoalFrequencyDays.includes(idx) ? 'bg-primary text-primary-foreground' : 'bg-white/[0.03] text-muted-foreground hover:bg-white/[0.06]')}
                                                onClick={() => setNewGoalFrequencyDays(prev => prev.includes(idx) ? prev.filter(d => d !== idx) : [...prev, idx])}>{day}</button>
                                        ))}
                                    </div>
                                )}
                                {!showNewGoalYoutubeInput ? (
                                    <Button variant="ghost" size="sm" className="h-6 text-[10px] text-muted-foreground" onClick={() => setShowNewGoalYoutubeInput(true)}>
                                        <Youtube className="w-3 h-3 mr-1.5" /> Adicionar Vídeo/Playlist
                                    </Button>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <Input value={newGoalYoutubeLink} onChange={(e) => setNewGoalYoutubeLink(e.target.value)} className="h-8 text-xs bg-background/50 border-white/[0.1]" placeholder="Link do YouTube ou Playlist..." autoFocus />
                                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setShowNewGoalYoutubeInput(false); setNewGoalYoutubeLink(''); }}><X className="w-3.5 h-3.5" /></Button>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-60">Foco do Mês</h4>
                            <div className="space-y-2">{goals.filter(g => g.type === 'monthly').map(goal => renderGoalItem(goal))}</div>
                        </div>
                        <div className="space-y-4">
                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-60">Visão de Longo Prazo</h4>
                            <div className="space-y-2">{goals.filter(g => g.type === 'annual').map(goal => renderGoalItem(goal))}</div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="space-y-8">
                <Card className="bg-card/20 border-white/[0.03] rounded-[32px] overflow-hidden shadow-2xl ring-1 ring-white/[0.03]">
                    <CardHeader className="pb-4">
                        <CardTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-3">
                            <div className="p-2 bg-white/[0.03] rounded-xl"><Briefcase className="w-5 h-5 text-muted-foreground" /></div>
                            Sistemas & Projetos
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-8">
                        <div className="flex flex-col gap-3 p-4 bg-background/50 border border-white/[0.03] rounded-2xl">
                            <Input placeholder="Nome do projeto..." value={newProject} onChange={(e) => setNewProject(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && submitProject()} className="h-10 bg-transparent border-none focus-visible:ring-0 text-sm font-medium px-1" />
                            <div className="grid grid-cols-2 gap-2">
                                <Input placeholder="Descrição..." value={newProjectDesc} onChange={(e) => setNewProjectDesc(e.target.value)} className="h-8 text-xs bg-background/50 border-white/[0.1]" />
                                <Input placeholder="Objetivo..." value={newProjectObjective} onChange={(e) => setNewProjectObjective(e.target.value)} className="h-8 text-xs bg-background/50 border-white/[0.1]" />
                            </div>
                            <Button size="sm" onClick={submitProject} className="h-9 px-6 rounded-xl text-[10px] font-black uppercase tracking-widest bg-white/[0.1] hover:bg-white/[0.2] self-end">Criar Projeto</Button>
                        </div>

                        <div className="grid gap-4">
                            {projects.map(project => {
                                const projMeta = parseProjectMeta(project.description);
                                const projectTasks = tasks.filter(t => t.projectId === project.id);
                                const statusInfo = PROJECT_STATUSES.find(s => s.value === project.status) || PROJECT_STATUSES[0];

                                return (
                                    <div key={project.id} className="p-6 rounded-[28px] bg-card/40 border border-white/[0.03] group relative overflow-hidden">
                                        {editingProjectId === project.id ? (
                                            <div className="space-y-3">
                                                <Input value={editProjectName} onChange={e => setEditProjectName(e.target.value)} className="h-9 text-sm font-bold" placeholder="Nome" />
                                                <Input value={editProjectDesc} onChange={e => setEditProjectDesc(e.target.value)} className="h-8 text-xs" placeholder="Descrição" />
                                                <Input value={editProjectObjective} onChange={e => setEditProjectObjective(e.target.value)} className="h-8 text-xs" placeholder="Objetivo" />
                                                <div className="flex gap-2">
                                                    <Button size="sm" onClick={() => handleSaveEditProject(project.id)} className="text-[10px] h-8 bg-primary text-primary-foreground">Salvar</Button>
                                                    <Button size="sm" variant="ghost" onClick={() => setEditingProjectId(null)} className="text-[10px] h-8">Cancelar</Button>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="flex justify-between items-start mb-3">
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className={cn("font-black text-lg tracking-tight", project.status === 'completed' && "line-through text-muted-foreground")}>{project.name}</h4>
                                                        {projMeta.description && <p className="text-xs text-muted-foreground mt-1">{projMeta.description}</p>}
                                                        {projMeta.objective && <p className="text-[10px] text-primary/80 mt-1 italic">🎯 {projMeta.objective}</p>}
                                                    </div>
                                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {
                                                            setEditingProjectId(project.id); setEditProjectName(project.name);
                                                            setEditProjectDesc(projMeta.description); setEditProjectObjective(projMeta.objective);
                                                        }}><Pencil className="w-3.5 h-3.5 text-muted-foreground" /></Button>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => deleteProject(project.id)}><Trash2 className="w-3.5 h-3.5 text-muted-foreground" /></Button>
                                                    </div>
                                                </div>
                                                {/* Status Selector */}
                                                <div className="flex flex-wrap gap-1 mb-3">
                                                    {PROJECT_STATUSES.map(s => (
                                                        <Badge key={s.value} className={cn("text-[8px] cursor-pointer transition-all px-2 py-0.5",
                                                            project.status === s.value ? s.color + " ring-1 ring-current" : "bg-white/[0.02] text-muted-foreground/40 hover:text-muted-foreground/70")}
                                                            onClick={() => updateProject(project.id, { status: s.value as any })}>
                                                            {s.label}
                                                        </Badge>
                                                    ))}
                                                </div>
                                                {projectTasks.length > 0 && (
                                                    <div className="text-[10px] text-muted-foreground/60 flex items-center gap-1">
                                                        <CheckCircle2 className="w-3 h-3" /> {projectTasks.filter(t => t.status === 'completed').length}/{projectTasks.length} tarefas
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <YoutubePlayerDialog
                goal={activeVideoGoal} isOpen={!!activeVideoGoal} onClose={() => setActiveVideoGoal(null)}
                docItems={(() => { try { const notes = activeVideoGoal?.notes; if (notes && notes.startsWith('{')) return JSON.parse(notes).items || []; return notes ? [{ id: 'root-doc', name: 'Anotações', type: 'file', content: notes, parentId: null, createdAt: 0 }] : []; } catch { return []; } })()}
                onSaveProgress={handleSaveProgress} onLiveProgress={handleLiveProgressUpdate}
                onSaveNotes={(items) => { if (activeVideoGoal) updateGoal(activeVideoGoal.id, { notes: mergeItemsIntoGoalNotes(activeVideoGoal, items) }); }}
            />

            {/* Doc Dialog - z-index fix */}
            <Dialog open={!!docGoal} onOpenChange={(open) => !open && setDocGoal(null)}>
                <DialogContent className="sm:max-w-[800px] bg-[#0d0d0d] border-white/[0.05] p-0 overflow-hidden rounded-[40px] shadow-2xl ring-1 ring-white/[0.05] z-[60]">
                    <div className="flex flex-col">
                        <DialogHeader className="p-8 border-b border-white/[0.05] bg-black/40">
                            <div className="flex items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-blue-500 rounded-2xl shadow-xl shadow-blue-500/20"><Folder className="w-5 h-5 text-white" /></div>
                                    <div className="space-y-1">
                                        <DialogTitle className="text-xl font-black tracking-tight text-white/90">{docGoal?.title}</DialogTitle>
                                        <div className="flex items-center gap-2 text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">
                                            <span className="hover:text-primary cursor-pointer" onClick={() => { setCurrentFolderId(null); setActiveFileId(null); setSearchTerm(''); }}>Drive</span>
                                            {breadcrumbs.map(b => (
                                                <React.Fragment key={b.id}>
                                                    <ChevronRight className="w-3 h-3 opacity-30" />
                                                    <span className="hover:text-blue-400 cursor-pointer" onClick={() => { setCurrentFolderId(b.id); setActiveFileId(null); setSearchTerm(''); }}>{b.name}</span>
                                                </React.Fragment>
                                            ))}
                                            {activeFileId && <><ChevronRight className="w-3 h-3 opacity-30" /> <span className="text-emerald-400">{fileSystem.find(i => i.id === activeFileId)?.name}</span></>}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    {!activeFileId && (
                                        <div className="relative w-40">
                                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                                            <Input placeholder="Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-8 h-8 text-[11px] bg-white/[0.02] border-white/[0.05] rounded-xl" />
                                        </div>
                                    )}
                                    <div className="flex gap-2">
                                        {!activeFileId ? (
                                            <>
                                                <Button size="sm" onClick={() => handleCreateItem('folder')} variant="outline" className="h-9 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest gap-2"><Plus className="w-3.5 h-3.5" /> Pasta</Button>
                                                <Button size="sm" onClick={() => handleCreateItem('file')} className="h-9 px-4 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest gap-2"><Plus className="w-3.5 h-3.5" /> Doc</Button>
                                            </>
                                        ) : (
                                            <Button size="sm" onClick={handleSaveFileContent} className="h-9 px-6 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest gap-2"><Save className="w-3.5 h-3.5" /> Salvar</Button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </DialogHeader>

                        <div className="min-h-[500px] max-h-[70vh] overflow-y-auto p-8 bg-black/20">
                            {activeFileId ? (
                                <div className="space-y-6">
                                    <Button variant="ghost" size="sm" onClick={() => setActiveFileId(null)} className="h-8 -ml-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground"><ArrowLeft className="w-3.5 h-3.5 mr-2" /> Voltar</Button>
                                    <RichTextEditor content={noteDraft} onChange={setNoteDraft} placeholder="Comece a escrever..." />
                                    <div className="mt-4 flex items-center gap-3">
                                        <Button onClick={handleSaveFileContent} className="h-9 px-6 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-[10px] font-black uppercase tracking-widest gap-2"><Save className="w-3.5 h-3.5" /> Salvar</Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                    {displayedItems.map(item => (
                                        <div key={item.id} className="group relative bg-white/[0.02] border border-white/[0.05] rounded-2xl p-5 hover:bg-white/[0.05] hover:border-white/[0.08] cursor-pointer transition-all duration-200"
                                            onClick={() => item.type === 'folder' ? (setCurrentFolderId(item.id), setSearchTerm('')) : openDocFile(item.id)}>
                                            <div className="flex flex-col gap-3">
                                                <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105",
                                                    item.type === 'folder' ? "bg-blue-500/10 text-blue-500" : "bg-emerald-500/10 text-emerald-500")}>
                                                    {item.type === 'folder' ? <Folder className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                                                </div>
                                                <div className="min-w-0">
                                                    {editingDocId === item.id ? (
                                                        <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                                                            <Input value={editNameValue} onChange={e => setEditNameValue(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') handleRenameDoc(item.id); if (e.key === 'Escape') setEditingDocId(null); }} className="h-7 text-xs px-2 bg-white/[0.04] border-white/[0.08]" autoFocus />
                                                            <Button size="icon" variant="ghost" className="h-7 w-7 text-emerald-500" onClick={() => handleRenameDoc(item.id)}><Save className="w-3 h-3" /></Button>
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <p className="text-xs font-bold text-foreground/90 truncate group-hover:text-foreground transition-colors">{item.name}</p>
                                                            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-1 opacity-50">{item.type === 'folder' ? 'Pasta' : 'Documento'}</p>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                                                <Button size="icon" variant="ghost" className="h-7 w-7 rounded-lg hover:bg-white/10" onClick={() => { setEditingDocId(item.id); setEditNameValue(item.name); }}><Pencil className="w-3 h-3" /></Button>
                                                <Button size="icon" variant="ghost" className="h-7 w-7 rounded-lg hover:bg-destructive/20 hover:text-destructive" onClick={() => handleDeleteItem(item.id)}><Trash2 className="w-3 h-3" /></Button>
                                            </div>
                                        </div>
                                    ))}
                                    {displayedItems.length === 0 && (
                                        <div className="col-span-full py-20 flex flex-col items-center justify-center text-center">
                                            <div className="p-4 rounded-2xl bg-white/[0.02] mb-4">{searchTerm ? <Search className="w-8 h-8 text-muted-foreground/20" /> : <FileText className="w-8 h-8 text-muted-foreground/20" />}</div>
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40">{searchTerm ? 'Nenhum resultado encontrado' : 'Pasta vazia'}</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default StrategicView;
