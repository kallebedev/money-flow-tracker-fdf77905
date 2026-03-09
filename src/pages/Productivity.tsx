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
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-10 mt-2">
                    <div className="overflow-x-auto pb-2 -mx-4 px-4 lg:mx-0 lg:px-0">
                        <TabsList className="relative bg-[#0c0c0c] p-1 rounded-2xl h-12 border border-white/[0.05] w-max lg:w-auto shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
                            {[
                                { value: "intelligence", icon: "🛸", label: "Inteligência", sub: "Visão Geral" },
                                { value: "strategic", icon: "📐", label: "Estratégico", sub: "Metas & Sistemas" },
                                { value: "tactical", icon: "⚡", label: "Tático", sub: "Dia em Execução" },
                            ].map((tab) => (
                                <TabsTrigger
                                    key={tab.value}
                                    value={tab.value}
                                    className={cn(
                                        "px-5 md:px-6 rounded-xl text-nowrap flex items-center gap-2.5 h-10",
                                        "text-[11px] font-bold tracking-[0.08em] uppercase",
                                        "text-muted-foreground/60 transition-all duration-300",
                                        "data-[state=active]:text-primary-foreground data-[state=active]:bg-primary data-[state=active]:shadow-[0_0_24px_rgba(34,197,94,0.4)]",
                                        "hover:text-muted-foreground"
                                    )}
                                >
                                    <span className="text-sm">{tab.icon}</span>
                                    <span>{tab.label}</span>
                                </TabsTrigger>
                            ))}
                        </TabsList>
                    </div>

                    <Button
                        onClick={() => setIsFocusMode(true)}
                        className={cn(
                            "bg-primary/5 hover:bg-primary/10 text-primary border border-primary/10",
                            "rounded-xl font-bold uppercase text-[10px] tracking-[0.12em]",
                            "px-5 h-10 group shadow-lg shadow-primary/5 w-full lg:w-auto transition-all"
                        )}
                    >
                        <Zap className="w-4 h-4 mr-2 group-hover:animate-pulse" /> Modo Foco
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
