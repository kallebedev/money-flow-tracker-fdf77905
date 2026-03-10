import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, Zap, Eye, Pause, Brain } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useProductivity } from '@/hooks/useProductivity';
import { useProductivityStats } from '@/hooks/useProductivityStats';
import { getTodayFocusData } from '@/hooks/useFocusTracker';

const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hrs <= 0) return `${mins}m`;
    return `${hrs}h ${mins.toString().padStart(2, '0')}m`;
};

const ConcentrationMetrics: React.FC = () => {
    const { todayLog } = useProductivity();
    const { stats } = useProductivityStats();
    const focusData = getTodayFocusData();

    const totalFocusMinutes = stats?.totalFocusMinutes ?? 0;
    const streakDays = stats?.streakCurrent ?? 0;
    const focusScore = focusData.focusScore;

    const energy = todayLog?.energyLevel ?? 0;
    const mood = todayLog?.mood ?? 0;
    const hasTodayLog = energy > 0 && mood > 0;
    const cognitiveBattery = hasTodayLog ? Math.round(((energy + mood) / 20) * 100) : 0;

    return (
        <Card className="bg-card/20 border-white/[0.03] overflow-hidden group">
            <CardHeader className="pb-2">
                <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <Brain className="w-3 h-3" /> Métricas de Concentração
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Focus Score */}
                <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-black text-primary uppercase tracking-widest">Focus Score</span>
                        <span className="text-2xl font-black text-primary tabular-nums">{focusScore}%</span>
                    </div>
                    <Progress value={focusScore} className="h-1.5 bg-primary/10" />
                    <p className="text-[9px] text-muted-foreground mt-2">
                        Baseado em tempo focado, interrupções e pausas de hoje
                    </p>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.03] space-y-1">
                        <div className="flex items-center gap-1.5">
                            <Activity className="w-3 h-3 text-emerald-500" />
                            <span className="text-[9px] font-bold text-muted-foreground uppercase">Foco Hoje</span>
                        </div>
                        <span className="text-lg font-black tabular-nums">{formatTime(focusData.totalFocusSeconds)}</span>
                    </div>
                    <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.03] space-y-1">
                        <div className="flex items-center gap-1.5">
                            <Eye className="w-3 h-3 text-red-400" />
                            <span className="text-[9px] font-bold text-muted-foreground uppercase">Distrações</span>
                        </div>
                        <span className="text-lg font-black tabular-nums">{focusData.distractions}</span>
                    </div>
                    <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.03] space-y-1">
                        <div className="flex items-center gap-1.5">
                            <Pause className="w-3 h-3 text-amber-400" />
                            <span className="text-[9px] font-bold text-muted-foreground uppercase">Pausas</span>
                        </div>
                        <span className="text-lg font-black tabular-nums">{focusData.pauses}</span>
                    </div>
                    <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.03] space-y-1">
                        <div className="flex items-center gap-1.5">
                            <Eye className="w-3 h-3 text-orange-400" />
                            <span className="text-[9px] font-bold text-muted-foreground uppercase">Fora da Aba</span>
                        </div>
                        <span className="text-lg font-black tabular-nums">{formatTime(focusData.totalAwaySeconds)}</span>
                    </div>
                </div>

                {/* Aggregate Stats */}
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/[0.03]">
                    <div className="space-y-1">
                        <span className="text-[9px] font-bold text-muted-foreground uppercase">Foco Acumulado</span>
                        <span className="text-lg font-black tabular-nums block">{formatTime(totalFocusMinutes * 60)}</span>
                    </div>
                    <div className="space-y-1">
                        <span className="text-[9px] font-bold text-muted-foreground uppercase">Streak</span>
                        <span className="text-lg font-black tabular-nums block">{streakDays} dias</span>
                    </div>
                </div>

                {/* Cognitive Battery */}
                <div className="space-y-1.5 pt-2 border-t border-white/[0.03]">
                    <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-tighter">
                        <span className="text-muted-foreground flex items-center gap-1">
                            <Zap className="w-2.5 h-2.5 text-amber-500" /> Bateria Cognitiva
                        </span>
                        <span>{hasTodayLog ? `${cognitiveBattery}%` : '--'}</span>
                    </div>
                    <Progress value={hasTodayLog ? cognitiveBattery : 0} className="h-1 bg-amber-500/10" />
                    <p className="text-[9px] text-muted-foreground italic">
                        {hasTodayLog
                            ? `${cognitiveBattery >= 75 ? 'Plena' : cognitiveBattery >= 40 ? 'Estável' : 'Baixa – priorize pausas'}`
                            : 'Registre seu diário para calibrar'}
                    </p>
                </div>
            </CardContent>
        </Card>
    );
};

export default ConcentrationMetrics;
