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
import { ApiKeySettings } from "~/components/options/api-key-settings";
import { AlwaysRemoveInput } from "~/components/popup/always-remove-input";
import { TaskInput } from "~/components/popup/task-input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Label } from "~/components/ui/label";
import { Separator } from "~/components/ui/separator";
import { Switch } from "~/components/ui/switch";
import { useStorage } from "~/lib/storage/services";
import { StorageKey } from "~/lib/storage/types";

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

      {/* AI provider and API keys configuration */}
      <Card>
        <CardHeader>
          <CardTitle>AI Configuration</CardTitle>
          <CardDescription>
            Manage your AI provider and API credentials
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ApiKeySettings hideHeader />
        </CardContent>
      </Card>

      {/* Focus task configuration section */}
      <Card>
        <CardHeader>
          <CardTitle>Focus Task</CardTitle>
          <CardDescription>Define what you want to focus on</CardDescription>
        </CardHeader>
        <CardContent>
          <TaskInput />
        </CardContent>
      </Card>

      {/* Always remove configuration section */}
      <Card>
        <CardHeader>
          <CardTitle>Always Remove</CardTitle>
          <CardDescription>
            Manage elements that are always removed
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AlwaysRemoveInput />
        </CardContent>
      </Card>
    </div>
  );
};
