/**
 * Settings Tab Component
 *
 * This component renders the comprehensive settings interface for the extension.
 * It provides controls for:
 * - Extension enable/disable toggle
 * - AI provider selection (OpenAI vs Google Gemini)
 * - API key configuration for both providers
 * - Current focus task management
 *
 * The component uses the useStorage hook to persist settings and provides
 * a responsive layout with organized sections for different configuration areas.
 */

import { Settings } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Separator } from "~/components/ui/separator";
import { Switch } from "~/components/ui/switch";
import { Textarea } from "~/components/ui/textarea";
import { useStorage } from "~/lib/storage";
import { StorageKey } from "~/lib/storage";

/**
 * Settings Tab Component
 *
 * Renders the main settings interface with organized sections for
 * extension configuration. Uses responsive grid layout for
 * optimal display on different screen sizes.
 *
 * @returns The settings tab UI with all configuration options
 */
export const SettingsTab = () => {
  // Storage hooks for all settings values
  const { data: geminiApiKey, set: setGeminiApiKey } = useStorage(
    StorageKey.GEMINI_API_KEY,
  );
  const { data: openaiApiKey, set: setOpenaiApiKey } = useStorage(
    StorageKey.OPENAI_API_KEY,
  );
  const { data: aiProvider, set: setAiProvider } = useStorage(
    StorageKey.AI_PROVIDER,
  );
  const { data: currentTask, set: setCurrentTask } = useStorage(
    StorageKey.CURRENT_TASK,
  );
  const { data: extensionEnabled, set: setExtensionEnabled } = useStorage(
    StorageKey.EXTENSION_ENABLED,
  );

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8">
      {/* Header section with title and description */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Settings className="size-6" />
          <h1 className="text-2xl font-bold">Settings</h1>
        </div>
        <p className="text-muted-foreground">
          Configure your extension preferences and API settings
        </p>
      </div>

      <Separator />

      {/* Extension status and AI provider settings in a 2-column grid */}
      <div className="grid gap-8 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Extension Status</CardTitle>
            <CardDescription>
              Enable or disable the focus mode extension
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="extension-enabled">Focus Mode</Label>
              <Switch
                id="extension-enabled"
                checked={extensionEnabled}
                onCheckedChange={setExtensionEnabled}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>AI Provider</CardTitle>
            <CardDescription>Choose your preferred AI provider</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="ai-provider">Use OpenAI</Label>
              <Switch
                id="ai-provider"
                checked={aiProvider === "openai"}
                onCheckedChange={(checked) =>
                  setAiProvider(checked ? "openai" : "gemini")
                }
              />
            </div>
            <p className="text-sm text-muted-foreground">
              Current provider:{" "}
              <span className="font-medium">
                {aiProvider === "openai" ? "OpenAI" : "Google Gemini"}
              </span>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* API keys configuration section */}
      <Card>
        <CardHeader>
          <CardTitle>API Keys</CardTitle>
          <CardDescription>
            Configure your API keys for AI services
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="gemini-key">Google Gemini API Key</Label>
            <Input
              id="gemini-key"
              type="password"
              placeholder="Enter your Gemini API key"
              value={geminiApiKey || ""}
              onChange={(e) => setGeminiApiKey(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="openai-key">OpenAI API Key</Label>
            <Input
              id="openai-key"
              type="password"
              placeholder="Enter your OpenAI API key"
              value={openaiApiKey || ""}
              onChange={(e) => setOpenaiApiKey(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Focus task configuration section */}
      <Card>
        <CardHeader>
          <CardTitle>Focus Task</CardTitle>
          <CardDescription>Define what you want to focus on</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="current-task">Current Task</Label>
            <Textarea
              id="current-task"
              placeholder="Describe what you're working on..."
              value={currentTask || ""}
              onChange={(e) => setCurrentTask(e.target.value)}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
