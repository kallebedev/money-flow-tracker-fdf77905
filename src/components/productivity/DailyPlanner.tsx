import React from 'react';
import { ProductivityTask } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, CheckCircle2, Clock, Lightbulb, PlayCircle, Trash2, Edit2, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { format, parseISO, addMinutes, addHours } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import TaskEditDialog from './TaskEditDialog';

interface DailyPlannerProps {
    tasks: ProductivityTask[];
    onStartTask: (id: string) => void;
    onCompleteTask: (id: string) => void;
    onDeleteTask: (id: string) => void;
    onUpdateTask: (id: string, updates: Partial<ProductivityTask>) => void;
}

const DailyPlanner: React.FC<DailyPlannerProps> = ({ tasks, onStartTask, onCompleteTask, onDeleteTask, onUpdateTask }) => {
    const [editingTask, setEditingTask] = React.useState<ProductivityTask | null>(null);

    const sortedTasks = [...tasks].sort((a, b) =>
        parseISO(a.scheduledStartTime).getTime() - parseISO(b.scheduledStartTime).getTime()
    );

    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const totalMinutesToday = tasks.reduce((acc, task) => {
        const isToday = task.scheduledStartTime.startsWith(todayStr);
        return (isToday && task.status !== 'completed') ? acc + task.estimatedDuration : acc;
    }, 0);

    const WORK_DAY_MINUTES = 8 * 60; // 8 hours
    const isOverloaded = totalMinutesToday > WORK_DAY_MINUTES;

    // Suggestion Logic: High Impact + High Urgency first, targeting today's tasks
    const suggestion = tasks
        .filter(t => t.status === 'todo' && t.scheduledStartTime.startsWith(todayStr))
        .sort((a, b) => (b.impact + b.urgency) - (a.impact + a.urgency))[0];

    return (
        <div className="space-y-6">
            {/* Smart Suggestion */}
            {suggestion && (
                <Alert className="bg-primary/2 border-primary/10 animate-in fade-in slide-in-from-top-2 duration-500">
                    <Lightbulb className="h-5 w-5 text-primary" />
                    <AlertTitle className="text-primary font-bold">Sugestão do Dia</AlertTitle>
                    <AlertDescription className="flex justify-between items-center">
                        <span>
                            Baseado na sua lista de hoje, foque em: <strong>{suggestion.title}</strong>
                        </span>
                        <button
                            onClick={() => onStartTask(suggestion.id)}
                            className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded hover:opacity-90 transition-opacity"
                        >
                            Começar Agora
                        </button>
                    </AlertDescription>
                </Alert>
            )}

            {/* Overload Warning */}
            {isOverloaded && (
                <Alert variant="destructive" className="animate-pulse">
                    <AlertTriangle className="h-5 w-5" />
                    <AlertTitle>Aviso de Sobrecarga!</AlertTitle>
                    <AlertDescription>
                        Você tem {Math.round(totalMinutesToday / 60)}h de trabalho planejado para hoje.
                        Isso excede o limite saudável de 8h.
                    </AlertDescription>
                </Alert>
            )}

            {/* Timeline */}
            <Card className="bg-[#111] border-white/[0.03] rounded-[24px]">
                <CardHeader className="pb-3 border-b border-white/[0.03] mb-4">
                    <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2 text-muted-foreground">
                        <Clock className="w-3.5 h-3.5 text-primary" />
                        Cronograma Tático
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="relative border-l border-white/[0.06] ml-3 pl-8 space-y-8 py-4">
                        {sortedTasks.map((task, index) => {
                            const startTime = parseISO(task.scheduledStartTime);
                            const endTime = addHours(startTime, task.estimatedDuration / 60);
                            const isToday = task.scheduledStartTime.startsWith(todayStr);

                            return (
                                <div key={task.id} className="relative group">
                                    {/* Timeline Dot */}
                                    <div className={cn(
                                        "absolute -left-[37px] top-1.5 w-3.5 h-3.5 rounded-full border border-[#111] z-10 transition-all",
                                        task.status === 'completed' ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]" :
                                            task.status === 'in-progress' ? "bg-primary animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.3)]" :
                                                task.status === 'delayed' ? "bg-red-500" : "bg-white/10"
                                    )} />

                                    <div className={cn(
                                        "p-4 rounded-[20px] border transition-all duration-300",
                                        task.status === 'in-progress' ? "bg-primary/5 border-primary/20" : "bg-white/[0.02] border-white/[0.03] group-hover:border-white/[0.08]",
                                        task.status === 'completed' && "opacity-40 grayscale"
                                    )}>
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">
                                                {!isToday && <span className="text-primary mr-2">{format(startTime, 'dd/MM')}</span>}
                                                {format(startTime, 'HH:mm')} - {format(endTime, 'HH:mm')}
                                            </span>
                                            <Badge
                                                variant="outline"
                                                className="text-[9px] font-black uppercase tracking-wider h-5 px-2 bg-white/[0.02] border-white/[0.05]"
                                            >
                                                {task.status === 'completed' ? 'Ok' : `${task.estimatedDuration}m`}
                                            </Badge>
                                        </div>

                                        <div className="flex justify-between items-center">
                                            <h4 className={cn(
                                                "text-sm font-bold truncate tracking-tight text-[#f0f0f0]",
                                                task.status === 'completed' && "line-through"
                                            )}>
                                                {task.title}
                                            </h4>
                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => setEditingTask(task)}
                                                    className="p-1.5 text-muted-foreground hover:text-primary transition-colors hover:bg-white/[0.05] rounded-lg"
                                                >
                                                    <Edit2 className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                    onClick={() => onDeleteTask(task.id)}
                                                    className="p-1.5 text-muted-foreground hover:text-red-500 transition-colors hover:bg-white/[0.05] rounded-lg"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>

                                        {task.status !== 'completed' && (
                                            <div className="flex gap-2 mt-3">
                                                {task.status === 'todo' && (
                                                    <button
                                                        onClick={() => onStartTask(task.id)}
                                                        className="flex items-center gap-1 text-[10px] bg-primary/10 text-primary px-2 py-1 rounded hover:bg-primary/20 transition-colors"
                                                    >
                                                        <PlayCircle className="w-4 h-4" /> Iniciar
                                                    </button>
                                                )}
                                                {task.status === 'in-progress' && (
                                                    <button
                                                        onClick={() => onCompleteTask(task.id)}
                                                        className="flex items-center gap-1 text-[10px] bg-green-500/10 text-green-600 px-2 py-1 rounded hover:bg-green-500/20 transition-colors"
                                                    >
                                                        <CheckCircle2 className="w-4 h-4" /> Concluir
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}

                        {tasks.length === 0 && (
                            <div className="text-center py-8 text-muted-foreground">
                                <p className="text-sm">Nenhuma tarefa agendada para hoje.</p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            <TaskEditDialog
                task={editingTask}
                open={!!editingTask}
                onOpenChange={(open) => !open && setEditingTask(null)}
                onSave={onUpdateTask}
            />
        </div>
    );
};

export default DailyPlanner;
