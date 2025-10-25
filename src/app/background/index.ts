import { StorageKey, getStorageValue } from "@/lib/storage";
import { browser } from "wxt/browser";
import {
  analyzePageContent,
  extractMainContent,
  processChatMessage,
  processUnblockRequest,
} from "~/lib/ai-service";
import {
  type ChatMessage,
  type ChatSession,
  Message,
  onMessage,
  sendMessage,
} from "~/lib/messaging";
import { defineBackground } from "#imports";

const main = () => {
  console.log(
    "Background service worker is running! Edit `src/app/background` and save to reload.",
  );

  // Initialize storage with environment variables on extension install
  browser.runtime.onInstalled.addListener(async (details) => {
    if (details.reason === "install") {
      console.log(
        "Extension installed, initializing storage with environment variables",
      );

      // Trigger storage initialization by accessing each storage item
      // This will invoke the init functions defined in storage.ts
      await getStorageValue(StorageKey.GEMINI_API_KEY);
      await getStorageValue(StorageKey.OPENAI_API_KEY);
      await getStorageValue(StorageKey.AI_PROVIDER);
      await getStorageValue(StorageKey.CURRENT_TASK);
      await getStorageValue(StorageKey.EXTENSION_ENABLED);

      console.log("Storage initialization completed");
    }
  });

  // Handle page analysis requests
  onMessage(Message.ANALYZE_PAGE, async (message) => {
    console.log("Background: Received ANALYZE_PAGE message:", message);
    try {
      const { url, content, alwaysRemove } = message.data;
      const provider = await getStorageValue(StorageKey.AI_PROVIDER);

      const apiKey = await getStorageValue(
        provider === "openai"
          ? StorageKey.OPENAI_API_KEY
          : StorageKey.GEMINI_API_KEY,
      );

      if (!apiKey) {
        throw new Error(`No ${provider} API key configured`);
      }

      const currentTask = await getStorageValue(StorageKey.CURRENT_TASK);

      if (!currentTask) {
        throw new Error("No task configured");
      }

      const pageContent = extractMainContent(content);
      const analysisResult = await analyzePageContent(
        apiKey,
        currentTask,
        pageContent,
        url,
        provider,
        alwaysRemove,
      );

      // Send result to content script
      const tabs = await browser.tabs.query({
        active: true,
        currentWindow: true,
      });
      if (tabs[0]?.id) {
        await sendMessage(Message.BLOCK_RESULT, analysisResult, {
          tabId: tabs[0].id,
        });
      }

      return analysisResult;
    } catch (error) {
      console.error("Analysis failed:", error);
      throw error;
    }
  });

  // Handle unblock requests
  onMessage(Message.UNBLOCK_REQUEST, async (message) => {
    try {
      const request = message.data;
      const provider = await getStorageValue(StorageKey.AI_PROVIDER);

      const apiKey = await getStorageValue(
        provider === "openai"
          ? StorageKey.OPENAI_API_KEY
          : StorageKey.GEMINI_API_KEY,
      );

      if (!apiKey) {
        throw new Error(`No ${provider} API key configured`);
      }

      const currentTask = await getStorageValue(StorageKey.CURRENT_TASK);

      if (!currentTask) {
        throw new Error("No task configured");
      }

      return await processUnblockRequest(
        apiKey,
        currentTask,
        request,
        provider,
      );
    } catch (error) {
      console.error("Unblock request failed:", error);
      throw error;
    }
  });

  // Handle chat messages
  onMessage(Message.SEND_CHAT_MESSAGE, async (message) => {
    try {
      const { sessionId, message: userMessage } = message.data;
      const provider = await getStorageValue(StorageKey.AI_PROVIDER);

      const apiKey = await getStorageValue(
        provider === "openai"
          ? StorageKey.OPENAI_API_KEY
          : StorageKey.GEMINI_API_KEY,
      );

      if (!apiKey) {
        throw new Error(`No ${provider} API key configured`);
      }

      const currentTask = await getStorageValue(StorageKey.CURRENT_TASK);

      if (!currentTask) {
        throw new Error("No task configured");
      }

      // Get chat history from storage
      const chatSessions = (await getStorageValue(
        StorageKey.CHAT_SESSIONS,
      )) as Record<string, ChatSession>;
      const chatHistory: ChatMessage[] =
        chatSessions[sessionId]?.messages || [];

      const aiResponse = await processChatMessage(
        apiKey,
        currentTask,
        userMessage,
        chatHistory,
        provider,
      );

      return {
        sessionId,
        message: aiResponse,
      };
    } catch (error) {
      console.error("Chat message processing failed:", error);
      throw error;
    }
  });
};

export default defineBackground(main);
