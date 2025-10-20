import { Settings } from "lucide-react";
import { Layout } from "~/components/layout/layout";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Separator } from "~/components/ui/separator";
import { Switch } from "~/components/ui/switch";
import { Textarea } from "~/components/ui/textarea";
import { useStorage } from "~/lib/storage";
import { StorageKey } from "~/lib/storage";
import { useState } from "react";

export const SettingsTab = () => {
  const { data: geminiApiKey, set: setGeminiApiKey } = useStorage(StorageKey.GEMINI_API_KEY);
  const { data: openaiApiKey, set: setOpenaiApiKey } = useStorage(StorageKey.OPENAI_API_KEY);
  const { data: aiProvider, set: setAiProvider } = useStorage(StorageKey.AI_PROVIDER);
  const { data: currentTask, set: setCurrentTask } = useStorage(StorageKey.CURRENT_TASK);
  const { data: extensionEnabled, set: setExtensionEnabled } = useStorage(StorageKey.EXTENSION_ENABLED);
  
  const [tempGeminiKey, setTempGeminiKey] = useState(geminiApiKey || "");
  const [tempOpenaiKey, setTempOpenaiKey] = useState(openaiApiKey || "");
  const [tempTask, setTempTask] = useState(currentTask || "");

  const handleSaveApiKeys = () => {
    setGeminiApiKey(tempGeminiKey);
    setOpenaiApiKey(tempOpenaiKey);
  };

  const handleSaveTask = () => {
    setCurrentTask(tempTask);
  };

  return (
    <Layout>
      <div className="w-full max-w-4xl mx-auto space-y-8">
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
              <CardDescription>
                Choose your preferred AI provider
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="ai-provider">Use OpenAI</Label>
                <Switch
                  id="ai-provider"
                  checked={aiProvider === "openai"}
                  onCheckedChange={(checked) => setAiProvider(checked ? "openai" : "gemini")}
                />
              </div>
              <p className="text-sm text-muted-foreground">
                Current provider: <span className="font-medium">{aiProvider === "openai" ? "OpenAI" : "Google Gemini"}</span>
              </p>
            </CardContent>
          </Card>
        </div>

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
                value={tempGeminiKey}
                onChange={(e) => setTempGeminiKey(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="openai-key">OpenAI API Key</Label>
              <Input
                id="openai-key"
                type="password"
                placeholder="Enter your OpenAI API key"
                value={tempOpenaiKey}
                onChange={(e) => setTempOpenaiKey(e.target.value)}
              />
            </div>
            <Button onClick={handleSaveApiKeys}>Save API Keys</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Focus Task</CardTitle>
            <CardDescription>
              Define what you want to focus on
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current-task">Current Task</Label>
              <Textarea
                id="current-task"
                placeholder="Describe what you're working on..."
                value={tempTask}
                onChange={(e) => setTempTask(e.target.value)}
                rows={3}
              />
            </div>
            <Button onClick={handleSaveTask}>Save Task</Button>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};