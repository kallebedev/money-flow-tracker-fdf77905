import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { ProductivityTask, stringifyTaskMeta } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Calendar, CalendarClock, Repeat, CircleDot } from 'lucide-react';
import { formatISO, format } from 'date-fns';
import { cn } from '@/lib/utils';

type ScheduleMode = 'none' | 'date_only' | 'date_time';

interface ProductivityTaskFormProps {
    onAdd: (task: Omit<ProductivityTask, 'id' | 'createdAt'>) => void;
}

const ProductivityTaskForm: React.FC<ProductivityTaskFormProps> = ({ onAdd }) => {
    const [title, setTitle] = useState('');
    const [impact, setImpact] = useState([5]);
    const [urgency, setUrgency] = useState([5]);
    const [duration, setDuration] = useState('30');
    const [scheduleMode, setScheduleMode] = useState<ScheduleMode>('date_time');
    const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [startTime, setStartTime] = useState('09:00');
    const [taskType, setTaskType] = useState<'one-time' | 'recurring'>('one-time');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title) return;

        const base = {
            title,
            description: stringifyTaskMeta({ taskType }),
            impact: impact[0],
            urgency: urgency[0],
            estimatedDuration: parseInt(duration),
            status: 'todo' as const,
        };

        if (scheduleMode === 'none') {
            onAdd(base);
        } else if (scheduleMode === 'date_only') {
            onAdd({ ...base, scheduledStartTime: startDate });
        } else {
            const [year, month, day] = startDate.split('-').map(Number);
            const [hours, minutes] = startTime.split(':').map(Number);
            const scheduledDate = new Date(year, month - 1, day, hours, minutes);
            onAdd({ ...base, scheduledStartTime: formatISO(scheduledDate) });
        }

        setTitle('');
        setImpact([5]);
        setUrgency([5]);
        setDuration('30');
        setTaskType('one-time');
    };

    return (
        <Card className="border-primary/20 bg-primary/5">
            <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm font-bold uppercase tracking-wider">Nova Tarefa</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1">
                        <Label htmlFor="task-title" className="text-[10px] uppercase font-bold text-muted-foreground">Título</Label>
                        <Input id="task-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Pagar luz" className="h-8 text-xs bg-background/50" />
                    </div>

                    {/* Task Type */}
                    <div className="space-y-2">
                        <Label className="text-[10px] uppercase font-bold text-muted-foreground">Tipo de Tarefa</Label>
                        <div className="grid grid-cols-2 gap-2">
                            <button type="button" onClick={() => setTaskType('one-time')}
                                className={cn("flex items-center gap-2 rounded-lg border p-2.5 text-[10px] font-medium transition-colors",
                                    taskType === 'one-time' ? 'border-primary bg-primary/20 text-primary' : 'border-white/[0.06] bg-white/[0.02] text-muted-foreground hover:border-white/10')}>
                                <CircleDot className="w-4 h-4" /> Única
                            </button>
                            <button type="button" onClick={() => setTaskType('recurring')}
                                className={cn("flex items-center gap-2 rounded-lg border p-2.5 text-[10px] font-medium transition-colors",
                                    taskType === 'recurring' ? 'border-primary bg-primary/20 text-primary' : 'border-white/[0.06] bg-white/[0.02] text-muted-foreground hover:border-white/10')}>
                                <Repeat className="w-4 h-4" /> Recorrente
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <Label className="text-[10px] uppercase font-bold text-muted-foreground">Impacto ({impact[0]})</Label>
                            <Slider value={impact} onValueChange={setImpact} max={10} min={1} step={1} className="py-2" />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-[10px] uppercase font-bold text-muted-foreground">Urgência ({urgency[0]})</Label>
                            <Slider value={urgency} onValueChange={setUrgency} max={10} min={1} step={1} className="py-2" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-[10px] uppercase font-bold text-muted-foreground">Quando realizar?</Label>
                        <div className="grid grid-cols-3 gap-2">
                            {([
                                { mode: 'none' as const, icon: Calendar, label: 'Sem previsão' },
                                { mode: 'date_only' as const, icon: Calendar, label: 'Só data' },
                                { mode: 'date_time' as const, icon: CalendarClock, label: 'Data e hora' },
                            ]).map(({ mode, icon: Icon, label }) => (
                                <button key={mode} type="button" onClick={() => setScheduleMode(mode)}
                                    className={cn("flex flex-col items-center gap-1 rounded-lg border p-2.5 text-[10px] font-medium transition-colors",
                                        scheduleMode === mode ? 'border-primary bg-primary/20 text-primary' : 'border-white/[0.06] bg-white/[0.02] text-muted-foreground hover:border-white/10')}>
                                    <Icon className="w-4 h-4" /> {label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {(scheduleMode === 'date_only' || scheduleMode === 'date_time') && (
                        <div className={`grid gap-4 ${scheduleMode === 'date_time' ? 'grid-cols-2' : 'grid-cols-1'}`}>
                            <div className="space-y-1">
                                <Label className="text-[10px] uppercase font-bold text-muted-foreground">Data</Label>
                                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="h-8 text-xs bg-background/50" />
                            </div>
                            {scheduleMode === 'date_time' && (
                                <div className="space-y-1">
                                    <Label className="text-[10px] uppercase font-bold text-muted-foreground">Horário</Label>
                                    <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="h-8 text-xs bg-background/50" />
                                </div>
                            )}
                        </div>
                    )}

                    <div className="space-y-1">
                        <Label className="text-[10px] uppercase font-bold text-muted-foreground">Duração (min)</Label>
                        <Input type="number" value={duration} onChange={(e) => setDuration(e.target.value)} className="h-8 text-xs bg-background/50" />
                    </div>

                    <Button type="submit" className="w-full h-8 text-xs font-bold gap-2">
                        <Plus className="w-4 h-4" /> Adicionar Tarefa
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
};

export default ProductivityTaskForm;
