/**
 * Background Service Worker
 *
 * This service worker handles the core logic of the Chrome extension, including:
 * - Page content analysis using AI services
 * - Chat message processing for user interactions
 * - Cache management for analysis results
 * - Storage operations for extension state
 * - Message routing between different extension contexts
 *
 * The service worker runs in the background and responds to messages from
 * content scripts, popup, and other extension components.
 */

import { analyzePageContent, processChatMessage } from "~/lib/ai-service";
import { getCachedDecision, setCachedDecision } from "~/lib/cache";
import {
  cleanupExpiredCacheEntries,
  invalidateCacheForAlwaysRemoveChange,
  invalidateCacheForTaskChange,
} from "~/lib/cache";
import {
  getAllActiveAccessGrants,
  getChatContextForGrants,
  setAccessGrant,
} from "~/lib/grants";
import { Message, onMessage } from "~/lib/messaging";
import { type AnalysisResult, AnalysisResultSchema } from "~/lib/messaging";
import type { ChatMessage, ChatSession } from "~/lib/messaging";
import { storage } from "~/lib/storage/services";
import { StorageKey } from "~/lib/storage/types";
import { defineBackground } from "#imports";

// Set up message handlers

/**
 * Message handler for analyzing page content
 *
 * Handles the ANALYZE_PAGE message by:
 * 1. Checking for required API keys and current task
 * 2. Checking cache for existing analysis
 * 3. Performing AI analysis if no cached result exists
 * 4. Caching the analysis result
 * 5. Returning the validated analysis result
 *
 * @param message - The message containing page data for analysis
 * @returns Promise resolving to the analysis result with decision and reason
 * @throws Error when analysis fails or required data is missing
 */
onMessage(Message.ANALYZE_PAGE, async (message) => {
  const data = message.data;

  try {
    // Get the AI provider, API key, and current task from storage
    const [aiProvider, geminiApiKey, openaiApiKey, currentTask] =
      await Promise.all([
        storage[StorageKey.AI_PROVIDER].getValue(),
        storage[StorageKey.GEMINI_API_KEY].getValue(),
        storage[StorageKey.OPENAI_API_KEY].getValue(),
        storage[StorageKey.CURRENT_TASK].getValue(),
      ]);

    // Check if we have the necessary API key
    const apiKey = aiProvider === "openai" ? openaiApiKey : geminiApiKey;
    if (!apiKey) {
      console.warn("No API key available for AI provider:", aiProvider);
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

    // Get active grants and their chat context for enhanced AI analysis
    const activeGrants = await getAllActiveAccessGrants();
    const chatContexts = await getChatContextForGrants(
      Object.keys(activeGrants),
    );

    // Analyze the page content using the AI service with grants context
    const analysisResult = await analyzePageContent(
      apiKey,
      currentTask,
      data.content,
      data.url,
      aiProvider,
      data.alwaysRemove,
      activeGrants,
      chatContexts,
    );

    // Cache the result
    await setCachedDecision(
      data.url,
      currentTask || "",
      data.alwaysRemove || null,
      analysisResult.decision,
      analysisResult.selectors || null,
      analysisResult.reason,
    );

    // Validate and return the result
    const validatedResult = AnalysisResultSchema.parse(analysisResult);
    return validatedResult;
  } catch (error) {
    console.error("Error analyzing page:", {
      error: error instanceof Error ? error.message : String(error),
      url: data?.url || "unknown",
      timestamp: new Date().toISOString(),
      context: "background page analysis",
    });
    throw error;
  }
});

/**
 * Message handler for processing chat messages
 *
 * Handles the SEND_CHAT_MESSAGE message by:
 * 1. Validating API key and provider settings
 * 2. Retrieving or creating a chat session
 * 3. Processing the message with AI service
 * 4. Managing access grants if approved
 * 5. Updating session state and storage
 *
 * @param message - The message containing chat session ID and user message
 * @returns Promise resolving to the AI response with access grant information
 * @throws Error when chat processing fails or required data is missing
 */
onMessage(Message.SEND_CHAT_MESSAGE, async (message) => {
  const data = message.data;

  try {
    // Get the AI provider, API key, and current task from storage
    const [aiProvider, geminiApiKey, openaiApiKey, currentTask] =
      await Promise.all([
        storage[StorageKey.AI_PROVIDER].getValue(),
        storage[StorageKey.GEMINI_API_KEY].getValue(),
        storage[StorageKey.OPENAI_API_KEY].getValue(),
        storage[StorageKey.CURRENT_TASK].getValue(),
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
    const chatSessionsStorage = storage[StorageKey.CHAT_SESSIONS];
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
        allowResult.decision,
        null, // no selectors for ALLOW
        allowResult.reason,
        aiResponse.durationMinutes * 60 * 1000, // custom TTL based on duration
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
    console.error("Error processing chat message:", {
      error: error instanceof Error ? error.message : String(error),
      sessionId: data?.sessionId || "unknown",
      timestamp: new Date().toISOString(),
      context: "chat message processing",
    });
    throw error;
  }
});

// Handle cache invalidation for task changes

/**
 * Message handler for cache invalidation on task changes
 *
 * Handles the INVALIDATE_CACHE_TASK message by invalidating cached
 * analysis results when the user's focus task changes.
 *
 * @param message - The message containing old and new task values
 * @throws Error when cache invalidation fails
 */
onMessage(Message.INVALIDATE_CACHE_TASK, async (message) => {
  const data = message.data;

  try {
    await invalidateCacheForTaskChange(
      data.oldValue || "",
      data.newValue || "",
    );
  } catch (error) {
    console.error("Error invalidating cache for task change:", {
      error: error instanceof Error ? error.message : String(error),
      oldValue: data?.oldValue || "unknown",
      newValue: data?.newValue || "unknown",
      timestamp: new Date().toISOString(),
      context: "cache invalidation for task change",
    });
    throw error;
  }
});

// Handle cache invalidation for alwaysRemove changes

/**
 * Message handler for cache invalidation on alwaysRemove changes
 *
 * Handles the INVALIDATE_CACHE_ALWAYS_REMOVE message by invalidating
 * cached analysis results when the always remove list changes.
 *
 * @throws Error when cache invalidation fails
 */
onMessage(Message.INVALIDATE_CACHE_ALWAYS_REMOVE, async (message) => {
  try {
    await invalidateCacheForAlwaysRemoveChange();
  } catch (error) {
    console.error("Error invalidating cache for alwaysRemove change:", {
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString(),
      context: "cache invalidation for alwaysRemove change",
    });
    throw error;
  }
});

/**
 * Cleanup function for old chat sessions
 *
 * Removes chat sessions that are older than 24 hours to prevent
 * storage bloat and maintain performance.
 *
 * @throws Error when cleanup operation fails
 */
const cleanupOldChatSessions = async () => {
  const chatSessionsStorage = storage[StorageKey.CHAT_SESSIONS];
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

/**
 * Background service worker entry point
 *
 * Initializes the background service worker and sets up periodic
 * cleanup tasks for chat sessions and expired cache entries.
 *
 * @example
 * // This function is called automatically when the extension loads
 * // and runs cleanup tasks on startup and every hour thereafter
 */
export default defineBackground(() => {
  // Run cleanup on startup
  cleanupOldChatSessions();
  cleanupExpiredCacheEntries();

  // Run cleanup every hour
  setInterval(cleanupOldChatSessions, 60 * 60 * 1000);
  setInterval(cleanupExpiredCacheEntries, 60 * 60 * 1000);
});
