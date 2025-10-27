/**
 * Unit Tests for Chat Services Module
 *
 * This file contains unit tests for the chat session management services.
 * Tests cover session creation, message management, and session lifecycle.
 *
 * @module chat/services.test
 */

import { describe, expect, it, beforeEach, mock } from "bun:test";
import { renderHook, act } from "@testing-library/react";
import type { ChatSession } from "~/lib/messaging";
import { StorageKey } from "~/lib/storage/types";
import "./setup"; // Import setup to ensure mocks are initialized

// Mock the storage service
const mockSet = mock(() => {});
const mockStorage = {
  data: {},
  set: mockSet,
};

// Mock the #imports module first
mock.module("#imports", () => ({
  storage: {
    defineItem: (key: string, options: Record<string, unknown>) => ({
      key,
      fallback: options.fallback,
      watch: (callback: (value: unknown) => void) => {
        // Mock watch function
        return () => {}; // Return unwatch function
      },
      getValue: async () => mockStorage.data[key] ?? options.fallback,
      setValue: async (value: unknown) => {
        mockStorage.data[key] = value;
      },
      removeValue: async () => {
        delete mockStorage.data[key];
      },
    }),
  },
}));

// Mock the useStorage hook
mock.module("~/lib/storage/services", () => ({
  useStorage: mock((key) => {
    // Return mock storage with current data
    return {
      data: mockStorage.data[key] ?? null,
      set: (value: unknown) => {
        mockStorage.data[key] = value;
        mockSet(key, value);
      },
    };
  }),
}));

// Import after mocking
const { useChatSession } = await import("~/lib/chat/services");

describe("useChatSession", () => {
  beforeEach(() => {
    mockSet.mockClear();
    // Reset mock storage
    mockStorage.data = {};
  });

  it("should return null activeSession when no session is active", () => {
    const { result } = renderHook(() => useChatSession());

    expect(result.current.activeSession).toBeNull();
    expect(result.current.activeSessionId).toBeNull();
  });

  it("should return activeSession when a session is active", () => {
    // Set up active session in storage
    const testSession: ChatSession = {
      id: "test-session-id",
      messages: [],
      createdAt: Date.now(),
      status: "active",
    };
    mockStorage.data[StorageKey.ACTIVE_CHAT_SESSION] = "test-session-id";
    mockStorage.data[StorageKey.CHAT_SESSIONS] = {
      "test-session-id": testSession,
    };

    const { result } = renderHook(() => useChatSession());

    expect(result.current.activeSession).toEqual(testSession);
    expect(result.current.activeSessionId).toBe("test-session-id");
  });

  it("should create a new session when createSession is called", () => {
    const { result } = renderHook(() => useChatSession());

    let newSession: ChatSession;
    act(() => {
      newSession = result.current.createSession();
    });

    // Check that the session was created with expected properties
    expect(newSession).toMatchObject({
      id: expect.stringMatching(/^session_\d+$/),
      messages: [],
      status: "active",
      createdAt: expect.any(Number),
    });

    // Check that storage was updated
    expect(mockSet).toHaveBeenCalledWith(
      StorageKey.CHAT_SESSIONS,
      expect.objectContaining({
        [newSession.id]: newSession,
      })
    );
    expect(mockSet).toHaveBeenCalledWith(
      StorageKey.ACTIVE_CHAT_SESSION,
      newSession.id
    );

    // Check that the session is now active
    expect(result.current.activeSessionId).toBe(newSession.id);
    expect(result.current.activeSession).toEqual(newSession);
  });

  it("should add a message to a session when addMessage is called", () => {
    // Create a session first
    mockStorage.data[StorageKey.CHAT_SESSIONS] = {};
    const { result } = renderHook(() => useChatSession());

    const session = act(() => {
      return result.current.createSession();
    });

    // Add a message to the session
    const messageInput = {
      content: "Test message",
      role: "user" as const,
    };

    act(() => {
      result.current.addMessage(session.id, messageInput);
    });

    // Check that the session was updated with the message
    // Get the last call to CHAT_SESSIONS
    const chatSessionsCalls = mockSet.mock.calls.filter(
      (call) => call[0] === StorageKey.CHAT_SESSIONS
    );
    const lastChatSessionsCall = chatSessionsCalls[chatSessionsCalls.length - 1];
    const updatedSessions = lastChatSessionsCall?.[1] as Record<string, ChatSession>;

    const updatedSession = updatedSessions[session.id];
    expect(updatedSession?.messages).toHaveLength(1);
    expect(updatedSession.messages[0]).toMatchObject({
      content: messageInput.content,
      role: messageInput.role,
      id: expect.stringMatching(/^msg_\d+_[a-z0-9]{9}$/),
      timestamp: expect.any(Number),
    });
  });

  it("should add multiple messages to a session in the correct order", () => {
    // Create a session first
    mockStorage.data[StorageKey.CHAT_SESSIONS] = {};
    const { result } = renderHook(() => useChatSession());

    const session = act(() => {
      return result.current.createSession();
    });

    // Add multiple messages
    const message1 = {
      content: "First message",
      role: "user" as const,
    };
    const message2 = {
      content: "Second message",
      role: "assistant" as const,
    };

    act(() => {
      result.current.addMessage(session.id, message1);
      result.current.addMessage(session.id, message2);
    });

    // Check that both messages were added in order
    // Get the last call to CHAT_SESSIONS
    const chatSessionsCalls = mockSet.mock.calls.filter(
      (call) => call[0] === StorageKey.CHAT_SESSIONS
    );
    const lastChatSessionsCall = chatSessionsCalls[chatSessionsCalls.length - 1];
    const updatedSessions = lastChatSessionsCall?.[1] as Record<string, ChatSession>;

    const updatedSession = updatedSessions[session.id];
    expect(updatedSession?.messages).toHaveLength(2);
    expect(updatedSession.messages[0].content).toBe(message1.content);
    expect(updatedSession.messages[1].content).toBe(message2.content);
  });

  it("should not add a message if the session does not exist", () => {
    // Set up empty sessions
    mockStorage.data[StorageKey.CHAT_SESSIONS] = {};
    const { result } = renderHook(() => useChatSession());

    // Try to add a message to a non-existent session
    const messageInput = {
      content: "Test message",
      role: "user" as const,
    };

    act(() => {
      result.current.addMessage("non-existent-session", messageInput);
    });

    // Check that storage was not updated
    const chatSessionsCalls = mockSet.mock.calls.filter(
      (call) => call[0] === StorageKey.CHAT_SESSIONS
    );
    expect(chatSessionsCalls).toHaveLength(0);
  });

  it("should end a session when endSession is called", () => {
    // Create a session first
    mockStorage.data[StorageKey.CHAT_SESSIONS] = {};
    const { result } = renderHook(() => useChatSession());

    const session = act(() => {
      return result.current.createSession();
    });

    // End the session
    act(() => {
      result.current.endSession(session.id);
    });

    // Check that the session status was updated
    // Get the last call to CHAT_SESSIONS
    const chatSessionsCalls = mockSet.mock.calls.filter(
      (call) => call[0] === StorageKey.CHAT_SESSIONS
    );
    const lastChatSessionsCall = chatSessionsCalls[chatSessionsCalls.length - 1];
    const updatedSessions = lastChatSessionsCall?.[1] as Record<string, ChatSession>;

    const updatedSession = updatedSessions[session.id];
    expect(updatedSession?.status).toBe("completed");
  });

  it("should clear active session when ending the active session", () => {
    // Create a session first
    mockStorage.data[StorageKey.CHAT_SESSIONS] = {};
    const { result } = renderHook(() => useChatSession());

    const session = act(() => {
      return result.current.createSession();
    });

    // Verify session is active
    expect(result.current.activeSessionId).toBe(session.id);

    // End the session
    act(() => {
      result.current.endSession(session.id);
    });

    // Check that active session was cleared
    expect(mockSet).toHaveBeenCalledWith(
      StorageKey.ACTIVE_CHAT_SESSION,
      null
    );
  });

  it("should not clear active session when ending a non-active session", () => {
    // Create two sessions
    mockStorage.data[StorageKey.CHAT_SESSIONS] = {};
    const { result } = renderHook(() => useChatSession());

    const session1 = act(() => {
      return result.current.createSession();
    });

    const session2 = act(() => {
      return result.current.createSession();
    });

    // session2 should be active now
    expect(result.current.activeSessionId).toBe(session2.id);

    // End session1 (not the active one)
    act(() => {
      result.current.endSession(session1.id);
    });

    // Check that active session was not cleared
    expect(result.current.activeSessionId).toBe(session2.id);

    // Check that the last call to ACTIVE_CHAT_SESSION was not null
    const activeSessionCalls = mockSet.mock.calls.filter(
      (call) => call[0] === StorageKey.ACTIVE_CHAT_SESSION
    );
    const lastCall = activeSessionCalls[activeSessionCalls.length - 1];
    expect(lastCall?.[1]).toBe(session2.id);
  });

  it("should not end a session if it does not exist", () => {
    // Set up empty sessions
    mockStorage.data[StorageKey.CHAT_SESSIONS] = {};
    const { result } = renderHook(() => useChatSession());

    // Try to end a non-existent session
    act(() => {
      result.current.endSession("non-existent-session");
    });

    // Check that storage was not updated
    const chatSessionsCalls = mockSet.mock.calls.filter(
      (call) => call[0] === StorageKey.CHAT_SESSIONS
    );
    expect(chatSessionsCalls).toHaveLength(0);
  });

  it("should handle existing sessions in storage", () => {
    // Set up existing sessions in storage
    const existingSession: ChatSession = {
      id: "existing-session-id",
      messages: [
        {
          id: "existing-message-id",
          content: "Existing message",
          role: "user",
          timestamp: Date.now(),
        },
      ],
      createdAt: Date.now() - 1000,
      status: "active",
    };
    mockStorage.data[StorageKey.ACTIVE_CHAT_SESSION] = "existing-session-id";
    mockStorage.data[StorageKey.CHAT_SESSIONS] = {
      "existing-session-id": existingSession,
    };

    const { result } = renderHook(() => useChatSession());

    // Check that the existing session is returned
    expect(result.current.activeSession).toEqual(existingSession);
    expect(result.current.activeSessionId).toBe("existing-session-id");
  });

  it("should handle completed sessions", () => {
    // Set up a completed session
    const completedSession: ChatSession = {
      id: "completed-session-id",
      messages: [],
      createdAt: Date.now() - 1000,
      status: "completed",
    };
    mockStorage.data[StorageKey.ACTIVE_CHAT_SESSION] = "completed-session-id";
    mockStorage.data[StorageKey.CHAT_SESSIONS] = {
      "completed-session-id": completedSession,
    };

    const { result } = renderHook(() => useChatSession());

    // Check that the completed session is returned
    expect(result.current.activeSession).toEqual(completedSession);
    expect(result.current.activeSessionId).toBe("completed-session-id");
  });

  it("should handle sessions with no active session ID", () => {
    // Set up sessions but no active session
    mockStorage.data[StorageKey.ACTIVE_CHAT_SESSION] = null;
    mockStorage.data[StorageKey.CHAT_SESSIONS] = {
      "session-1": {
        id: "session-1",
        messages: [],
        createdAt: Date.now(),
        status: "active",
      },
    };

    const { result } = renderHook(() => useChatSession());

    // Check that no active session is returned
    expect(result.current.activeSession).toBeNull();
    expect(result.current.activeSessionId).toBeNull();
  });
});