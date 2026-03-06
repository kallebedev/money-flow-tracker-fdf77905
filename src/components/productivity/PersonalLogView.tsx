import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Book, Zap, Smile, Save, CheckCircle2 } from 'lucide-react';
import { useProductivity } from '@/hooks/useProductivity';
import { toast } from 'sonner';

const PersonalLogView: React.FC = () => {
    const { todayLog, upsertDailyLog } = useProductivity();
    const [energy, setEnergy] = useState([todayLog?.energyLevel || 5]);
    const [mood, setMood] = useState([todayLog?.mood || 5]);
    const [journal, setJournal] = useState(todayLog?.journal || '');

    const handleSave = () => {
        upsertDailyLog({
            energyLevel: energy[0],
            mood: mood[0],
            journal
        });
        toast.success("Diário pessoal atualizado!");
    };

    return (
        <div className="space-y-6">
            <Card className="bg-card/20 backdrop-blur-sm border-white/[0.03] overflow-hidden relative">
                <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
                    <Book className="w-48 h-48" />
                </div>

                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Book className="w-5 h-5 text-muted-foreground" />
                        Diário & Bem-Estar
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-8 relative z-10">
                    <div className="grid md:grid-cols-2 gap-8">
                        <div className="space-y-6">
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <Label className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                                        <Zap className="w-3 h-3 text-amber-500" /> Nível de Energia ({energy[0]}/10)
                                    </Label>
                                </div>
                                <Slider value={energy} onValueChange={setEnergy} max={10} min={1} step={1} className="py-2" />
                            </div>

                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <Label className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                                        <Smile className="w-3 h-3 text-blue-500" /> Humor do Dia ({mood[0]}/10)
                                    </Label>
                                </div>
                                <Slider value={mood} onValueChange={setMood} max={10} min={1} step={1} className="py-2" />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Pensamentos do Dia</Label>
                            <Textarea
                                placeholder="Como foi seu dia? O que você aprendeu?"
                                value={journal}
                                onChange={(e) => setJournal(e.target.value)}
                                className="min-h-[120px] bg-background/50 border-white/[0.05] resize-none focus-visible:ring-primary/20 focus-visible:border-primary/30"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end border-t border-white/[0.03] pt-6">
                        <Button onClick={handleSave} className="gap-2 px-8 rounded-xl font-bold">
                            <Save className="w-4 h-4" /> Salvar Registro
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Daily Review Checklist (Tactical Layer 2 extension) */}
            <Card className="border-primary/5 bg-primary/2">
                <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-black uppercase tracking-[0.2em] text-primary/60">
                        Revisão Rápida de Fechamento
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    {[
                        'Registrei todas as finanças do dia?',
                        'Limpei minha Top 3 list?',
                        'Minha agenda para amanhã está organizada?',
                        'O que foi meu maior aprendizado hoje?'
                    ].map((item, i) => (
                        <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-background/50 border border-white/[0.03] group cursor-pointer hover:border-primary/20 transition-all">
                            <div className="w-5 h-5 rounded-md border-2 border-primary/5 flex items-center justify-center group-hover:border-primary/30 transition-colors">
                                <CheckCircle2 className="w-3 h-3 text-primary opacity-0 group-hover:opacity-100" />
                            </div>
                            <span className="text-sm font-medium">{item}</span>
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>
    );
};

const Label = ({ children, className }: { children: React.ReactNode, className?: string }) => (
    <label className={className}>{children}</label>
);

export default PersonalLogView;
