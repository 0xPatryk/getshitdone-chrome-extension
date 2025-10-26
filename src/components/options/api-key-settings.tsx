/**
 * API key settings component for configuring AI provider credentials.
 * This component provides UI for managing API keys for different AI providers
 * (OpenAI and Gemini), including validation, storage, and provider switching.
 */

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { useStorage } from "~/lib/storage/services";
import { StorageKey } from "~/lib/storage/types";

/**
 * API key settings component for managing AI provider credentials.
 * Allows users to select between OpenAI and Gemini providers, configure
 * API keys with validation, and provides instructions for obtaining keys.
 * Handles secure storage of API keys and provides feedback on save/clear operations.
 *
 * @example
 * ```tsx
 * <ApiKeySettings />
 * ```
 *
 * @returns A React element containing the API key settings interface
 */
export const ApiKeySettings = () => {
  const { data: selectedProvider, set: setProvider } = useStorage(
    StorageKey.AI_PROVIDER,
  );
  const { data: geminiApiKey, set: setGeminiApiKey } = useStorage(
    StorageKey.GEMINI_API_KEY,
  );
  const { data: openaiApiKey, set: setOpenaiApiKey } = useStorage(
    StorageKey.OPENAI_API_KEY,
  );

  const [inputValue, setInputValue] = useState(
    selectedProvider === "openai" ? openaiApiKey || "" : geminiApiKey || "",
  );
  const queryClient = useQueryClient();

  // Update input value when provider changes
  const handleProviderChange = (provider: string) => {
    if (provider === "gemini" || provider === "openai") {
      setProvider(provider);
      const currentKey = provider === "openai" ? openaiApiKey : geminiApiKey;
      setInputValue(currentKey || "");
    }
  };

  // Mutation for saving API key
  const saveApiKeyMutation = useMutation({
    mutationFn: async (key: string) => {
      if (selectedProvider === "openai") {
        await setOpenaiApiKey(key.trim());
      } else {
        await setGeminiApiKey(key.trim());
      }
      return key;
    },
    onSuccess: () => {
      toast.success("API key saved successfully!");
      queryClient.invalidateQueries({
        queryKey: [
          "storage",
          selectedProvider === "openai"
            ? StorageKey.OPENAI_API_KEY
            : StorageKey.GEMINI_API_KEY,
        ],
      });
    },
    onError: (error) => {
      toast.error("Failed to save API key");
      console.error("Error saving API key:", error);
    },
  });

  // Mutation for clearing API key
  const clearApiKeyMutation = useMutation({
    mutationFn: async () => {
      if (selectedProvider === "openai") {
        await setOpenaiApiKey(null);
      } else {
        await setGeminiApiKey(null);
      }
      return null;
    },
    onSuccess: () => {
      setInputValue("");
      toast.success("API key cleared successfully!");
      queryClient.invalidateQueries({
        queryKey: [
          "storage",
          selectedProvider === "openai"
            ? StorageKey.OPENAI_API_KEY
            : StorageKey.GEMINI_API_KEY,
        ],
      });
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

    // Basic validation for API keys
    if (selectedProvider === "openai" && !inputValue.startsWith("sk-")) {
      toast.error("Invalid OpenAI API key format");
      return;
    }

    if (selectedProvider === "gemini" && inputValue.length < 20) {
      toast.error("Invalid Gemini API key format");
      return;
    }

    saveApiKeyMutation.mutate(inputValue);
  };

  const handleClear = () => {
    clearApiKeyMutation.mutate();
  };

  const isSaving =
    saveApiKeyMutation.isPending || clearApiKeyMutation.isPending;

  const currentApiKey =
    selectedProvider === "openai" ? openaiApiKey : geminiApiKey;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">AI Provider Settings</h2>
        <p className="text-muted-foreground">
          Configure your AI provider and API key to enable AI-powered content
          analysis.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="provider">AI Provider</Label>
          <select
            id="provider"
            value={selectedProvider}
            onChange={(e) => handleProviderChange(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md bg-white dark:bg-gray-800 dark:border-gray-600"
          >
            <option value="gemini">Gemini (Google)</option>
            <option value="openai">OpenAI</option>
          </select>
          <p className="text-sm text-muted-foreground">
            Select your preferred AI provider for content analysis.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="api-key">
            {selectedProvider === "openai" ? "OpenAI" : "Gemini"} API Key
          </Label>
          <Input
            id="api-key"
            type="password"
            placeholder={`Enter your ${selectedProvider === "openai" ? "OpenAI" : "Gemini"} API key`}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="font-mono"
          />
          <p className="text-sm text-muted-foreground">
            Your API key is stored securely locally and never shared with third
            parties.
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={handleSave}
            disabled={isSaving || !inputValue.trim()}
          >
            {isSaving ? "Saving..." : "Save API Key"}
          </Button>
          {currentApiKey && (
            <Button variant="outline" onClick={handleClear} disabled={isSaving}>
              Clear Key
            </Button>
          )}
        </div>

        {currentApiKey && (
          <div className="rounded-md bg-green-50 p-4 dark:bg-green-900/20">
            <p className="text-sm text-green-800 dark:text-green-200">
              ✓ {selectedProvider === "openai" ? "OpenAI" : "Gemini"} API key is
              configured and ready to use
            </p>
          </div>
        )}

        <div className="rounded-md bg-blue-50 p-4 dark:bg-blue-900/20">
          <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
            How to get your API key:
          </h3>
          {selectedProvider === "gemini" ? (
            <ol className="text-sm text-blue-700 dark:text-blue-300 space-y-1 list-decimal list-inside">
              <li>Go to Google AI Studio</li>
              <li>Sign in with your Google account</li>
              <li>Create a new API key or use an existing one</li>
              <li>Copy the key and paste it above</li>
            </ol>
          ) : (
            <ol className="text-sm text-blue-700 dark:text-blue-300 space-y-1 list-decimal list-inside">
              <li>Go to OpenAI Platform</li>
              <li>Sign in with your OpenAI account</li>
              <li>Navigate to API Keys section</li>
              <li>Create a new API key and copy it</li>
            </ol>
          )}
        </div>
      </div>
    </div>
  );
};
