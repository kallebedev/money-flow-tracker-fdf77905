import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { ProductivityTask } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus } from 'lucide-react';
import { formatISO, addHours, startOfToday, format } from 'date-fns';

interface ProductivityTaskFormProps {
    onAdd: (task: Omit<ProductivityTask, 'id' | 'createdAt'>) => void;
}

const ProductivityTaskForm: React.FC<ProductivityTaskFormProps> = ({ onAdd }) => {
    const [title, setTitle] = useState('');
    const [impact, setImpact] = useState([5]);
    const [urgency, setUrgency] = useState([5]);
    const [duration, setDuration] = useState('30');
    const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [startTime, setStartTime] = useState('09:00');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title) return;

        // Combine date and time correctly
        const [year, month, day] = startDate.split('-').map(Number);
        const [hours, minutes] = startTime.split(':').map(Number);

        const scheduledDate = new Date(year, month - 1, day, hours, minutes);

        onAdd({
            title,
            impact: impact[0],
            urgency: urgency[0],
            estimatedDuration: parseInt(duration),
            scheduledStartTime: formatISO(scheduledDate),
            status: 'todo',
        });

        setTitle('');
        setImpact([5]);
        setUrgency([5]);
        setDuration('30');
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
                        <Input
                            id="task-title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Ex: Pagar luz"
                            className="h-8 text-xs bg-background/50"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <Label className="text-[10px] uppercase font-bold text-muted-foreground">Impacto ({impact[0]})</Label>
                            <Slider
                                value={impact}
                                onValueChange={setImpact}
                                max={10}
                                min={1}
                                step={1}
                                className="py-2"
                            />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-[10px] uppercase font-bold text-muted-foreground">Urgência ({urgency[0]})</Label>
                            <Slider
                                value={urgency}
                                onValueChange={setUrgency}
                                max={10}
                                min={1}
                                step={1}
                                className="py-2"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <Label className="text-[10px] uppercase font-bold text-muted-foreground">Data</Label>
                            <Input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="h-8 text-xs bg-background/50"
                            />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-[10px] uppercase font-bold text-muted-foreground">Horário</Label>
                            <Input
                                type="time"
                                value={startTime}
                                onChange={(e) => setStartTime(e.target.value)}
                                className="h-8 text-xs bg-background/50"
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <Label className="text-[10px] uppercase font-bold text-muted-foreground">Duração (min)</Label>
                        <Input
                            type="number"
                            value={duration}
                            onChange={(e) => setDuration(e.target.value)}
                            className="h-8 text-xs bg-background/50"
                        />
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
