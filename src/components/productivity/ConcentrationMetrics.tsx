import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, Zap, TrendingUp, Clock } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

const ConcentrationMetrics: React.FC = () => {
    return (
        <Card className="bg-card/20 border-white/[0.03] overflow-hidden group">
            <CardHeader className="pb-2">
                <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <Activity className="w-3 h-3" /> Métricas de Concentração
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase">Foco Médio</span>
                        <div className="flex items-end gap-1">
                            <span className="text-2xl font-black tabular-nums">84</span>
                            <span className="text-[10px] font-bold text-emerald-500 pb-1.5 flex items-center">
                                <TrendingUp className="w-2 h-2 mr-0.5" /> 12%
                            </span>
                        </div>
                    </div>
                    <div className="space-y-1">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase">Tempo Total</span>
                        <div className="flex items-end gap-1">
                            <span className="text-2xl font-black tabular-nums">5h 20m</span>
                        </div>
                    </div>
                </div>

                <div className="space-y-2 pt-2">
                    <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-tighter">
                        <span className="text-muted-foreground flex items-center gap-1">
                            <Zap className="w-2.5 h-2.5 text-amber-500" /> Bateria Cognitiva
                        </span>
                        <span>65%</span>
                    </div>
                    <Progress value={65} className="h-1 bg-amber-500/10" />
                </div>

                <div className="p-3 rounded-xl bg-primary/2 border border-primary/5 mt-2">
                    <p className="text-[10px] leading-relaxed text-primary/80 italic font-medium">
                        "Sua concentração costuma cair após 45 min. Sugerimos uma pausa curta de 5 min para recarregar sua bateria cognitiva."
                    </p>
                </div>
            </CardContent>
        </Card>
    );
};

export default ConcentrationMetrics;
