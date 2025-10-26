/**
 * Extension toggle component for enabling/disabling focus mode.
 * This component provides a switch to control whether the extension's
 * content analysis and blocking functionality is active.
 */

import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useStorage } from "~/lib/storage/services";
import { StorageKey } from "~/lib/storage/types";

/**
 * Extension toggle component for controlling focus mode activation.
 * Displays a toggle switch that enables or disables the extension's
 * content analysis and blocking functionality. Shows descriptive text
 * about current state and handles state persistence.
 *
 * @example
 * ```tsx
 * <ExtensionToggle />
 * ```
 *
 * @returns A React element containing the extension toggle interface
 */
export const ExtensionToggle = () => {
  const { data: isEnabled, set: setEnabled } = useStorage(
    StorageKey.EXTENSION_ENABLED,
  );
  const queryClient = useQueryClient();

  // Mutation for toggling extension state
  const toggleMutation = useMutation({
    mutationFn: async (enabled: boolean) => {
      await setEnabled(enabled);
      return enabled;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["storage", StorageKey.EXTENSION_ENABLED],
      });
    },
    onError: (error) => {
      console.error("Error toggling extension:", {
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
        context: "extension toggle",
      });
    },
  });

  const handleToggle = (enabled: boolean) => {
    toggleMutation.mutate(enabled);
  };

  return (
    <div className="flex items-center justify-between">
      <div className="space-y-0.5">
        <Label htmlFor="extension-toggle" className="text-base font-medium">
          Enable Focus Mode
        </Label>
        <p className="text-xs text-muted-foreground">
          {isEnabled
            ? "AI analysis is active and will block distractions"
            : "Extension is paused - no content analysis"}
        </p>
      </div>
      <Switch
        id="extension-toggle"
        checked={isEnabled}
        onCheckedChange={handleToggle}
        disabled={toggleMutation.isPending}
      />
    </div>
  );
};
