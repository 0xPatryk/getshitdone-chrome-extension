/**
 * Status display component for showing extension state information.
 * This component displays the current status of the extension including
 * API key configuration, extension enabled state, and task status.
 */

import { Badge } from "@/components/ui/badge";
import { StorageKey, useStorage } from "@/lib/storage";

/**
 * Status display component for showing extension operational state.
 * Displays a badge indicating the current status based on API key availability,
 * extension enabled state, and whether a task is set. Status colors and text
 * change based on the current configuration state.
 *
 * @example
 * ```tsx
 * <StatusDisplay />
 * ```
 *
 * @returns A React element containing the status display interface
 */
export const StatusDisplay = () => {
  const { data: isEnabled } = useStorage(StorageKey.EXTENSION_ENABLED);
  const { data: currentTask } = useStorage(StorageKey.CURRENT_TASK);
  const { data: geminiApiKey } = useStorage(StorageKey.GEMINI_API_KEY);
  const { data: openaiApiKey } = useStorage(StorageKey.OPENAI_API_KEY);
  const { data: aiProvider } = useStorage(StorageKey.AI_PROVIDER);

  const hasApiKey = aiProvider === "openai" ? openaiApiKey : geminiApiKey;

  const getStatusColor = () => {
    if (!hasApiKey) return "destructive";
    if (!isEnabled) return "secondary";
    if (!currentTask) return "outline";
    return "default";
  };

  const getStatusText = () => {
    if (!hasApiKey) return "No API Key";
    if (!isEnabled) return "Disabled";
    if (!currentTask) return "No Task Set";
    return "Active";
  };

  return (
    <div className="flex items-center justify-between">
      <span className="text-sm font-medium">Status:</span>
      <Badge variant={getStatusColor()}>{getStatusText()}</Badge>
    </div>
  );
};
