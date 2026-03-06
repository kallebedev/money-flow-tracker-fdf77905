import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { ProductivityTask, Goal, Project, PersonalLog } from '@/lib/types';
import { rescheduleFollowingTasks } from '@/lib/productivity/Rescheduler';
import { formatISO, format } from 'date-fns';
import { toast } from "sonner";

export const useProductivity = () => {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    // --- Queries ---

    const { data: tasks = [] } = useQuery({
        queryKey: ["productivity_tasks", user?.id],
        queryFn: async () => {
            if (!user) return [];
            const { data, error } = await supabase
                .from("productivity_tasks")
                .select("*")
                .eq("user_id", user.id)
                .order("scheduled_start_time", { ascending: true });

            if (error) throw error;
            return (data || []).map(t => ({
                id: t.id,
                title: t.title,
                description: t.description,
                impact: t.impact,
                urgency: t.urgency,
                estimatedDuration: t.estimated_duration,
                scheduledStartTime: t.scheduled_start_time,
                status: t.status,
                createdAt: t.created_at,
                projectId: t.project_id,
                isTopThree: t.is_top_three
            })) as ProductivityTask[];
        },
        enabled: !!user,
    });

    const { data: goals = [] } = useQuery({
        queryKey: ["productivity_goals", user?.id],
        queryFn: async () => {
            if (!user) return [];
            const { data, error } = await supabase
                .from("productivity_goals")
                .select("*")
                .eq("user_id", user.id);

            if (error) throw error;
            return (data || []).map(g => ({
                id: g.id,
                title: g.title,
                type: g.type,
                targetDate: g.target_date,
                status: g.status
            })) as Goal[];
        },
        enabled: !!user,
    });

    const { data: projects = [] } = useQuery({
        queryKey: ["productivity_projects", user?.id],
        queryFn: async () => {
            if (!user) return [];
            const { data, error } = await supabase
                .from("productivity_projects")
                .select("*")
                .eq("user_id", user.id);

            if (error) throw error;
            return data as Project[];
        },
        enabled: !!user,
    });

    const { data: logs = [] } = useQuery({
        queryKey: ["productivity_logs", user?.id],
        queryFn: async () => {
            if (!user) return [];
            const { data, error } = await supabase
                .from("productivity_logs")
                .select("*")
                .eq("user_id", user.id);

            if (error) throw error;
            return (data || []).map(l => ({
                id: l.id,
                date: l.date,
                energyLevel: l.energy_level,
                mood: l.mood,
                journal: l.journal
            })) as PersonalLog[];
        },
        enabled: !!user,
    });

    // --- Mutations: Tasks ---

    const addTaskMutation = useMutation({
        mutationFn: async (task: Omit<ProductivityTask, 'id' | 'createdAt'>) => {
            const { data, error } = await supabase
                .from("productivity_tasks")
                .insert([{
                    user_id: user?.id,
                    title: task.title,
                    description: task.description,
                    impact: task.impact,
                    urgency: task.urgency,
                    estimated_duration: task.estimatedDuration,
                    scheduled_start_time: task.scheduledStartTime,
                    status: task.status,
                    project_id: task.projectId,
                    is_top_three: task.isTopThree
                }])
                .select()
                .single();
            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["productivity_tasks"] });
            toast.success("Tarefa adicionada!");
        },
    });

    const updateTaskMutation = useMutation({
        mutationFn: async ({ id, updates }: { id: string, updates: Partial<ProductivityTask> }) => {
            const dbUpdates: any = {};
            if (updates.title !== undefined) dbUpdates.title = updates.title;
            if (updates.description !== undefined) dbUpdates.description = updates.description;
            if (updates.impact !== undefined) dbUpdates.impact = updates.impact;
            if (updates.urgency !== undefined) dbUpdates.urgency = updates.urgency;
            if (updates.estimatedDuration !== undefined) dbUpdates.estimated_duration = updates.estimatedDuration;
            if (updates.scheduledStartTime !== undefined) dbUpdates.scheduled_start_time = updates.scheduledStartTime;
            if (updates.status !== undefined) dbUpdates.status = updates.status;
            if (updates.projectId !== undefined) dbUpdates.project_id = updates.projectId;
            if (updates.isTopThree !== undefined) dbUpdates.is_top_three = updates.isTopThree;

            const { error } = await supabase
                .from("productivity_tasks")
                .update(dbUpdates)
                .eq("id", id);
            if (error) throw error;
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["productivity_tasks"] }),
    });

    const deleteTaskMutation = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.from("productivity_tasks").delete().eq("id", id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["productivity_tasks"] });
            toast.success("Tarefa removida");
        },
    });

    // --- Mutations: Goals ---

    const addGoalMutation = useMutation({
        mutationFn: async (goal: Omit<Goal, 'id'>) => {
            const { data, error } = await supabase
                .from("productivity_goals")
                .insert([{
                    user_id: user?.id,
                    title: goal.title,
                    type: goal.type,
                    target_date: goal.targetDate,
                    status: goal.status
                }])
                .select()
                .single();
            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["productivity_goals"] });
            toast.success("Meta estratégica adicionada!");
        },
    });

    const updateGoalMutation = useMutation({
        mutationFn: async ({ id, updates }: { id: string, updates: Partial<Goal> }) => {
            const dbUpdates: any = {};
            if (updates.title !== undefined) dbUpdates.title = updates.title;
            if (updates.type !== undefined) dbUpdates.type = updates.type;
            if (updates.targetDate !== undefined) dbUpdates.target_date = updates.targetDate;
            if (updates.status !== undefined) dbUpdates.status = updates.status;

            const { error } = await supabase
                .from("productivity_goals")
                .update(dbUpdates)
                .eq("id", id);
            if (error) throw error;
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["productivity_goals"] }),
    });

    const deleteGoalMutation = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.from("productivity_goals").delete().eq("id", id);
            if (error) throw error;
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["productivity_goals"] }),
    });

    // --- Mutations: Projects ---

    const addProjectMutation = useMutation({
        mutationFn: async (project: Omit<Project, 'id'>) => {
            const { data, error } = await supabase
                .from("productivity_projects")
                .insert([{ ...project, user_id: user?.id }])
                .select()
                .single();
            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["productivity_projects"] });
            toast.success("Projeto criado!");
        },
    });

    const updateProjectMutation = useMutation({
        mutationFn: async ({ id, updates }: { id: string, updates: Partial<Project> }) => {
            const { error } = await supabase
                .from("productivity_projects")
                .update(updates)
                .eq("id", id);
            if (error) throw error;
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["productivity_projects"] }),
    });

    const deleteProjectMutation = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.from("productivity_projects").delete().eq("id", id);
            if (error) throw error;
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["productivity_projects"] }),
    });

    // --- Mutations: Logs ---

    const upsertLogMutation = useMutation({
        mutationFn: async (log: Omit<PersonalLog, 'id' | 'date'>) => {
            const today = format(new Date(), 'yyyy-MM-dd');
            const dbLog = {
                user_id: user?.id,
                date: today,
                energy_level: log.energyLevel,
                mood: log.mood,
                journal: log.journal
            };

            const { data, error } = await supabase
                .from("productivity_logs")
                .upsert(dbLog, { onConflict: 'user_id,date' })
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["productivity_logs"] }),
    });

    // --- Helper Functions (Exposed) ---

    // Special case for bulk rescheduling
    const delayTaskMutation = useMutation({
        mutationFn: async ({ id, minutes }: { id: string, minutes: number }) => {
            const updatedTasks = rescheduleFollowingTasks(tasks, id, minutes);
            // In a better implementation, we'd do a batch update. For now, let's update affected tasks.
            // But we already have the updated array. We can try to update all tasks that changed.
            // To keep it simple, let's just update the specific and affected ones if they are in the DB.
            const promises = updatedTasks
                .filter(t => {
                    const original = tasks.find(ot => ot.id === t.id);
                    return original && (original.scheduledStartTime !== t.scheduledStartTime || original.status !== t.status);
                })
                .map(t => {
                    return supabase
                        .from("productivity_tasks")
                        .update({
                            scheduled_start_time: t.scheduledStartTime,
                            status: t.status
                        })
                        .eq("id", t.id);
                });

            await Promise.all(promises);
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["productivity_tasks"] }),
    });

    return {
        tasks,
        addTask: addTaskMutation.mutate,
        updateTask: (id: string, updates: Partial<ProductivityTask>) => updateTaskMutation.mutate({ id, updates }),
        deleteTask: deleteTaskMutation.mutate,
        startTask: (id: string) => updateTaskMutation.mutate({ id, updates: { status: 'in-progress' } }),
        completeTask: (id: string) => updateTaskMutation.mutate({ id, updates: { status: 'completed' } }),
        delayTask: (id: string, minutes: number) => delayTaskMutation.mutate({ id, minutes }),
        toggleStatus: (id: string) => {
            const task = tasks.find(t => t.id === id);
            if (!task) return;
            updateTaskMutation.mutate({ id, updates: { status: task.status === 'completed' ? 'todo' : 'completed' } });
        },
        setTopThree: (id: string, isTopThree: boolean) => updateTaskMutation.mutate({ id, updates: { isTopThree } }),

        goals,
        addGoal: addGoalMutation.mutate,
        toggleGoalStatus: (id: string) => {
            const goal = goals.find(g => g.id === id);
            if (!goal) return;
            updateGoalMutation.mutate({ id, updates: { status: goal.status === 'achieved' ? 'pending' : 'achieved' } });
        },
        deleteGoal: deleteGoalMutation.mutate,
        updateGoal: (id: string, updates: Partial<Goal>) => updateGoalMutation.mutate({ id, updates }),

        projects,
        addProject: addProjectMutation.mutate,
        deleteProject: deleteProjectMutation.mutate,
        toggleProjectStatus: (id: string) => {
            const project = projects.find(p => p.id === id);
            if (!project) return;
            updateProjectMutation.mutate({ id, updates: { status: project.status === 'completed' ? 'active' : 'completed' } });
        },
        updateProject: (id: string, updates: Partial<Project>) => updateProjectMutation.mutate({ id, updates }),

        logs,
        upsertDailyLog: upsertLogMutation.mutate,
        todayLog: logs.find(l => l.date === format(new Date(), 'yyyy-MM-dd')),
        isLoading: addTaskMutation.isPending || updateTaskMutation.isPending || deleteTaskMutation.isPending || delayTaskMutation.isPending
    };
};
