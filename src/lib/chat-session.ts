import type { ChatMessage, ChatSession } from "~/lib/messaging";
import { StorageKey, useStorage } from "./storage";

// Hook for managing active chat session
export const useChatSession = () => {
  const activeSessionIdStorage = useStorage(StorageKey.ACTIVE_CHAT_SESSION);
  const chatSessionsStorage = useStorage(StorageKey.CHAT_SESSIONS);

  const activeSession = activeSessionIdStorage.data
    ? (chatSessionsStorage.data as Record<string, ChatSession>)[
        activeSessionIdStorage.data
      ] || null
    : null;

  const createSession = () => {
    const sessionId = `session_${Date.now()}`;
    const newSession: ChatSession = {
      id: sessionId,
      messages: [],
      createdAt: Date.now(),
      status: "active",
    };

    // Update sessions
    const currentSessions = chatSessionsStorage.data as Record<
      string,
      ChatSession
    >;
    const updatedSessions = { ...currentSessions, [sessionId]: newSession };
    chatSessionsStorage.set(updatedSessions);

    // Set as active
    activeSessionIdStorage.set(sessionId);

    return newSession;
  };

  const addMessage = (
    sessionId: string,
    message: Omit<ChatMessage, "id" | "timestamp">,
  ) => {
    const newMessage: ChatMessage = {
      ...message,
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
    };

    const currentSessions = chatSessionsStorage.data as Record<
      string,
      ChatSession
    >;
    const session = currentSessions[sessionId];
    if (session) {
      const updatedSession = {
        ...session,
        messages: [...session.messages, newMessage],
      };

      const updatedSessions = {
        ...currentSessions,
        [sessionId]: updatedSession,
      };
      chatSessionsStorage.set(updatedSessions);
    }
  };

  const endSession = (sessionId: string) => {
    const currentSessions = chatSessionsStorage.data as Record<
      string,
      ChatSession
    >;
    const session = currentSessions[sessionId];
    if (session) {
      const updatedSession = {
        ...session,
        status: "completed" as const,
      };

      const updatedSessions = {
        ...currentSessions,
        [sessionId]: updatedSession,
      };
      chatSessionsStorage.set(updatedSessions);
    }

    // Clear active session if it's the one being ended
    if (activeSessionIdStorage.data === sessionId) {
      activeSessionIdStorage.set(null);
    }
  };

  return {
    activeSession,
    activeSessionId: activeSessionIdStorage.data,
    createSession,
    addMessage,
    endSession,
  };
};
