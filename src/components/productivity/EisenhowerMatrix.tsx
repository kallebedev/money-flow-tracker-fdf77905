import React from 'react';
import { ProductivityTask } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Circle, Clock, Trophy, Edit2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import TaskEditDialog from './TaskEditDialog';

interface EisenhowerMatrixProps {
    tasks: ProductivityTask[];
    onToggleStatus: (id: string) => void;
    onToggleTopThree?: (id: string, isTopThree: boolean) => void;
    onUpdateTask?: (id: string, updates: Partial<ProductivityTask>) => void;
}

const EisenhowerMatrix: React.FC<EisenhowerMatrixProps> = ({ tasks, onToggleStatus, onToggleTopThree, onUpdateTask }) => {
    const [editingTask, setEditingTask] = React.useState<ProductivityTask | null>(null);

    const getQuadrant = (impact: number, urgency: number) => {
        if (impact >= 5 && urgency >= 5) return 'do-first';
        if (impact >= 5 && urgency < 5) return 'schedule';
        if (impact < 5 && urgency >= 5) return 'delegate';
        return 'eliminate';
    };

    const categories = {
        'do-first': {
            title: 'Fazer Agora',
            className: 'bg-red-500/10 border-red-500/50',
            textClass: 'text-red-500',
            description: 'Alto Impacto & Urgente'
        },
        'schedule': {
            title: 'Agendar',
            className: 'bg-blue-500/10 border-blue-500/50',
            textClass: 'text-blue-500',
            description: 'Alto Impacto & Não Urgente'
        },
        'delegate': {
            title: 'Delegar/Reduzir',
            className: 'bg-amber-500/10 border-amber-500/50',
            textClass: 'text-amber-500',
            description: 'Baixo Impacto & Urgente'
        },
        'eliminate': {
            title: 'Eliminar',
            className: 'bg-slate-500/10 border-slate-500/50',
            textClass: 'text-slate-500',
            description: 'Baixo Impacto & Baixa Urgência'
        },
    };

    const tasksByQuadrant = tasks.reduce((acc, task) => {
        const quadrant = getQuadrant(task.impact, task.urgency);
        if (!acc[quadrant]) acc[quadrant] = [];
        acc[quadrant].push(task);
        return acc;
    }, {} as Record<string, ProductivityTask[]>);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
            {(Object.keys(categories) as Array<keyof typeof categories>).map((key) => {
                const cat = categories[key];
                const quadrantTasks = tasksByQuadrant[key] || [];

                return (
                    <Card key={key} className={cn("border transition-all hover:shadow-md", cat.className)}>
                        <CardHeader className="p-4 pb-2">
                            <div className="flex justify-between items-center">
                                <CardTitle className={cn("text-lg font-bold", cat.textClass)}>
                                    {cat.title}
                                </CardTitle>
                                <Badge variant="outline" className={cat.textClass}>
                                    {quadrantTasks.length}
                                </Badge>
                            </div>
                            <p className="text-xs opacity-70 italic">{cat.description}</p>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                            <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
                                {quadrantTasks.length === 0 ? (
                                    <p className="text-xs text-muted-foreground text-center py-4">Nenhuma tarefa aqui</p>
                                ) : (
                                    quadrantTasks.map((task) => (
                                        <div
                                            key={task.id}
                                            className="flex items-start gap-2 p-2 rounded-md bg-background/50 border border-white/[0.03] hover:border-white/[0.08] transition-colors group cursor-pointer"
                                            onClick={() => onToggleStatus(task.id)}
                                        >
                                            <button className="mt-0.5 shrink-0">
                                                {task.status === 'completed' ? (
                                                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                                                ) : (
                                                    <Circle className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                                                )}
                                            </button>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <p className={cn(
                                                        "text-sm font-medium leading-none truncate",
                                                        task.status === 'completed' && "line-through opacity-50 text-muted-foreground"
                                                    )}>
                                                        {task.title}
                                                    </p>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onToggleTopThree?.(task.id, !task.isTopThree);
                                                        }}
                                                        className={cn(
                                                            "transition-all",
                                                            task.isTopThree ? "text-yellow-500 scale-110" : "text-muted-foreground/30 hover:text-yellow-500/50 outline-none"
                                                        )}
                                                    >
                                                        <Trophy className="w-3 h-3" />
                                                    </button>
                                                </div>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="flex items-center text-[10px] text-muted-foreground mr-auto">
                                                        <Clock className="w-3 h-3 mr-0.5" />
                                                        {task.estimatedDuration} min
                                                    </span>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setEditingTask(task);
                                                        }}
                                                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:text-primary"
                                                    >
                                                        <Edit2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>
                );
            })}

            <TaskEditDialog
                task={editingTask}
                open={!!editingTask}
                onOpenChange={(open) => !open && setEditingTask(null)}
                onSave={onUpdateTask || (() => { })}
            />
        </div>
    );
};

export default EisenhowerMatrix;
