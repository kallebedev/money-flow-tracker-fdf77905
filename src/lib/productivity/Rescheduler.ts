import { ProductivityTask, TaskStatus } from '@/lib/types';
import { addMinutes, parseISO, formatISO } from 'date-fns';

/**
 * Reschedules upcoming tasks if a preceding task is delayed.
 * @param tasks List of productivity tasks
 * @param delayedTaskId ID of the task that caused the delay
 * @param delayMinutes Number of minutes to shift subsequent tasks
 * @returns Updated list of tasks
 */
export const rescheduleFollowingTasks = (
    tasks: ProductivityTask[],
    delayedTaskId: string,
    delayMinutes: number
): ProductivityTask[] => {
    const delayedTask = tasks.find(t => t.id === delayedTaskId);
    if (!delayedTask) return tasks;

    const delayedTaskStartTime = parseISO(delayedTask.scheduledStartTime).getTime();

    return tasks.map(task => {
        // Only shift tasks that start AFTER the delayed task and are NOT completed
        if (
            task.id !== delayedTaskId &&
            task.status !== 'completed' &&
            parseISO(task.scheduledStartTime).getTime() > delayedTaskStartTime
        ) {
            const newStartTime = addMinutes(parseISO(task.scheduledStartTime), delayMinutes);
            return {
                ...task,
                scheduledStartTime: formatISO(newStartTime),
                status: task.status === 'todo' ? 'todo' : task.status // Optional: mark as 'delayed' if needed
            };
        }

        // Mark the current task as delayed if it's the one moving
        if (task.id === delayedTaskId) {
            return { ...task, status: 'delayed' };
        }

        return task;
    });
};
