/**
 * Always remove input component for configuring persistent element removal.
 * This component allows users to define elements that should always be removed
 * from web pages, regardless of the current task or context.
 */

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Message, sendMessage } from "@/lib/messaging";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useStorage } from "~/lib/storage/services";
import { StorageKey } from "~/lib/storage/types";

/**
 * Always remove input component for managing persistent element removal.
 * Provides a textarea for users to describe elements that should always be
 * removed from web pages, with save/clear functionality and cache invalidation.
 * Elements defined here are removed regardless of the current task context.
 *
 * @example
 * ```tsx
 * <AlwaysRemoveInput />
 * ```
 *
 * @returns A React element containing the always remove input interface
 */
export const AlwaysRemoveInput = () => {
  const { data: alwaysRemove, set: setAlwaysRemove } = useStorage(
    StorageKey.ALWAYS_REMOVE,
  );
  const [inputValue, setInputValue] = useState(alwaysRemove || "");

  // Update input value when storage data loads
  useEffect(() => {
    if (alwaysRemove !== null && alwaysRemove !== undefined) {
      setInputValue(alwaysRemove);
    }
  }, [alwaysRemove]);
  const queryClient = useQueryClient();

  // Mutation for setting/updating always remove list
  const setAlwaysRemoveMutation = useMutation({
    mutationFn: async (items: string) => {
      await setAlwaysRemove(items.trim());

      // Send cache invalidation message
      await sendMessage(Message.INVALIDATE_CACHE_ALWAYS_REMOVE, {});

      return items;
    },
    onSuccess: () => {
      toast.success("Always remove list updated successfully!");
      queryClient.invalidateQueries({
        queryKey: ["storage", StorageKey.ALWAYS_REMOVE],
      });
    },
    onError: (error) => {
      toast.error("Failed to update always remove list");
      console.error("Error updating always remove list:", {
        error: error instanceof Error ? error.message : String(error),
        input: inputValue,
        timestamp: new Date().toISOString(),
        context: "always remove list update",
      });
    },
  });

  // Mutation for clearing always remove list
  const clearAlwaysRemoveMutation = useMutation({
    mutationFn: async () => {
      await setAlwaysRemove(null);

      // Send cache invalidation message
      await sendMessage(Message.INVALIDATE_CACHE_ALWAYS_REMOVE, {});

      return null;
    },
    onSuccess: () => {
      setInputValue("");
      toast.success("Always remove list cleared successfully!");
      queryClient.invalidateQueries({
        queryKey: ["storage", StorageKey.ALWAYS_REMOVE],
      });
    },
    onError: (error) => {
      toast.error("Failed to clear always remove list");
      console.error("Error clearing always remove list:", {
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
        context: "always remove list clearing",
      });
    },
  });

  const handleSetAlwaysRemove = () => {
    if (!inputValue.trim()) {
      toast.error("Please enter elements to always remove");
      return;
    }
    setAlwaysRemoveMutation.mutate(inputValue);
  };

  const handleClearAlwaysRemove = () => {
    clearAlwaysRemoveMutation.mutate();
  };

  const isSaving =
    setAlwaysRemoveMutation.isPending || clearAlwaysRemoveMutation.isPending;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="always-remove">Always Remove Elements</Label>
        <Textarea
          id="always-remove"
          placeholder="Describe elements to always remove in natural language (e.g., 'Remove all sidebar navigation menus', 'Hide social media share buttons', 'Remove newsletter signup forms')"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          className="min-h-[100px] resize-none"
        />
        <p className="text-xs text-muted-foreground">
          These elements will be automatically removed from all pages,
          regardless of your current task.
        </p>
      </div>

      <div className="flex gap-2">
        <Button
          onClick={handleSetAlwaysRemove}
          disabled={isSaving || !inputValue.trim()}
          size="sm"
          className="flex-1"
        >
          {isSaving ? "Saving..." : "Save Element"}
        </Button>
        {alwaysRemove && (
          <Button
            variant="outline"
            onClick={handleClearAlwaysRemove}
            disabled={isSaving}
            size="sm"
          >
            Clear
          </Button>
        )}
      </div>

      {alwaysRemove && (
        <div className="rounded-md bg-blue-50 p-3 dark:bg-blue-900/20">
          <p className="text-xs text-blue-800 dark:text-blue-200 font-medium mb-1">
            ✓ Always remove element active:
          </p>
          <p className="text-xs text-blue-700 dark:text-blue-300 italic">
            {alwaysRemove}
          </p>
        </div>
      )}
    </div>
  );
};
