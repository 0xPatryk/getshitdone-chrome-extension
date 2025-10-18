import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StorageKey, useStorage } from "@/lib/storage";
import { toast } from "sonner";

export const ApiKeySettings = () => {
  const { data: apiKey, set: setApiKey } = useStorage(StorageKey.GEMINI_API_KEY);
  const [inputValue, setInputValue] = useState(apiKey || "");
  const queryClient = useQueryClient();

  // Mutation for saving API key
  const saveApiKeyMutation = useMutation({
    mutationFn: async (key: string) => {
      await setApiKey(key.trim());
      return key;
    },
    onSuccess: () => {
      toast.success("API key saved successfully!");
      queryClient.invalidateQueries({ queryKey: ["storage", StorageKey.GEMINI_API_KEY] });
    },
    onError: (error) => {
      toast.error("Failed to save API key");
      console.error("Error saving API key:", error);
    },
  });

  // Mutation for clearing API key
  const clearApiKeyMutation = useMutation({
    mutationFn: async () => {
      await setApiKey(null);
      return null;
    },
    onSuccess: () => {
      setInputValue("");
      toast.success("API key cleared successfully!");
      queryClient.invalidateQueries({ queryKey: ["storage", StorageKey.GEMINI_API_KEY] });
    },
    onError: (error) => {
      toast.error("Failed to clear API key");
      console.error("Error clearing API key:", error);
    },
  });

  const handleSave = () => {
    if (!inputValue.trim()) {
      toast.error("Please enter a valid API key");
      return;
    }
    saveApiKeyMutation.mutate(inputValue);
  };

  const handleClear = () => {
    clearApiKeyMutation.mutate();
  };

  const isSaving = saveApiKeyMutation.isPending || clearApiKeyMutation.isPending;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Gemini API Settings</h2>
        <p className="text-muted-foreground">
          Configure your Gemini API key to enable AI-powered content analysis.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="api-key">Gemini API Key</Label>
          <Input
            id="api-key"
            type="password"
            placeholder="Enter your Gemini API key"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="font-mono"
          />
          <p className="text-sm text-muted-foreground">
            Your API key is stored securely locally and never shared with third parties.
          </p>
        </div>

        <div className="flex gap-2">
          <Button onClick={handleSave} disabled={isSaving || !inputValue.trim()}>
            {isSaving ? "Saving..." : "Save API Key"}
          </Button>
          {apiKey && (
            <Button
              variant="outline"
              onClick={handleClear}
              disabled={isSaving}
            >
              Clear Key
            </Button>
          )}
        </div>

        {apiKey && (
          <div className="rounded-md bg-green-50 p-4 dark:bg-green-900/20">
            <p className="text-sm text-green-800 dark:text-green-200">
              ✓ API key is configured and ready to use
            </p>
          </div>
        )}

        <div className="rounded-md bg-blue-50 p-4 dark:bg-blue-900/20">
          <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
            How to get your API key:
          </h3>
          <ol className="text-sm text-blue-700 dark:text-blue-300 space-y-1 list-decimal list-inside">
            <li>Go to Google AI Studio</li>
            <li>Sign in with your Google account</li>
            <li>Create a new API key or use an existing one</li>
            <li>Copy the key and paste it above</li>
          </ol>
        </div>
      </div>
    </div>
  );
};