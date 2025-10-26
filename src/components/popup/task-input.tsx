/**
 * Task input component for managing current focus task.
 * This component provides UI for setting, updating, and clearing the
 * current task that guides the AI's content analysis decisions.
 */

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Message, sendMessage } from "@/lib/messaging";
import { StorageKey, useStorage } from "@/lib/storage";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

/**
 * Task input component for managing current focus task.
 * Provides a textarea for users to describe their current task, with
 * save/clear functionality and cache invalidation. The task description
 * is used by AI to determine whether content is relevant or distracting.
 *
 * @example
 * ```tsx
 * <TaskInput />
 * ```
 *
 * @returns A React element containing the task input interface
 */
export const TaskInput = () => {
  const { data: currentTask, set: setTask } = useStorage(
    StorageKey.CURRENT_TASK,
  );
  const [inputValue, setInputValue] = useState(currentTask || "");
  const queryClient = useQueryClient();

  // Mutation for setting/updating task
  const setTaskMutation = useMutation({
    mutationFn: async (task: string) => {
      const oldTaskValue = currentTask || undefined;
      const newTaskValue = task.trim();
      await setTask(newTaskValue);

      // Send cache invalidation message
      await sendMessage(Message.INVALIDATE_CACHE_TASK, {
        oldValue: oldTaskValue,
        newValue: newTaskValue || undefined,
      });

      return task;
    },
    onSuccess: () => {
      toast.success("Task updated successfully!");
      queryClient.invalidateQueries({
        queryKey: ["storage", StorageKey.CURRENT_TASK],
      });
    },
    onError: (error) => {
      toast.error("Failed to update task");
      console.error("Error updating task:", {
        error: error instanceof Error ? error.message : String(error),
        task: inputValue,
        timestamp: new Date().toISOString(),
        context: "task update"
      });
    },
  });

  // Mutation for clearing task
  const clearTaskMutation = useMutation({
    mutationFn: async () => {
      const oldTaskValue = currentTask || undefined;
      await setTask(null);

      // Send cache invalidation message
      await sendMessage(Message.INVALIDATE_CACHE_TASK, {
        oldValue: oldTaskValue,
        newValue: undefined,
      });

      return null;
    },
    onSuccess: () => {
      setInputValue("");
      toast.success("Task cleared successfully!");
      queryClient.invalidateQueries({
        queryKey: ["storage", StorageKey.CURRENT_TASK],
      });
    },
    onError: (error) => {
      toast.error("Failed to clear task");
      console.error("Error clearing task:", {
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
        context: "task clearing"
      });
    },
  });

  const handleSetTask = () => {
    if (!inputValue.trim()) {
      toast.error("Please enter a task description");
      return;
    }
    setTaskMutation.mutate(inputValue);
  };

  const handleClearTask = () => {
    clearTaskMutation.mutate();
  };

  const isSaving = setTaskMutation.isPending || clearTaskMutation.isPending;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="task">Current Task</Label>
        <Textarea
          id="task"
          placeholder="Describe what you're working on (e.g., 'I am debugging a React component' or 'I am researching Q3 marketing strategies')"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          className="min-h-[100px] resize-none"
        />
        <p className="text-xs text-muted-foreground">
          Be specific about your current task to help the AI identify
          distractions.
        </p>
      </div>

      <div className="flex gap-2">
        <Button
          onClick={handleSetTask}
          disabled={isSaving || !inputValue.trim()}
          size="sm"
          className="flex-1"
        >
          {isSaving ? "Saving..." : "Set Task"}
        </Button>
        {currentTask && (
          <Button
            variant="outline"
            onClick={handleClearTask}
            disabled={isSaving}
            size="sm"
          >
            Clear
          </Button>
        )}
      </div>

      {currentTask && (
        <div className="rounded-md bg-green-50 p-3 dark:bg-green-900/20">
          <p className="text-xs text-green-800 dark:text-green-200">
            ✓ Current task: {currentTask}
          </p>
        </div>
      )}
    </div>
  );
};
