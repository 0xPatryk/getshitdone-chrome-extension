/**
 * Chat Session Module
 *
 * This module provides React hooks for managing chat sessions in the focus extension.
 * It handles session creation, message management, and session lifecycle using
 * persistent storage for state management.
 *
 * Key features:
 * - Session creation and management
 * - Message persistence
 * - Active session tracking
 * - Session lifecycle management
 *
 * @module chat-session
 */

import type { ChatMessage, ChatSession } from "~/lib/messaging";
import { StorageKey, useStorage } from "./storage";

/**
 * React hook for managing chat sessions and messages.
 * Provides functionality to create sessions, add messages, and manage session lifecycle.
 *
 * @returns An object containing session state and management functions
 *
 * @example
 * ```typescript
 * const {
 *   activeSession,
 *   activeSessionId,
 *   createSession,
 *   addMessage,
 *   endSession
 * } = useChatSession();
 *
 * // Create a new session
 * const session = createSession();
 *
 * // Add a message to the session
 * addMessage(session.id, {
 *   content: "I need to check social media",
 *   role: "user"
 * });
 * ```
 */
export const useChatSession = () => {
  const activeSessionIdStorage = useStorage(StorageKey.ACTIVE_CHAT_SESSION);
  const chatSessionsStorage = useStorage(StorageKey.CHAT_SESSIONS);

  /**
   * The currently active chat session, or null if no session is active
   */
  const activeSession = activeSessionIdStorage.data
    ? (chatSessionsStorage.data as Record<string, ChatSession>)[
        activeSessionIdStorage.data
      ] || null
    : null;

  /**
   * Creates a new chat session and sets it as the active session.
   * Generates a unique session ID and initializes it with empty messages.
   *
   * @returns The newly created ChatSession object
   *
   * @example
   * ```typescript
   * const newSession = createSession();
   * console.log("New session created:", newSession.id);
   * ```
   */
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

  /**
   * Adds a new message to the specified chat session.
   * Automatically generates a unique message ID and timestamp.
   *
   * @param sessionId - The ID of the session to add the message to
   * @param message - The message content and role (without ID and timestamp)
   *
   * @example
   * ```typescript
   * addMessage("session_123", {
   *   content: "I need 5 minutes to check email",
   *   role: "user"
   * });
   * ```
   */
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

  /**
   * Ends a chat session by changing its status to "completed".
   * If the ended session was the active one, clears the active session reference.
   *
   * @param sessionId - The ID of the session to end
   *
   * @example
   * ```typescript
   * endSession("session_123");
   * console.log("Session ended");
   * ```
   */
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
