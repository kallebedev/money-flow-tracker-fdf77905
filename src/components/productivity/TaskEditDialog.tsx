import React, { useState, useEffect } from 'react';
import { ProductivityTask } from '@/lib/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { format, parseISO, formatISO } from 'date-fns';
import { Calendar, CalendarClock } from 'lucide-react';

type ScheduleMode = 'none' | 'date_only' | 'date_time';

interface TaskEditDialogProps {
    task: ProductivityTask | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSave: (id: string, updates: Partial<ProductivityTask>) => void;
}

const TaskEditDialog: React.FC<TaskEditDialogProps> = ({ task, open, onOpenChange, onSave }) => {
    const [title, setTitle] = useState('');
    const [duration, setDuration] = useState('');
    const [impact, setImpact] = useState([5]);
    const [urgency, setUrgency] = useState([5]);
    const [scheduleMode, setScheduleMode] = useState<ScheduleMode>('date_time');
    const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [startTime, setStartTime] = useState('09:00');

    useEffect(() => {
        if (task) {
            setTitle(task.title);
            setDuration(task.estimatedDuration.toString());
            setImpact([task.impact]);
            setUrgency([task.urgency]);
            const st = task.scheduledStartTime;
            if (!st) {
                setScheduleMode('none');
                setStartDate(format(new Date(), 'yyyy-MM-dd'));
                setStartTime('09:00');
            } else if (st.length === 10) {
                setScheduleMode('date_only');
                setStartDate(st);
                setStartTime('09:00');
            } else {
                setScheduleMode('date_time');
                const date = parseISO(st);
                setStartDate(format(date, 'yyyy-MM-dd'));
                setStartTime(format(date, 'HH:mm'));
            }
        }
    }, [task]);

    const handleSave = () => {
        if (!task) return;

        const updates: Partial<ProductivityTask> = {
            title,
            estimatedDuration: parseInt(duration) || task.estimatedDuration,
            impact: impact[0],
            urgency: urgency[0],
        };

        if (scheduleMode === 'none') {
            updates.scheduledStartTime = null;
        } else if (scheduleMode === 'date_only') {
            updates.scheduledStartTime = startDate;
        } else {
            const [year, month, day] = startDate.split('-').map(Number);
            const [hours, minutes] = startTime.split(':').map(Number);
            const date = new Date(year, month - 1, day, hours, minutes);
            updates.scheduledStartTime = formatISO(date);
        }

        onSave(task.id, updates);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-[#111] border-white/[0.06] rounded-[24px] max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-[#f0f0f0] font-bold uppercase text-xs tracking-widest">Editar Tarefa</DialogTitle>
                </DialogHeader>
                <div className="space-y-6 py-4">
                    <div className="space-y-1">
                        <Label className="text-[10px] uppercase font-bold text-[#555]">Título</Label>
                        <Input
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="bg-[#0a0a0a] border-white/[0.03] text-[#f0f0f0] h-10"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-[10px] uppercase font-bold text-[#555]">Quando realizar?</Label>
                        <div className="grid grid-cols-3 gap-2">
                            <button
                                type="button"
                                onClick={() => setScheduleMode('none')}
                                className={`flex flex-col items-center gap-1 rounded-lg border p-2.5 text-[10px] font-medium transition-colors ${scheduleMode === 'none' ? 'border-[#22c55e] bg-[#22c55e]/20 text-[#22c55e]' : 'border-white/[0.06] bg-white/[0.02] text-[#555] hover:border-white/10'}`}
                            >
                                <Calendar className="w-4 h-4" />
                                Sem previsão
                            </button>
                            <button
                                type="button"
                                onClick={() => setScheduleMode('date_only')}
                                className={`flex flex-col items-center gap-1 rounded-lg border p-2.5 text-[10px] font-medium transition-colors ${scheduleMode === 'date_only' ? 'border-[#22c55e] bg-[#22c55e]/20 text-[#22c55e]' : 'border-white/[0.06] bg-white/[0.02] text-[#555] hover:border-white/10'}`}
                            >
                                <Calendar className="w-4 h-4" />
                                Só data
                            </button>
                            <button
                                type="button"
                                onClick={() => setScheduleMode('date_time')}
                                className={`flex flex-col items-center gap-1 rounded-lg border p-2.5 text-[10px] font-medium transition-colors ${scheduleMode === 'date_time' ? 'border-[#22c55e] bg-[#22c55e]/20 text-[#22c55e]' : 'border-white/[0.06] bg-white/[0.02] text-[#555] hover:border-white/10'}`}
                            >
                                <CalendarClock className="w-4 h-4" />
                                Data e hora
                            </button>
                        </div>
                    </div>

                    {(scheduleMode === 'date_only' || scheduleMode === 'date_time') && (
                        <div className={`grid gap-4 ${scheduleMode === 'date_time' ? 'grid-cols-2' : 'grid-cols-1'}`}>
                            <div className="space-y-1">
                                <Label className="text-[10px] uppercase font-bold text-[#555]">Data</Label>
                                <Input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="bg-[#0a0a0a] border-white/[0.03] text-[#f0f0f0] h-10"
                                />
                            </div>
                            {scheduleMode === 'date_time' && (
                                <div className="space-y-1">
                                    <Label className="text-[10px] uppercase font-bold text-[#555]">Horário</Label>
                                    <Input
                                        type="time"
                                        value={startTime}
                                        onChange={(e) => setStartTime(e.target.value)}
                                        className="bg-[#0a0a0a] border-white/[0.03] text-[#f0f0f0] h-10"
                                    />
                                </div>
                            )}
                        </div>
                    )}

                    <div className="space-y-1">
                        <Label className="text-[10px] uppercase font-bold text-[#555]">Duração (min)</Label>
                        <Input
                            type="number"
                            value={duration}
                            onChange={(e) => setDuration(e.target.value)}
                            className="bg-[#0a0a0a] border-white/[0.03] text-[#f0f0f0] h-10"
                        />
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label className="text-[10px] uppercase font-bold text-[#555]">Impacto ({impact[0]})</Label>
                            <Slider
                                value={impact}
                                onValueChange={setImpact}
                                max={10}
                                min={1}
                                step={1}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] uppercase font-bold text-[#555]">Urgência ({urgency[0]})</Label>
                            <Slider
                                value={urgency}
                                onValueChange={setUrgency}
                                max={10}
                                min={1}
                                step={1}
                            />
                        </div>
                    </div>
                </div>
                <DialogFooter className="gap-3">
                    <Button variant="ghost" onClick={() => onOpenChange(false)} className="text-[#555] hover:text-[#f0f0f0]">Cancelar</Button>
                    <Button onClick={handleSave} className="bg-[#22c55e] text-[#0a0a0a] font-bold px-8">Salvar Alterações</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default TaskEditDialog;
