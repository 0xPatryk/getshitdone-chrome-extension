import { useEffect, useState } from "react";
import type { ChatMessage, ChatSession } from "~/lib/messaging";
import { type WxtStorageItem, storage as browserStorage } from "#imports";
import { StorageKey } from "./storage";

// Hook for managing active chat session
export const useChatSession = () => {
  const activeSessionId = useStorage(StorageKey.ACTIVE_CHAT_SESSION);
  const chatSessions = useStorage(StorageKey.CHAT_SESSIONS);

  const activeSession = activeSessionId.data
    ? (chatSessions.data as Record<string, ChatSession>)[
        activeSessionId.data
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
    const currentSessions = chatSessions.data as Record<string, ChatSession>;
    const updatedSessions = { ...currentSessions, [sessionId]: newSession };
    chatSessions.set(updatedSessions);

    // Set as active
    activeSessionId.set(sessionId);

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

    const currentSessions = chatSessions.data as Record<string, ChatSession>;
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
      chatSessions.set(updatedSessions);
    }
  };

  const endSession = (sessionId: string) => {
    const currentSessions = chatSessions.data as Record<string, ChatSession>;
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
      chatSessions.set(updatedSessions);
    }

    // Clear active session if it's the one being ended
    if (activeSessionId.data === sessionId) {
      activeSessionId.set(null);
    }
  };

  return {
    activeSession,
    activeSessionId: activeSessionId.data,
    createSession,
    addMessage,
    endSession,
  };
};

// Re-export useStorage for internal use
const useStorage = <K extends StorageKey>(key: K) => {
  const item = storage[key as keyof typeof storage] as WxtStorageItem<
    K extends typeof StorageKey.CHAT_SESSIONS
      ? Record<string, ChatSession>
      : K extends typeof StorageKey.ACTIVE_CHAT_SESSION
        ? string | null
        : unknown,
    Record<string, unknown>
  >;
  const [value, setValue] = useState(item.fallback);

  useEffect(() => {
    const unwatch = item.watch((newValue) => {
      setValue(newValue);
    });

    return () => {
      unwatch();
    };
  }, [item]);

  useEffect(() => {
    (async () => {
      const newValue = await item.getValue();
      setValue(newValue);
    })();
  }, [item]);

  const remove = () => {
    void item.removeValue();
  };

  const set = (newValue: Parameters<typeof item.setValue>[0]) => {
    void item.setValue(newValue);
  };

  return { data: value, remove, set };
};

const storage = {
  [StorageKey.CHAT_SESSIONS]: browserStorage.defineItem<
    Record<string, ChatSession>
  >(StorageKey.CHAT_SESSIONS, {
    fallback: {},
  }),
  [StorageKey.ACTIVE_CHAT_SESSION]: browserStorage.defineItem<string | null>(
    StorageKey.ACTIVE_CHAT_SESSION,
    {
      fallback: null,
    },
  ),
} as const;
