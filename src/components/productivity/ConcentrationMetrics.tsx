import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, Zap } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useProductivity } from '@/hooks/useProductivity';
import { useProductivityStats } from '@/hooks/useProductivityStats';

const formatHoursAndMinutes = (totalMinutes: number) => {
    const hrs = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    if (hrs <= 0) return `${mins}m`;
    return `${hrs}h ${mins.toString().padStart(2, '0')}m`;
};

const ConcentrationMetrics: React.FC = () => {
    const { todayLog } = useProductivity();
    const { stats } = useProductivityStats();

    const totalFocusMinutes = stats?.totalFocusMinutes ?? 0;
    const streakDays = stats?.streakCurrent ?? 0;

    const averagePerDay = streakDays > 0
        ? Math.round(totalFocusMinutes / streakDays)
        : 0;

    const TARGET_MINUTES_PER_DAY = 120; // 2 horas de foco como meta
    const focusScore = TARGET_MINUTES_PER_DAY > 0
        ? Math.min(100, Math.round((averagePerDay / TARGET_MINUTES_PER_DAY) * 100))
        : 0;

    const energy = todayLog?.energyLevel ?? 0;
    const mood = todayLog?.mood ?? 0;
    const hasTodayLog = energy > 0 && mood > 0;
    const cognitiveBattery = hasTodayLog
        ? Math.round(((energy + mood) / 20) * 100)
        : 0;

    const batteryLabel = hasTodayLog
        ? cognitiveBattery >= 75
            ? 'Plena'
            : cognitiveBattery >= 40
                ? 'Estável'
                : 'Baixa – priorize pausas'
        : 'Registre seu diário hoje';

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
                        <span className="text-[10px] font-bold text-muted-foreground uppercase">
                            Foco Médio Diário
                        </span>
                        <div className="flex flex-col gap-1">
                            <span className="text-2xl font-black tabular-nums">
                                {averagePerDay}m
                            </span>
                            <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-[0.16em]">
                                Meta: {TARGET_MINUTES_PER_DAY}m/dia
                            </span>
                        </div>
                    </div>
                    <div className="space-y-1">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase">Tempo Total</span>
                        <div className="flex flex-col gap-1">
                            <span className="text-2xl font-black tabular-nums">
                                {formatHoursAndMinutes(totalFocusMinutes)}
                            </span>
                            <span className="text-[10px] text-muted-foreground uppercase tracking-[0.16em]">
                                {streakDays > 0 ? `${streakDays} dias de consistência` : 'Comece uma sessão de foco'}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="space-y-3 pt-2">
                    <div className="space-y-1.5">
                        <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-tighter">
                            <span className="text-muted-foreground">
                                Nível de Imersão
                            </span>
                            <span>{focusScore}%</span>
                        </div>
                        <Progress value={focusScore} className="h-1 bg-primary/10" />
                    </div>

                    <div className="space-y-1.5">
                        <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-tighter">
                            <span className="text-muted-foreground flex items-center gap-1">
                                <Zap className="w-2.5 h-2.5 text-amber-500" /> Bateria Cognitiva
                            </span>
                            <span>{hasTodayLog ? `${cognitiveBattery}%` : '--'}</span>
                        </div>
                        <Progress
                            value={hasTodayLog ? cognitiveBattery : 0}
                            className="h-1 bg-amber-500/10"
                        />
                    </div>
                </div>

                <div className="p-3 rounded-xl bg-primary/2 border border-primary/5 mt-2">
                    <p className="text-[10px] leading-relaxed text-primary/80 italic font-medium">
                        {hasTodayLog
                            ? `Sua bateria cognitiva hoje está em ${cognitiveBattery}%. ${batteryLabel}.`
                            : 'Preencha o Diário & Bem-Estar para calibrar sua bateria cognitiva e ver dicas personalizadas de pausa.'}
                    </p>
                </div>
            </CardContent>
        </Card>
    );
};

export default ConcentrationMetrics;
