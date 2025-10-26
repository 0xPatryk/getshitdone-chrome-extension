import { analyzePageContent, processChatMessage } from "~/lib/ai-service";
import { Message, onMessage } from "~/lib/messaging";
import { AnalysisResultSchema } from "~/lib/messaging";
import type { ChatMessage, ChatSession } from "~/lib/messaging";
import { getStorage, getStorageValue, setAccessGrant } from "~/lib/storage";
import { StorageKey } from "~/lib/storage";
import { defineBackground } from "#imports";

// Set up message handlers
onMessage(Message.ANALYZE_PAGE, async (message) => {
  console.log("Background received ANALYZE_PAGE message:", message);
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
        reason:
          "No current task set. Please set a task in the extension to enable content analysis.",
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
      data.alwaysRemove,
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

onMessage(Message.SEND_CHAT_MESSAGE, async (message) => {
  console.log("[DEBUG] Background: Received SEND_CHAT_MESSAGE message:", message);
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
    console.log("[DEBUG] Background: Processing chat message with AI service");
    const aiResponse = await processChatMessage(
      apiKey,
      currentTask || "No task set",
      data.message,
      chatHistory,
      aiProvider,
    );

    console.log("[DEBUG] Background: AI response:", aiResponse);

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

    console.log("Chat history saved to storage");

    // If access was granted, save the access grant and clear the chat session
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

      // Mark session as completed and clear messages to free memory
      updatedSession.status = "completed";
      updatedSession.messages = [];

      await chatSessionsStorage.setValue({
        ...allSessions,
        [data.sessionId]: updatedSession,
      });

      console.log(
        "[DEBUG] Access granted, session marked as completed and cleared",
      );
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
      } else {
        console.log("[DEBUG] Removing old chat session:", sessionId);
      }
      return acc;
    },
    {} as Record<string, ChatSession>,
  );

  await chatSessionsStorage.setValue(validSessions);
  console.log("[DEBUG] Chat session cleanup completed");
};

// Initialize the background script
console.log("Background script initialized");

export default defineBackground(() => {
  console.log("Background script entry point");

  // Run cleanup on startup
  cleanupOldChatSessions();

  // Run cleanup every hour
  setInterval(cleanupOldChatSessions, 60 * 60 * 1000);
});
