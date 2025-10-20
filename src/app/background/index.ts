import { StorageKey, getStorage } from "@/lib/storage";
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
} from "~/lib/messaging";
import { defineBackground } from "#imports";

const main = () => {
  console.log(
    "Background service worker is running! Edit `src/app/background` and save to reload.",
  );

  // Initialize storage with environment variables on extension install
  chrome.runtime.onInstalled.addListener(async (details) => {
    if (details.reason === "install") {
      console.log("Extension installed, initializing storage with environment variables");
      
      // Trigger storage initialization by accessing each storage item
      // This will invoke the init functions defined in storage.ts
      const geminiKeyStorage = getStorage(StorageKey.GEMINI_API_KEY);
      await geminiKeyStorage.getValue();
      
      const openaiKeyStorage = getStorage(StorageKey.OPENAI_API_KEY);
      await openaiKeyStorage.getValue();
      
      const aiProviderStorage = getStorage(StorageKey.AI_PROVIDER);
      await aiProviderStorage.getValue();
      
      const currentTaskStorage = getStorage(StorageKey.CURRENT_TASK);
      await currentTaskStorage.getValue();
      
      const extensionEnabledStorage = getStorage(StorageKey.EXTENSION_ENABLED);
      await extensionEnabledStorage.getValue();
      
      console.log("Storage initialization completed");
    }
  });

  // Listen for tab updates to trigger analysis
  chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    // Only run when page is completely loaded
    if (changeInfo.status !== "complete" || !tab.url || !tab.id) {
      return;
    }

    // Skip chrome:// pages and other special URLs
    if (
      tab.url.startsWith("chrome://") ||
      tab.url.startsWith("chrome-extension://")
    ) {
      return;
    }

    try {
      const extensionEnabledStorage = getStorage(StorageKey.EXTENSION_ENABLED);
      const isEnabled = await extensionEnabledStorage.getValue();

      if (!isEnabled) {
        return;
      }

      const providerStorage = getStorage(StorageKey.AI_PROVIDER);
      const provider = await providerStorage.getValue();

      const apiKeyStorage =
        provider === "openai"
          ? getStorage(StorageKey.OPENAI_API_KEY)
          : getStorage(StorageKey.GEMINI_API_KEY);
      const apiKey = await apiKeyStorage.getValue();

      if (!apiKey) {
        console.log(`No ${provider} API key configured`);
        return;
      }

      const taskStorage = getStorage(StorageKey.CURRENT_TASK);
      const currentTask = await taskStorage.getValue();

      if (!currentTask) {
        return;
      }

      // Get page content
      const results = await chrome.scripting.executeScript({
        target: { tabId },
        func: () => document.documentElement.outerHTML,
      });

      if (results[0]?.result) {
        const pageContent = extractMainContent(results[0].result);
        const analysisResult = await analyzePageContent(
          apiKey,
          currentTask,
          pageContent,
          tab.url,
          provider,
        );

        // Send result to content script
        await chrome.tabs.sendMessage(tabId, {
          type: Message.BLOCK_RESULT,
          data: analysisResult,
        });
      }
    } catch (error) {
      console.error("Error in tab analysis:", error);
    }
  });
};

// Handle page analysis requests
onMessage(Message.ANALYZE_PAGE, async (message) => {
  try {
    const { url, content } = message.data;
    const providerStorage = getStorage(StorageKey.AI_PROVIDER);
    const provider = await providerStorage.getValue();

    const apiKeyStorage =
      provider === "openai"
        ? getStorage(StorageKey.OPENAI_API_KEY)
        : getStorage(StorageKey.GEMINI_API_KEY);
    const apiKey = await apiKeyStorage.getValue();

    if (!apiKey) {
      throw new Error(`No ${provider} API key configured`);
    }

    const taskStorage = getStorage(StorageKey.CURRENT_TASK);
    const currentTask = await taskStorage.getValue();

    if (!currentTask) {
      throw new Error("No task configured");
    }

    const pageContent = extractMainContent(content);
    return await analyzePageContent(
      apiKey,
      currentTask,
      pageContent,
      url,
      provider,
    );
  } catch (error) {
    console.error("Analysis failed:", error);
    throw error;
  }
});

// Handle unblock requests
onMessage(Message.UNBLOCK_REQUEST, async (message) => {
  try {
    const request = message.data;
    const providerStorage = getStorage(StorageKey.AI_PROVIDER);
    const provider = await providerStorage.getValue();

    const apiKeyStorage =
      provider === "openai"
        ? getStorage(StorageKey.OPENAI_API_KEY)
        : getStorage(StorageKey.GEMINI_API_KEY);
    const apiKey = await apiKeyStorage.getValue();

    if (!apiKey) {
      throw new Error(`No ${provider} API key configured`);
    }

    const taskStorage = getStorage(StorageKey.CURRENT_TASK);
    const currentTask = await taskStorage.getValue();

    if (!currentTask) {
      throw new Error("No task configured");
    }

    return await processUnblockRequest(apiKey, currentTask, request, provider);
  } catch (error) {
    console.error("Unblock request failed:", error);
    throw error;
  }
});

// Handle chat messages
onMessage(Message.SEND_CHAT_MESSAGE, async (message) => {
  try {
    const { sessionId, message: userMessage } = message.data;
    const providerStorage = getStorage(StorageKey.AI_PROVIDER);
    const provider = await providerStorage.getValue();

    const apiKeyStorage =
      provider === "openai"
        ? getStorage(StorageKey.OPENAI_API_KEY)
        : getStorage(StorageKey.GEMINI_API_KEY);
    const apiKey = await apiKeyStorage.getValue();

    if (!apiKey) {
      throw new Error(`No ${provider} API key configured`);
    }

    const taskStorage = getStorage(StorageKey.CURRENT_TASK);
    const currentTask = await taskStorage.getValue();

    if (!currentTask) {
      throw new Error("No task configured");
    }

    // Get chat history from storage
    const chatSessionsStorage = getStorage(StorageKey.CHAT_SESSIONS);
    const chatSessions = (await chatSessionsStorage.getValue()) as Record<
      string,
      ChatSession
    >;
    const chatHistory: ChatMessage[] = chatSessions[sessionId]?.messages || [];

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

export default defineBackground(main);
