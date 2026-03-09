import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useProductivity } from "@/hooks/useProductivity";
import { toast } from "sonner";
import { CheckCircle2, Circle, Plus, Target, Trash2, Clock3 } from "lucide-react";
import { format } from "date-fns";

const getDailyTargetMinutes = (notes?: string): number | undefined => {
  if (!notes || !notes.startsWith("{")) return undefined;
  try {
    const parsed = JSON.parse(notes);
    const v = Number(parsed?.dailyTargetMinutes);
    return Number.isFinite(v) && v > 0 ? Math.round(v) : undefined;
  } catch {
    return undefined;
  }
};

export default function DailyGoalsView() {
  const { goals, addGoalAsync, updateGoal, deleteGoal, resetDailyGoals } = useProductivity();
  const [newTitle, setNewTitle] = React.useState("");
  const [newDailyTarget, setNewDailyTarget] = React.useState("");
  const [isBooting, setIsBooting] = React.useState(true);

  React.useEffect(() => {
    let alive = true;
    (async () => {
      try {
        await resetDailyGoals();
      } catch (e: unknown) {
        console.error(e);
      } finally {
        if (alive) setIsBooting(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [resetDailyGoals]);

  const today = format(new Date(), "yyyy-MM-dd");
  const dailyGoals = goals.filter((g) => g.type === "daily");

  const submit = async () => {
    if (!newTitle.trim()) return;
    const parsedDailyTarget = Number(newDailyTarget);
    const hasDailyTarget = Number.isFinite(parsedDailyTarget) && parsedDailyTarget > 0;
    try {
      await addGoalAsync({
        title: newTitle.trim(),
        type: "daily",
        targetDate: today,
        progress: 0,
        notes: hasDailyTarget ? JSON.stringify({ dailyTargetMinutes: Math.round(parsedDailyTarget) }) : "",
        status: "pending",
      });
      setNewTitle("");
      setNewDailyTarget("");
      toast.success("Meta diária criada!");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Erro ao criar meta diária";
      toast.error(msg);
    }
  };

  const toggleDoneToday = (id: string, done: boolean) => {
    updateGoal(id, { status: done ? "achieved" : "pending", progress: done ? 100 : 0, targetDate: today });
  };

  const setProgress = (id: string, p: number) => {
    const progress = Math.max(0, Math.min(100, Math.round(p)));
    updateGoal(id, { progress, status: progress >= 100 ? "achieved" : "pending", targetDate: today });
  };

  return (
    <div className="grid gap-8 lg:grid-cols-2 animate-in fade-in duration-500">
      <div className="space-y-8">
        <Card className="border-primary/5 bg-primary/[0.01] rounded-[32px] overflow-hidden shadow-2xl ring-1 ring-white/[0.03]">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-xl">
                <Target className="w-5 h-5 text-primary" />
              </div>
              Metas diárias
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col gap-2 p-3 bg-background/50 border border-white/[0.03] rounded-2xl">
              <div className="flex gap-2 items-center">
                <Input
                  placeholder="Ex: 30min de leitura, treinar, estudar..."
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && submit()}
                  className="h-11 bg-transparent border-none focus-visible:ring-0 text-sm font-medium flex-1 px-1"
                />
                <Button
                  size="sm"
                  onClick={submit}
                  className="h-9 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest bg-primary/10 hover:bg-primary/20 text-primary"
                >
                  <Plus className="w-3.5 h-3.5 mr-1.5" /> Criar
                </Button>
              </div>
              <div className="px-2 pb-1">
                <div className="flex items-center gap-2 mt-1">
                  <Clock3 className="w-3 h-3 text-primary" />
                  <Input
                    type="number"
                    min={1}
                    step={1}
                    value={newDailyTarget}
                    onChange={(e) => setNewDailyTarget(e.target.value)}
                    className="h-8 text-xs bg-background/50 border-white/[0.1]"
                    placeholder="Tempo alvo (min) opcional"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-60">
                  Hoje ({today})
                </p>
                {isBooting && (
                  <Badge variant="outline" className="text-[9px] bg-white/[0.02] border-white/[0.06] text-muted-foreground">
                    Sincronizando...
                  </Badge>
                )}
              </div>

              {dailyGoals.length === 0 ? (
                <div className="text-[11px] text-muted-foreground border-2 border-dashed border-white/[0.05] rounded-2xl py-10 text-center">
                  Crie sua primeira meta diária para começar.
                </div>
              ) : (
                <div className="space-y-2">
                  {dailyGoals.map((g) => {
                    const done = g.status === "achieved" || (g.progress ?? 0) >= 100;
                    const dailyTargetMinutes = getDailyTargetMinutes(g.notes);
                    const pct = done ? 100 : Math.max(0, Math.min(100, Math.round(g.progress ?? 0)));

                    return (
                      <div key={g.id} className="p-4 rounded-3xl bg-white/[0.02] border border-white/[0.03]">
                        <div className="flex items-start justify-between gap-3">
                          <button
                            className="flex items-start gap-3 text-left min-w-0"
                            onClick={() => toggleDoneToday(g.id, !done)}
                            title={done ? "Marcar como pendente hoje" : "Marcar como concluída hoje"}
                          >
                            <div className="mt-0.5">
                              {done ? (
                                <CheckCircle2 className="w-5 h-5 text-primary" />
                              ) : (
                                <Circle className="w-5 h-5 text-muted-foreground" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className={`text-sm font-black break-words ${done ? "line-through opacity-60" : "text-white/90"}`}>
                                {g.title}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                {dailyTargetMinutes ? (
                                  <Badge className="text-[9px] bg-primary/10 text-primary border border-primary/20">
                                    <Clock3 className="w-3 h-3 mr-1" /> {dailyTargetMinutes} min/dia
                                  </Badge>
                                ) : null}
                                <Badge variant="outline" className="text-[9px] border-white/[0.06] text-muted-foreground">
                                  {pct}%
                                </Badge>
                              </div>
                            </div>
                          </button>

                          <div className="flex items-center gap-1 shrink-0">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 px-3 rounded-xl text-[10px] font-black uppercase tracking-widest"
                              onClick={() => setProgress(g.id, (g.progress ?? 0) + 10)}
                            >
                              +10
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 px-3 rounded-xl text-[10px] font-black uppercase tracking-widest"
                              onClick={() => setProgress(g.id, (g.progress ?? 0) - 10)}
                            >
                              -10
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 rounded-xl"
                              onClick={() => deleteGoal(g.id)}
                              title="Excluir meta diária"
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </div>

                        <div className="mt-3">
                          <Progress value={pct} className="h-2 bg-white/[0.05]" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-8">
        <Card className="bg-card/20 border-white/[0.03] rounded-[32px] overflow-hidden shadow-2xl ring-1 ring-white/[0.03]">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-3">
              <div className="p-2 bg-white/[0.03] rounded-xl">
                <Target className="w-5 h-5 text-muted-foreground" />
              </div>
              Como funciona
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-white/60 leading-relaxed">
              Essas metas são recorrentes: você executa todos os dias. À meia-noite (horário local), o sistema reseta automaticamente
              o status e o progresso para começar um novo ciclo.
            </p>
            <p className="text-xs text-muted-foreground">
              Dica: use o campo “Tempo alvo (min)” para aparecer como bloco fixo no seu planejamento diário.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

