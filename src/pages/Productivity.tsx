import { useState } from "react";
import { useProductivity } from "@/hooks/useProductivity";
import EisenhowerMatrix from "@/components/productivity/EisenhowerMatrix";
import DailyPlanner from "@/components/productivity/DailyPlanner";
import ProductivityTaskForm from "@/components/productivity/ProductivityTaskForm";
import StrategicView from "@/components/productivity/StrategicView";

import FocusMode from "@/components/productivity/FocusMode";
import ConcentrationMetrics from "@/components/productivity/ConcentrationMetrics";
import { ProductivityDashboard } from "@/components/productivity/ProductivityDashboard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Zap, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Productivity() {
    const {
        tasks, goals, addTask, updateTask, deleteTask,
        startTask, completeTask, toggleStatus, setTopThree
    } = useProductivity();
    const [isFocusMode, setIsFocusMode] = useState(false);
    const [focusTaskId, setFocusTaskId] = useState<string | undefined>();

    const top3Tasks = tasks.filter(t => t.isTopThree).slice(0, 3);

    return (
        <div className="w-full space-y-8 animate-fade-in pb-20">
            {isFocusMode && (
                <FocusMode
                    onClose={() => setIsFocusMode(false)}
                    activeTaskId={focusTaskId}
                />
            )}

            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-2">
                <div className="space-y-1">
                    <h1 className="text-3xl md:text-title text-[#f0f0f0]">Productivity Hub</h1>
                    <p className="text-[13px] md:text-[15px] text-[#555] font-light">Gerencie seu tempo e foco com clareza.</p>
                </div>
            </div>

            <Tabs defaultValue="intelligence" className="w-full">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8 mt-2">
                    <div className="overflow-x-auto pb-2 -mx-4 px-4 lg:mx-0 lg:px-0">
                        <TabsList className="relative bg-[#050505]/90 p-1.5 rounded-[999px] h-16 border border-white/[0.06] w-max lg:w-auto shadow-[0_18px_60px_rgba(0,0,0,0.65)]">
                            <TabsTrigger
                                value="intelligence"
                                className="px-4 md:px-5 rounded-2xl text-[9px] md:text-[10px] font-black tracking-[0.22em] text-nowrap flex flex-col items-center justify-center gap-0.5 text-muted-foreground/70 data-[state=active]:text-black data-[state=active]:shadow-[0_0_30px_rgba(34,197,94,0.55)] data-[state=active]:bg-primary"
                            >
                                <span className="uppercase flex items-center gap-1">
                                    <span>🛸</span>
                                    <span>Inteligência</span>
                                </span>
                                <span className="text-[9px] font-medium uppercase tracking-[0.2em] text-muted-foreground/80">
                                    Visão Geral
                                </span>
                            </TabsTrigger>
                            <TabsTrigger
                                value="strategic"
                                className="px-4 md:px-5 rounded-2xl text-[9px] md:text-[10px] font-black tracking-[0.22em] text-nowrap flex flex-col items-center justify-center gap-0.5 text-muted-foreground/70 data-[state=active]:text-black data-[state=active]:shadow-[0_0_30px_rgba(34,197,94,0.55)] data-[state=active]:bg-primary"
                            >
                                <span className="uppercase flex items-center gap-1">
                                    <span className="text-[10px] opacity-70">1.</span>
                                    <span>Estratégico</span>
                                </span>
                                <span className="text-[9px] font-medium uppercase tracking-[0.2em] text-muted-foreground/80">
                                    Metas & Sistemas
                                </span>
                            </TabsTrigger>
                            <TabsTrigger
                                value="tactical"
                                className="px-4 md:px-5 rounded-2xl text-[9px] md:text-[10px] font-black tracking-[0.22em] text-nowrap flex flex-col items-center justify-center gap-0.5 text-muted-foreground/70 data-[state=active]:text-black data-[state=active]:shadow-[0_0_30px_rgba(34,197,94,0.55)] data-[state=active]:bg-primary"
                            >
                                <span className="uppercase flex items-center gap-1">
                                    <span className="text-[10px] opacity-70">2.</span>
                                    <span>Tático</span>
                                </span>
                                <span className="text-[9px] font-medium uppercase tracking-[0.2em] text-muted-foreground/80">
                                    Dia em Execução
                                </span>
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    <Button
                        onClick={() => setIsFocusMode(true)}
                        className="bg-primary/5 hover:bg-primary/10 text-primary border border-primary/10 rounded-xl font-black uppercase text-[9px] md:text-[10px] tracking-[0.15em] md:tracking-[0.2em] px-4 md:px-6 h-11 group shadow-lg shadow-primary/5 w-full lg:w-auto"
                    >
                        <Zap className="w-4 h-4 mr-2 group-hover:animate-pulse" /> Ativar Santuário de Foco
                    </Button>
                </div>

                <TabsContent value="intelligence" className="animate-in fade-in duration-500">
                    <ProductivityDashboard tasks={tasks} goals={goals} />
                </TabsContent>

                <TabsContent value="strategic" className="animate-in fade-in duration-500">
                    <StrategicView />
                </TabsContent>


                <TabsContent value="tactical" className="space-y-8 animate-in fade-in duration-500">
                    <div className="grid lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-1 space-y-8">
                            <ProductivityTaskForm onAdd={addTask} />

                            {/* Top 3 Focus */}
                            <Card className="bg-card/40 border border-white/[0.03] relative overflow-hidden group rounded-[24px] shadow-2xl ring-1 ring-white/[0.03]">
                                <CardHeader className="pb-3 relative">
                                    <CardTitle className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                                        <Trophy className="w-3 h-3" /> Top 3 do Dia
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3 relative">
                                    {top3Tasks.map((t, i) => (
                                        <div key={t.id} className="flex items-center gap-3 p-3 rounded-xl bg-background/50 border border-white/[0.03] hover:border-primary/20 transition-all cursor-pointer" onClick={() => toggleStatus(t.id)}>
                                            <div className="flex-1 min-w-0">
                                                <p className={cn("text-sm font-bold break-words", t.status === 'completed' && "line-through opacity-50")}>{t.title}</p>
                                            </div>
                                            <Badge className="text-[9px] bg-primary/20 text-primary border-none">#0{i + 1}</Badge>
                                        </div>
                                    ))}
                                    {top3Tasks.length < 3 && (
                                        <div className="text-[10px] text-center text-muted-foreground border-2 border-dashed border-white/[0.05] rounded-xl py-4 italic">
                                            Escolha {3 - top3Tasks.length} tarefas de alto impacto
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            <ConcentrationMetrics />
                        </div>

                        <div className="lg:col-span-2 space-y-8">
                            <DailyPlanner
                                tasks={tasks}
                                goals={goals}
                                onStartTask={(id) => {
                                    setFocusTaskId(id);
                                    setIsFocusMode(true);
                                }}
                                onCompleteTask={completeTask}
                                onDeleteTask={deleteTask}
                                onUpdateTask={updateTask}
                            />
                            <div className="pt-4">
                                <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground mb-4 px-2 opacity-50">Análise de Prioridades (Matriz)</h4>
                                <EisenhowerMatrix
                                    tasks={tasks}
                                    onToggleStatus={toggleStatus}
                                    onToggleTopThree={setTopThree}
                                    onUpdateTask={updateTask}
                                />
                            </div>
                        </div>
                    </div>
                </TabsContent>

            </Tabs>
        </div>
    );
}
