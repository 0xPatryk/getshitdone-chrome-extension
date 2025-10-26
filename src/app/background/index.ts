import { analyzePageContent, processChatMessage } from "~/lib/ai-service";
import { getCachedDecision, setCachedDecision } from "~/lib/cache";
import { Message, onMessage } from "~/lib/messaging";
import { type AnalysisResult, AnalysisResultSchema } from "~/lib/messaging";
import type { ChatMessage, ChatSession } from "~/lib/messaging";
import {
  cleanupExpiredCacheEntries,
  getStorage,
  getStorageValue,
  invalidateCacheForAlwaysRemoveChange,
  invalidateCacheForTaskChange,
  setAccessGrant,
} from "~/lib/storage";
import { StorageKey } from "~/lib/storage";
import { defineBackground } from "#imports";

// Set up message handlers
onMessage(Message.ANALYZE_PAGE, async (message) => {
  const data = message.data;

  try {
    // Get the AI provider, API key, and current task from storage
    const [aiProvider, geminiApiKey, openaiApiKey, currentTask] =
      await Promise.all([
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
        decision: "ALLOW",
        reason: `No API key configured for ${aiProvider}. Please configure your API key in the extension settings.`,
      };
    }

    // Check if we have a current task
    if (!currentTask) {
      return {
        decision: "ALLOW",
        reason:
          "No current task set. Please set a task in the extension to enable content analysis.",
      };
    }

    // Check cache first
    const cachedResult = await getCachedDecision(
      data.url,
      currentTask || "",
      data.alwaysRemove || null,
    );

    if (cachedResult) {
      return cachedResult;
    }

    // Analyze the page content using the AI service
    const analysisResult = await analyzePageContent(
      apiKey,
      currentTask,
      data.content,
      data.url,
      aiProvider,
      data.alwaysRemove,
    );

    // Cache the result
    await setCachedDecision(
      data.url,
      currentTask || "",
      data.alwaysRemove || null,
      analysisResult,
      "ai_decision",
      aiProvider,
      false,
    );

    // Validate and return the result
    const validatedResult = AnalysisResultSchema.parse(analysisResult);
    return validatedResult;
  } catch (error) {
    console.error("Error analyzing page:", error);
    throw error;
  }
});

onMessage(Message.SEND_CHAT_MESSAGE, async (message) => {
  const data = message.data;

  try {
    // Get the AI provider, API key, and current task from storage
    const [aiProvider, geminiApiKey, openaiApiKey, currentTask] =
      await Promise.all([
        getStorageValue(StorageKey.AI_PROVIDER),
        getStorageValue(StorageKey.GEMINI_API_KEY),
        getStorageValue(StorageKey.OPENAI_API_KEY),
        getStorageValue(StorageKey.CURRENT_TASK),
      ]);

    // Check if we have the necessary API key
    const apiKey = aiProvider === "openai" ? openaiApiKey : geminiApiKey;
    if (!apiKey) {
      console.error("No API key available for AI provider:", aiProvider);
      throw new Error(
        `No API key configured for ${aiProvider}. Please configure your API key in the extension settings.`,
      );
    }

    // Get chat sessions from storage
    const chatSessionsStorage = getStorage(StorageKey.CHAT_SESSIONS);
    const allSessions = (await chatSessionsStorage.getValue()) as Record<
      string,
      ChatSession
    >;

    // Get or create session
    let session = allSessions[data.sessionId];
    if (!session) {
      session = {
        id: data.sessionId,
        messages: [],
        createdAt: Date.now(),
        status: "active",
      };
    }

    // Create user message
    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      content: data.message,
      role: "user",
      timestamp: Date.now(),
    };

    // Add user message to history
    const updatedMessages = [...session.messages, userMessage];

    // Get chat history for AI context
    const chatHistory = session.messages;

    // Process the chat message using the AI service
    const aiResponse = await processChatMessage(
      apiKey,
      currentTask || "No task set",
      data.message,
      chatHistory,
      aiProvider,
    );

    // Add both user message and AI response to session
    const finalMessages = [...updatedMessages, aiResponse.message];
    const updatedSession: ChatSession = {
      ...session,
      messages: finalMessages,
    };

    // Save updated session to storage
    const updatedSessions = {
      ...allSessions,
      [data.sessionId]: updatedSession,
    };
    await chatSessionsStorage.setValue(updatedSessions);

    // If access was granted, save the access grant and cache the decision
    if (aiResponse.accessGranted && aiResponse.durationMinutes) {
      const now = Date.now();
      const expiresAt = now + aiResponse.durationMinutes * 60 * 1000;

      // Save access grant to storage
      await setAccessGrant({
        url: data.sessionId, // sessionId is the URL
        expiresAt,
        grantedAt: now,
        durationMinutes: aiResponse.durationMinutes,
      });

      // Cache the unblocking decision
      const allowResult: AnalysisResult = {
        decision: "ALLOW",
        reason: `Access granted through chat for ${aiResponse.durationMinutes} minutes`,
      };

      await setCachedDecision(
        data.sessionId, // URL
        currentTask || "",
        null, // alwaysRemove not relevant for chat unblocks
        allowResult,
        "user_unblock",
        aiProvider,
        false,
      );

      // Mark session as completed and clear messages to free memory
      updatedSession.status = "completed";
      updatedSession.messages = [];

      await chatSessionsStorage.setValue({
        ...allSessions,
        [data.sessionId]: updatedSession,
      });
    }

    return {
      sessionId: data.sessionId,
      message: aiResponse.message,
      accessGranted: aiResponse.accessGranted,
      durationMinutes: aiResponse.durationMinutes,
    };
  } catch (error) {
    console.error("Error processing chat message:", error);
    throw error;
  }
});

// Handle cache invalidation for task changes
onMessage(Message.INVALIDATE_CACHE_TASK, async (message) => {
  const data = message.data;

  try {
    await invalidateCacheForTaskChange(
      data.oldValue || "",
      data.newValue || "",
    );
  } catch (error) {
    console.error("Error invalidating cache for task change:", error);
    throw error;
  }
});

// Handle cache invalidation for alwaysRemove changes
onMessage(Message.INVALIDATE_CACHE_ALWAYS_REMOVE, async (message) => {
  try {
    await invalidateCacheForAlwaysRemoveChange();
  } catch (error) {
    console.error("Error invalidating cache for alwaysRemove change:", error);
    throw error;
  }
});

// Cleanup old chat sessions (older than 24 hours)
const cleanupOldChatSessions = async () => {
  const chatSessionsStorage = getStorage(StorageKey.CHAT_SESSIONS);
  const allSessions = (await chatSessionsStorage.getValue()) as Record<
    string,
    ChatSession
  >;

  const now = Date.now();
  const twentyFourHours = 24 * 60 * 60 * 1000;

  const validSessions = Object.entries(allSessions).reduce(
    (acc, [sessionId, session]) => {
      // Keep sessions created within the last 24 hours
      if (now - session.createdAt < twentyFourHours) {
        acc[sessionId] = session;
      }
      return acc;
    },
    {} as Record<string, ChatSession>,
  );

  await chatSessionsStorage.setValue(validSessions);
};

export default defineBackground(() => {

  // Run cleanup on startup
  cleanupOldChatSessions();
  cleanupExpiredCacheEntries();

  // Run cleanup every hour
  setInterval(cleanupOldChatSessions, 60 * 60 * 1000);
  setInterval(cleanupExpiredCacheEntries, 60 * 60 * 1000);
});
