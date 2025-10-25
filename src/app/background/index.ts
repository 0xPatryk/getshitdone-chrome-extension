import { onMessage, Message } from "~/lib/messaging";
import { AnalysisResultSchema } from "~/lib/messaging";
import { getStorageValue } from "~/lib/storage";
import { StorageKey } from "~/lib/storage";
import { analyzePageContent, processUnblockRequest, processChatMessage } from "~/lib/ai-service";
import type { ChatMessage } from "~/lib/messaging";
import { defineBackground } from "#imports";

// Set up message handlers
onMessage(Message.ANALYZE_PAGE, async (message) => {
  console.log("Background received ANALYZE_PAGE message:", message);
  const data = message.data;
  
  try {
    // Get the AI provider, API key, and current task from storage
    const [aiProvider, geminiApiKey, openaiApiKey, currentTask] = await Promise.all([
      getStorageValue(StorageKey.AI_PROVIDER),
      getStorageValue(StorageKey.GEMINI_API_KEY),
      getStorageValue(StorageKey.OPENAI_API_KEY),
      getStorageValue(StorageKey.CURRENT_TASK),
    ]);

    console.log("AI Provider:", aiProvider);
    console.log("Gemini API Key available:", !!geminiApiKey);
    console.log("OpenAI API Key available:", !!openaiApiKey);
    console.log("Current Task:", currentTask);

    // Check if we have the necessary API key
    const apiKey = aiProvider === "openai" ? openaiApiKey : geminiApiKey;
    if (!apiKey) {
      console.error("No API key available for AI provider:", aiProvider);
      return {
        decision: "ALLOW",
        reason: `No API key configured for ${aiProvider}. Please configure your API key in the extension settings.`,
      };
    }

    // Check if we have a current task
    if (!currentTask) {
      console.warn("No current task set, allowing page by default");
      return {
        decision: "ALLOW",
        reason: "No current task set. Please set a task in the extension to enable content analysis.",
      };
    }

    // Analyze the page content using the AI service
    console.log("Analyzing page content...");
    const analysisResult = await analyzePageContent(
      apiKey,
      currentTask,
      data.content,
      data.url,
      aiProvider,
      data.alwaysRemove
    );

    console.log("Analysis result:", analysisResult);

    // Validate and return the result
    const validatedResult = AnalysisResultSchema.parse(analysisResult);
    return validatedResult;
  } catch (error) {
    console.error("Error analyzing page:", error);
    return {
      decision: "ALLOW",
      reason: `Error analyzing page: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
});

onMessage(Message.UNBLOCK_REQUEST, async (message) => {
  console.log("Background received UNBLOCK_REQUEST message:", message);
  const data = message.data;
  
  try {
    // Get the AI provider, API key, and current task from storage
    const [aiProvider, geminiApiKey, openaiApiKey, currentTask] = await Promise.all([
      getStorageValue(StorageKey.AI_PROVIDER),
      getStorageValue(StorageKey.GEMINI_API_KEY),
      getStorageValue(StorageKey.OPENAI_API_KEY),
      getStorageValue(StorageKey.CURRENT_TASK),
    ]);

    // Check if we have the necessary API key
    const apiKey = aiProvider === "openai" ? openaiApiKey : geminiApiKey;
    if (!apiKey) {
      console.error("No API key available for AI provider:", aiProvider);
      return {
        decision: "DENY",
        reason: `No API key configured for ${aiProvider}. Please configure your API key in the extension settings.`,
      };
    }

    // Process the unblock request using the AI service
    const response = await processUnblockRequest(
      apiKey,
      currentTask || "No task set",
      {
        justification: data.justification,
        originalReason: data.originalReason,
        taskId: data.taskId,
      },
      aiProvider
    );

    console.log("Unblock response:", response);
    return response;
  } catch (error) {
    console.error("Error processing unblock request:", error);
    return {
      decision: "DENY",
      reason: `Error processing unblock request: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
});

onMessage(Message.SEND_CHAT_MESSAGE, async (message) => {
  console.log("Background received SEND_CHAT_MESSAGE message:", message);
  const data = message.data;
  
  try {
    // Get the AI provider, API key, and current task from storage
    const [aiProvider, geminiApiKey, openaiApiKey, currentTask] = await Promise.all([
      getStorageValue(StorageKey.AI_PROVIDER),
      getStorageValue(StorageKey.GEMINI_API_KEY),
      getStorageValue(StorageKey.OPENAI_API_KEY),
      getStorageValue(StorageKey.CURRENT_TASK),
    ]);

    // Check if we have the necessary API key
    const apiKey = aiProvider === "openai" ? openaiApiKey : geminiApiKey;
    if (!apiKey) {
      console.error("No API key available for AI provider:", aiProvider);
      throw new Error(`No API key configured for ${aiProvider}. Please configure your API key in the extension settings.`);
    }

    // Get chat history for context (this would need to be implemented)
    const chatHistory: ChatMessage[] = []; // Placeholder - would need to fetch from storage

    // Process the chat message using the AI service
    const response = await processChatMessage(
      apiKey,
      currentTask || "No task set",
      data.message,
      chatHistory,
      aiProvider
    );

    console.log("Chat response:", response);
    return {
      sessionId: data.sessionId,
      message: response,
    };
  } catch (error) {
    console.error("Error processing chat message:", error);
    throw error;
  }
});

// Initialize the background script
console.log("Background script initialized");

export default defineBackground(() => {
  console.log("Background script entry point");
});