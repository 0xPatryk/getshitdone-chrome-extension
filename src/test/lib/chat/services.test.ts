import { beforeEach, describe, expect, it } from "bun:test";
import { act, renderHook, waitFor } from "@testing-library/react";
import { fakeBrowser } from "wxt/testing/fake-browser";
import { useChatSession } from "~/lib/chat/services";
import type { ChatSession } from "~/lib/chat/types";
import { storage } from "~/lib/storage/services";
import { StorageKey } from "~/lib/storage/types";

describe("Chat Services - useChatSession", () => {
  beforeEach(async () => {
    fakeBrowser.reset();
    // Ensure clean state
    await storage[StorageKey.CHAT_SESSIONS].removeValue();
    await storage[StorageKey.ACTIVE_CHAT_SESSION].removeValue();
  });

  it("should initialize with no active session", () => {
    const { result } = renderHook(() => useChatSession());
    expect(result.current.activeSession).toBeNull();
    expect(result.current.activeSessionId).toBeNull();
  });

  it("should create a new session", async () => {
    const { result } = renderHook(() => useChatSession());

    let session: ChatSession | undefined;

    await act(async () => {
      session = result.current.createSession();
    });

    expect(session).toBeDefined();
    expect(session?.id).toBeString();
    expect(session?.status).toBe("active");
    expect(session?.messages).toEqual([]);

    // Check storage updates
    // We need to wait for the storage to actually persist if it's async,
    // although createSession calls .set() which awaits item.setValue().
    // Since we are checking the *source of truth* (storage), we should access it directly.

    // Check Active Session ID
    const activeId = await storage[StorageKey.ACTIVE_CHAT_SESSION].getValue();
    if (!session) throw new Error("Session not created");
    expect(activeId).toBe(session.id);

    // Check Sessions Map
    const sessions = await storage[StorageKey.CHAT_SESSIONS].getValue();
    expect(sessions).toBeDefined();
    expect(sessions?.[session.id]).toBeDefined();
    expect(sessions?.[session.id].status).toBe("active");
  });

  it("addMessage should update session messages", async () => {
    // Setup initial state
    const sessionId = "session_123";
    const initialSession: ChatSession = {
      id: sessionId,
      messages: [],
      createdAt: Date.now(),
      status: "active",
    };

    // Pre-populate storage
    await storage[StorageKey.CHAT_SESSIONS].setValue({
      [sessionId]: initialSession,
    });
    await storage[StorageKey.ACTIVE_CHAT_SESSION].setValue(sessionId);

    const { result } = renderHook(() => useChatSession());

    // Wait for hook to sync with initial storage
    await waitFor(() => {
      expect(result.current.activeSessionId).toBe(sessionId);
      expect(result.current.activeSession).not.toBeNull();
    });

    await act(async () => {
      result.current.addMessage(sessionId, { role: "user", content: "hello" });
    });

    // Verify storage update
    const sessions = await storage[StorageKey.CHAT_SESSIONS].getValue();
    if (!sessions) throw new Error("Sessions not found");
    const updatedSession = sessions[sessionId];

    expect(updatedSession.messages).toHaveLength(1);
    expect(updatedSession.messages[0].content).toBe("hello");
  });

  it("endSession should complete the session and clear active session", async () => {
    // Setup initial state
    const sessionId = "session_123";
    const initialSession: ChatSession = {
      id: sessionId,
      messages: [],
      createdAt: Date.now(),
      status: "active",
    };

    await storage[StorageKey.CHAT_SESSIONS].setValue({
      [sessionId]: initialSession,
    });
    await storage[StorageKey.ACTIVE_CHAT_SESSION].setValue(sessionId);

    const { result } = renderHook(() => useChatSession());

    await waitFor(() => {
      expect(result.current.activeSessionId).toBe(sessionId);
    });

    await act(async () => {
      result.current.endSession(sessionId);
    });

    // Check status update in storage
    const sessions = await storage[StorageKey.CHAT_SESSIONS].getValue();
    if (!sessions) throw new Error("Sessions not found");
    expect(sessions[sessionId].status).toBe("completed");

    // Check active session cleared in storage
    const activeId = await storage[StorageKey.ACTIVE_CHAT_SESSION].getValue();
    expect(activeId).toBeNull();
  });
});
