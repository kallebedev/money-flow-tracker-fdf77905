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
import { format, parseISO, addMinutes } from 'date-fns';
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

    const totalMinutes = tasks.reduce((acc, task) =>
        task.status !== 'completed' ? acc + task.estimatedDuration : acc, 0
    );

    const WORK_DAY_MINUTES = 8 * 60; // 8 hours
    const isOverloaded = totalMinutes > WORK_DAY_MINUTES;

    // Suggestion Logic: High Impact + High Urgency first, that are not completed
    const suggestion = tasks
        .filter(t => t.status === 'todo')
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
                            Baseado na sua lista, você deve focar em: <strong>{suggestion.title}</strong>
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
                        Você tem {Math.round(totalMinutes / 60)}h de trabalho planejado para hoje.
                        Isso excede o limite saudável de 8h. Considere adiar tarefas de baixo impacto.
                    </AlertDescription>
                </Alert>
            )}

            {/* Timeline */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Clock className="w-5 h-5 text-muted-foreground" />
                        Cronograma do Dia
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="relative border-l-2 border-muted ml-3 pl-6 space-y-6 py-2">
                        {sortedTasks.map((task, index) => {
                            const startTime = parseISO(task.scheduledStartTime);
                            const endTime = addMinutes(startTime, task.estimatedDuration);

                            return (
                                <div key={task.id} className="relative group">
                                    {/* Timeline Dot */}
                                    <div className={cn(
                                        "absolute -left-[31px] top-1.5 w-4 h-4 rounded-full border-2 border-background z-10",
                                        task.status === 'completed' ? "bg-green-500" :
                                            task.status === 'in-progress' ? "bg-primary animate-pulse" :
                                                task.status === 'delayed' ? "bg-red-500" : "bg-muted-foreground"
                                    )} />

                                    <div className={cn(
                                        "p-3 rounded-lg border transition-all",
                                        task.status === 'in-progress' ? "bg-primary/2 border-primary/10 ring-1 ring-primary/5" : "bg-card border-white/[0.03]",
                                        task.status === 'completed' && "opacity-60 grayscale"
                                    )}>
                                        <div className="flex justify-between items-start mb-1">
                                            <span className="text-[12px] font-mono text-muted-foreground">
                                                {format(startTime, 'HH:mm')} - {format(endTime, 'HH:mm')}
                                            </span>
                                            <Badge
                                                variant={task.status === 'completed' ? 'secondary' : 'outline'}
                                                className="text-[10px] h-5 px-1.5"
                                            >
                                                {task.status === 'completed' ? 'Concluído' : `${task.estimatedDuration}m`}
                                            </Badge>
                                        </div>

                                        <div className="flex justify-between items-center mb-1">
                                            <h4 className={cn(
                                                "text-base font-semibold truncate",
                                                task.status === 'completed' && "line-through"
                                            )}>
                                                {task.title}
                                            </h4>
                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => setEditingTask(task)}
                                                    className="p-1 hover:text-primary transition-colors"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => onDeleteTask(task.id)}
                                                    className="p-1 hover:text-red-500 transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" />
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
