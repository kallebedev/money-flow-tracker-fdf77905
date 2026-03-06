import { useState, useEffect } from 'react';
import { ProductivityTask, Goal, Project, PersonalLog } from '@/lib/types';
import { rescheduleFollowingTasks } from '@/lib/productivity/Rescheduler';
import { formatISO, format } from 'date-fns';

const STORAGE_KEY = 'productivity_data_v2';

export const useProductivity = () => {
    const [tasks, setTasks] = useState<ProductivityTask[]>([]);
    const [goals, setGoals] = useState<Goal[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [logs, setLogs] = useState<PersonalLog[]>([]);

    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                const data = JSON.parse(saved);
                setTasks(data.tasks || []);
                setGoals(data.goals || []);
                setProjects(data.projects || []);
                setLogs(data.logs || []);
            } catch (e) {
                console.error("Failed to parse productivity data", e);
            }
        }
    }, []);

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ tasks, goals, projects, logs }));
    }, [tasks, goals, projects, logs]);

    // Tasks
    const addTask = (task: Omit<ProductivityTask, 'id' | 'createdAt'>) => {
        const newTask: ProductivityTask = {
            ...task,
            id: Math.random().toString(36).substr(2, 9),
            createdAt: formatISO(new Date()),
        };
        setTasks(prev => [...prev, newTask]);
    };

    const updateTask = (id: string, updates: Partial<ProductivityTask>) => {
        setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
    };

    const deleteTask = (id: string) => {
        setTasks(prev => prev.filter(t => t.id !== id));
    };

    // Goals
    const addGoal = (goal: Omit<Goal, 'id'>) => {
        const newGoal: Goal = { ...goal, id: Math.random().toString(36).substr(2, 9) };
        setGoals(prev => [...prev, newGoal]);
    };

    const toggleGoalStatus = (id: string) => {
        setGoals(prev => prev.map(g => g.id === id ? {
            ...g,
            status: g.status === 'achieved' ? 'pending' : 'achieved'
        } : g));
    };

    const deleteGoal = (id: string) => {
        setGoals(prev => prev.filter(g => g.id !== id));
    };

    const updateGoal = (id: string, updates: Partial<Goal>) => {
        setGoals(prev => prev.map(g => g.id === id ? { ...g, ...updates } : g));
    };

    // Projects
    const addProject = (project: Omit<Project, 'id'>) => {
        const newProject: Project = { ...project, id: Math.random().toString(36).substr(2, 9) };
        setProjects(prev => [...prev, newProject]);
    };

    const deleteProject = (id: string) => {
        setProjects(prev => prev.filter(p => p.id !== id));
    };

    const toggleProjectStatus = (id: string) => {
        setProjects(prev => prev.map(p => p.id === id ? {
            ...p,
            status: p.status === 'completed' ? 'active' : 'completed'
        } : p));
    };

    const updateProject = (id: string, updates: Partial<Project>) => {
        setProjects(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
    };

    // Logs (Mood/Energy)
    const upsertDailyLog = (log: Omit<PersonalLog, 'id' | 'date'>) => {
        const today = format(new Date(), 'yyyy-MM-dd');
        setLogs(prev => {
            const existing = prev.find(l => l.date === today);
            if (existing) {
                return prev.map(l => l.date === today ? { ...l, ...log } : l);
            }
            return [...prev, { ...log, id: Math.random().toString(36).substr(2, 9), date: today }];
        });
    };

    const startTask = (id: string) => updateTask(id, { status: 'in-progress' });
    const completeTask = (id: string) => updateTask(id, { status: 'completed' });
    const toggleStatus = (id: string) => {
        const task = tasks.find(t => t.id === id);
        if (!task) return;
        updateTask(id, { status: task.status === 'completed' ? 'todo' : 'completed' });
    };

    const delayTask = (id: string, minutes: number) => {
        setTasks(prev => rescheduleFollowingTasks(prev, id, minutes));
    };

    const setTopThree = (id: string, isTopThree: boolean) => updateTask(id, { isTopThree });

    return {
        tasks, addTask, updateTask, deleteTask, startTask, completeTask, delayTask, toggleStatus, setTopThree,
        goals, addGoal, toggleGoalStatus, deleteGoal, updateGoal,
        projects, addProject, deleteProject, toggleProjectStatus, updateProject,
        logs, upsertDailyLog,
        todayLog: logs.find(l => l.date === format(new Date(), 'yyyy-MM-dd'))
    };
};
