import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { UserStats } from '@/lib/types';
import { toast } from "sonner";
import { differenceInDays, parseISO, format } from "date-fns";

export const useProductivityStats = () => {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    const { data: stats, isLoading } = useQuery({
        queryKey: ["productivity_stats", user?.id],
        queryFn: async () => {
            if (!user) return null;

            // Get or create stats
            const { data, error } = await supabase
                .from("productivity_user_stats")
                .select("*")
                .eq("user_id", user.id)
                .maybeSingle();

            if (error) throw error;

            if (!data) {
                const { data: newData, error: insertError } = await supabase
                    .from("productivity_user_stats")
                    .insert([{ user_id: user.id }])
                    .select()
                    .single();

                if (insertError) throw insertError;
                return mapStats(newData);
            }

            return mapStats(data);
        },
        enabled: !!user,
    });

    const mapStats = (s: any): UserStats => ({
        userId: s.user_id,
        level: s.level || 1,
        experience: s.experience || 0,
        points: s.points || 0,
        streakCurrent: s.streak_current || 0,
        streakMax: s.streak_max || 0,
        medals: s.medals || [],
        totalFocusMinutes: s.total_focus_minutes || 0,
        lastActiveDate: s.last_active_date,
        updatedAt: s.updated_at
    });

    const updateStatsMutation = useMutation({
        mutationFn: async (updates: Partial<UserStats>) => {
            const dbUpdates: any = {};
            if (updates.level !== undefined) dbUpdates.level = updates.level;
            if (updates.experience !== undefined) dbUpdates.experience = updates.experience;
            if (updates.points !== undefined) dbUpdates.points = updates.points;
            if (updates.streakCurrent !== undefined) dbUpdates.streak_current = updates.streakCurrent;
            if (updates.streakMax !== undefined) dbUpdates.streak_max = updates.streakMax;
            if (updates.medals !== undefined) dbUpdates.medals = updates.medals;
            if (updates.totalFocusMinutes !== undefined) dbUpdates.total_focus_minutes = updates.totalFocusMinutes;
            if (updates.lastActiveDate !== undefined) dbUpdates.last_active_date = updates.lastActiveDate;

            const { error } = await supabase
                .from("productivity_user_stats")
                .update(dbUpdates)
                .eq("user_id", user?.id);

            if (error) throw error;
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["productivity_stats"] }),
    });

    const addExperience = async (amount: number) => {
        if (!stats) return;

        let newExp = stats.experience + amount;
        let newLevel = stats.level;
        const xpToNextLevel = stats.level * 1000;

        if (newExp >= xpToNextLevel) {
            newExp -= xpToNextLevel;
            newLevel += 1;
            toast.success(`🎉 NÍVEL UP! Você agora é nível ${newLevel}!`, {
                description: "Continue mantendo a consistência!",
                duration: 5000
            });
        }

        // Update streak logic
        const today = format(new Date(), 'yyyy-MM-dd');
        let newStreak = stats.streakCurrent;
        let newMaxStreak = stats.streakMax;

        if (stats.lastActiveDate !== today) {
            const daysDiff = stats.lastActiveDate ? differenceInDays(parseISO(today), parseISO(stats.lastActiveDate)) : 0;

            if (daysDiff === 1) {
                newStreak += 1;
            } else if (daysDiff > 1 || !stats.lastActiveDate) {
                newStreak = 1;
            }

            if (newStreak > newMaxStreak) newMaxStreak = newStreak;
        }

        updateStatsMutation.mutate({
            experience: newExp,
            level: newLevel,
            streakCurrent: newStreak,
            streakMax: newMaxStreak,
            lastActiveDate: today,
            points: stats.points + Math.floor(amount / 10)
        });
    };

    const addFocusMinutes = (minutes: number) => {
        if (!stats || minutes <= 0) return;
        const today = format(new Date(), 'yyyy-MM-dd');

        const nextTotal = (stats.totalFocusMinutes || 0) + minutes;

        updateStatsMutation.mutate({
            totalFocusMinutes: nextTotal,
            lastActiveDate: today,
        });
    };

    return {
        stats,
        isLoading,
        addExperience,
        addFocusMinutes,
        updateStats: updateStatsMutation.mutate
    };
};
