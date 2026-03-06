import React, { useState, useEffect } from 'react';
import { ProductivityTask } from '@/lib/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { format, parseISO, formatISO } from 'date-fns';

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
    const [startTime, setStartTime] = useState('09:00');

    useEffect(() => {
        if (task) {
            setTitle(task.title);
            setDuration(task.estimatedDuration.toString());
            setImpact([task.impact]);
            setUrgency([task.urgency]);
            const date = parseISO(task.scheduledStartTime);
            setStartTime(format(date, 'HH:mm'));
        }
    }, [task]);

    const handleSave = () => {
        if (!task) return;

        const date = parseISO(task.scheduledStartTime);
        const [hours, minutes] = startTime.split(':').map(Number);
        date.setHours(hours);
        date.setMinutes(minutes);

        onSave(task.id, {
            title,
            estimatedDuration: parseInt(duration) || task.estimatedDuration,
            impact: impact[0],
            urgency: urgency[0],
            scheduledStartTime: formatISO(date)
        });
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

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <Label className="text-[10px] uppercase font-bold text-[#555]">Duração (min)</Label>
                            <Input
                                type="number"
                                value={duration}
                                onChange={(e) => setDuration(e.target.value)}
                                className="bg-[#0a0a0a] border-white/[0.03] text-[#f0f0f0] h-10"
                            />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-[10px] uppercase font-bold text-[#555]">Horário</Label>
                            <Input
                                type="time"
                                value={startTime}
                                onChange={(e) => setStartTime(e.target.value)}
                                className="bg-[#0a0a0a] border-white/[0.03] text-[#f0f0f0] h-10"
                            />
                        </div>
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
