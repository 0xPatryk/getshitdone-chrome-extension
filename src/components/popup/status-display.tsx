import { Badge } from "@/components/ui/badge";
import { StorageKey, useStorage } from "@/lib/storage";

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
