/**
 * Unit Tests for Chat Hooks Module
 *
 * This file contains unit tests for the chat React hooks.
 * Tests cover message state management, chat mutations, and access state management.
 *
 * @module chat/hooks.test
 */

import "./setup"; // Import setup to ensure DOM is initialized
import { describe, expect, it, beforeEach, mock } from "bun:test";
import { renderHook, act, waitFor } from "@testing-library/react";
import type { ChatMessage } from "~/lib/messaging";
import {
  useChatMessages,
  useChatMutation,
  useAccessState,
} from "~/lib/chat/hooks";

// Mock the TanStack Query mutation
const mockMutate = mock(() => {});
const mockMutation = {
  mutate: mockMutate,
  isPending: false,
};

// Mock the useMutation hook
mock.module("@tanstack/react-query", () => ({
  useMutation: mock(() => mockMutation),
}));
// Mock React hooks
const mockUseCallback = mock();
const mockUseState = mock();

// Mock React hooks
mock.module("react", () => ({
  useCallback: mockUseCallback,
  useState: mockUseState,
}));

describe("useChatMessages", () => {
  beforeEach(() => {
    mockMutate.mockClear();
  });

  it("should initialize with empty messages when no initial message is provided", () => {
    const { result } = renderHook(() =>
      useChatMessages({
        sessionId: "test-session-id",
      })
    );

    expect(result.current.messages).toEqual([]);
  });

  it("should add an initial message when provided", () => {
    const onInitialized = mock(() => {});
    const initialMessage = "Hello, I need help with focus";

    const { result } = renderHook(() =>
      useChatMessages({
        sessionId: "test-session-id",
        initialMessage,
        onInitialized,
      })
    );

    expect(result.current.messages).toHaveLength(1);
    expect(result.current.messages[0]).toMatchObject({
      content: initialMessage,
      role: "user",
      id: expect.stringMatching(/^user_\d+$/),
      timestamp: expect.any(Number),
    });
    expect(onInitialized).toHaveBeenCalledWith("test-session-id", initialMessage);
  });

  it("should not add initial message on re-render", () => {
    const onInitialized = mock(() => {});
    const initialMessage = "Initial message";

    const { result, rerender } = renderHook(() =>
      useChatMessages({
        sessionId: "test-session-id",
        initialMessage,
        onInitialized,
      })
    );

    // Initial render should have one message
    expect(result.current.messages).toHaveLength(1);
    expect(onInitialized).toHaveBeenCalledTimes(1);

    // Re-render should not add another message
    rerender();
    expect(result.current.messages).toHaveLength(1);
    expect(onInitialized).toHaveBeenCalledTimes(1);
  });

  it("should add a message using addMessage", () => {
    const { result } = renderHook(() =>
      useChatMessages({
        sessionId: "test-session-id",
      })
    );

    const newMessage: ChatMessage = {
      id: "test-message-id",
      content: "Test message",
      role: "assistant",
      timestamp: Date.now(),
    };

    act(() => {
      result.current.addMessage(newMessage);
    });

    expect(result.current.messages).toHaveLength(1);
    expect(result.current.messages[0]).toEqual(newMessage);
  });

  it("should add a user message using addUserMessage", () => {
    const { result } = renderHook(() =>
      useChatMessages({
        sessionId: "test-session-id",
      })
    );

    const content = "User message content";

    act(() => {
      const addedMessage = result.current.addUserMessage(content);
      expect(addedMessage).toMatchObject({
        content,
        role: "user",
        id: expect.stringMatching(/^user_\d+$/),
        timestamp: expect.any(Number),
      });
    });

    expect(result.current.messages).toHaveLength(1);
    expect(result.current.messages[0]).toMatchObject({
      content,
      role: "user",
      id: expect.stringMatching(/^user_\d+$/),
      timestamp: expect.any(Number),
    });
  });

  it("should add multiple messages in the correct order", () => {
    const { result } = renderHook(() =>
      useChatMessages({
        sessionId: "test-session-id",
      })
    );

    const message1: ChatMessage = {
      id: "message-1",
      content: "First message",
      role: "user",
      timestamp: Date.now(),
    };

    const message2: ChatMessage = {
      id: "message-2",
      content: "Second message",
      role: "assistant",
      timestamp: Date.now() + 1,
    };

    act(() => {
      result.current.addMessage(message1);
      result.current.addMessage(message2);
    });

    expect(result.current.messages).toHaveLength(2);
    expect(result.current.messages[0]).toEqual(message1);
    expect(result.current.messages[1]).toEqual(message2);
  });
});

describe("useChatMutation", () => {
  beforeEach(() => {
    mockMutate.mockClear();
    mockMutation.isPending = false;
  });

  it("should return sendMessage function and isPending state", () => {
    const onMessageReceived = mock(() => {});

    const { result } = renderHook(() =>
      useChatMutation({
        onMessageReceived,
      })
    );

    expect(typeof result.current.sendMessage).toBe("function");
    expect(typeof result.current.isPending).toBe("boolean");
  });

  it("should call mutation.mutate when sendMessage is called", () => {
    const { result } = renderHook(() => useChatMutation());

    act(() => {
      result.current.sendMessage("test-session-id", "test message");
    });

    expect(mockMutate).toHaveBeenCalledWith({
      sessionId: "test-session-id",
      message: "test message",
    });
  });

  it("should handle successful response with regular message", async () => {
    const onMessageReceived = mock(() => {});
    const mockResponse = {
      sessionId: "test-session-id",
      message: {
        id: "response-id",
        content: "AI response",
        role: "assistant" as const,
        timestamp: Date.now(),
      },
    };

    // Mock the mutation to call onSuccess callback
    const mockOnSuccess = mock();
    mock.module("@tanstack/react-query", () => ({
      useMutation: mock(({ onSuccess }) => {
        // Simulate successful mutation
        setTimeout(() => {
          if (onSuccess) onSuccess(mockResponse);
        }, 0);
        return mockMutation;
      }),
    }));

    const { result } = renderHook(() =>
      useChatMutation({
        onMessageReceived,
      })
    );

    act(() => {
      result.current.sendMessage("test-session-id", "test message");
    });

    await waitFor(() => {
      expect(onMessageReceived).toHaveBeenCalledWith(mockResponse.message);
    });
  });

  it("should handle successful response with access granted", async () => {
    const onMessageReceived = mock(() => {});
    const onAccessGranted = mock();
    const mockResponse = {
      sessionId: "test-session-id",
      message: {
        id: "response-id",
        content: "Access granted",
        role: "assistant" as const,
        timestamp: Date.now(),
      },
      accessGranted: true,
      durationMinutes: 30,
    };

    // Mock the mutation to call onSuccess callback
    const mockOnSuccess = mock();
    mock.module("@tanstack/react-query", () => ({
      useMutation: mock(({ onSuccess }) => {
        setTimeout(() => {
          if (onSuccess) onSuccess(mockResponse);
        }, 0);
        return mockMutation;
      }),
    }));

    const { result } = renderHook(() =>
      useChatMutation({
        onMessageReceived,
        onAccessGranted,
      })
    );

    act(() => {
      result.current.sendMessage("test-session-id", "test message");
    });

    await waitFor(() => {
      expect(onMessageReceived).toHaveBeenCalledWith(mockResponse.message);
      expect(onAccessGranted).toHaveBeenCalledWith(30, "Access granted for 30 minutes! Unblocking page...");
    });
  });

  it("should handle successful response with access denied", async () => {
    const onMessageReceived = mock(() => {});
    const onAccessDenied = mock();
    const mockResponse = {
      sessionId: "test-session-id",
      message: {
        id: "response-id",
        content: "ACCESS_DENIED: You need to complete your focus time first",
        role: "assistant" as const,
        timestamp: Date.now(),
      },
    };

    // Mock the mutation to call onSuccess callback
    const mockOnSuccess = mock();
    mock.module("@tanstack/react-query", () => ({
      useMutation: mock(({ onSuccess }) => {
        setTimeout(() => {
          if (onSuccess) onSuccess(mockResponse);
        }, 0);
        return mockMutation;
      }),
    }));

    const { result } = renderHook(() =>
      useChatMutation({
        onMessageReceived,
        onAccessDenied,
      })
    );

    act(() => {
      result.current.sendMessage("test-session-id", "test message");
    });

    await waitFor(() => {
      expect(onMessageReceived).toHaveBeenCalledWith(mockResponse.message);
      expect(onAccessDenied).toHaveBeenCalledWith("You need to complete your focus time first");
    });
  });

  it("should handle error response", async () => {
    const onMessageReceived = mock(() => {});

    // Mock the mutation to call onError callback
    const mockOnError = mock();
    mock.module("@tanstack/react-query", () => ({
      useMutation: mock(({ onError }) => {
        setTimeout(() => {
          if (onError) onError(new Error("Test error"));
        }, 0);
        return mockMutation;
      }),
    }));

    const { result } = renderHook(() =>
      useChatMutation({
        onMessageReceived,
      })
    );

    act(() => {
      result.current.sendMessage("test-session-id", "test message");
    });

    await waitFor(() => {
      expect(onMessageReceived).toHaveBeenCalledWith(
        expect.objectContaining({
          content: "Sorry, I'm having trouble responding right now. Please try again.",
          role: "assistant",
          id: expect.stringMatching(/^error_\d+$/),
          timestamp: expect.any(Number),
        })
      );
    });
  });

  it("should reflect isPending state from mutation", () => {
    mockMutation.isPending = true;

    const { result } = renderHook(() => useChatMutation());

    expect(result.current.isPending).toBe(true);
  });
});

describe("useAccessState", () => {
  beforeEach(() => {
    // No need to clear mocks here as they're cleared in each test
  });

  it("should initialize with default state", () => {
    const { result } = renderHook(() => useAccessState());

    expect(result.current.isGranted).toBe(false);
    expect(result.current.isDenied).toBe(false);
    expect(result.current.message).toBe("");
  });

  it("should show granted state when showGranted is called", () => {
    const { result } = renderHook(() => useAccessState());
    const message = "Access granted for 30 minutes!";

    act(() => {
      result.current.showGranted(message);
    });

    expect(result.current.isGranted).toBe(true);
    expect(result.current.isDenied).toBe(false);
    expect(result.current.message).toBe(message);
  });

  it("should show denied state when showDenied is called", () => {
    const { result } = renderHook(() => useAccessState());
    const message = "Access denied: Focus time not completed";

    act(() => {
      result.current.showDenied(message);
    });

    expect(result.current.isGranted).toBe(false);
    expect(result.current.isDenied).toBe(true);
    expect(result.current.message).toBe(message);
  });

  it("should auto-reset denied state after 3 seconds", () => {
    const onDeniedCallback = mock(() => {});
    const { result } = renderHook(() => useAccessState());
    const message = "Access denied";

    act(() => {
      result.current.showDenied(message, onDeniedCallback);
    });

    // Should be in denied state initially
    expect(result.current.isDenied).toBe(true);
    expect(result.current.message).toBe(message);

    // Fast-forward time by 3 seconds
    act(() => {
      // Mock timer advancement
      const originalSetTimeout = global.setTimeout;
      const callbacks: Array<() => void> = [];
      
      global.setTimeout = ((callback: () => void, delay: number) => {
        const id = originalSetTimeout(callback, 0);
        callbacks.push(id);
        return id;
      }) as typeof setTimeout;
      
      // Simulate time passing
      setTimeout(() => {
        for (const id of callbacks) {
          originalSetTimeout(() => {}, 0);
        }
      }, 10);
    });

    // Should reset to default state
    expect(result.current.isGranted).toBe(false);
    expect(result.current.isDenied).toBe(false);
    expect(result.current.message).toBe("");
    expect(onDeniedCallback).toHaveBeenCalledWith(message);
  });

  it("should reset state when reset is called", () => {
    const { result } = renderHook(() => useAccessState());

    // Set granted state
    act(() => {
      result.current.showGranted("Access granted");
    });

    expect(result.current.isGranted).toBe(true);

    // Reset state
    act(() => {
      result.current.reset();
    });

    expect(result.current.isGranted).toBe(false);
    expect(result.current.isDenied).toBe(false);
    expect(result.current.message).toBe("");
  });

  it("should not auto-reset granted state", () => {
    const { result } = renderHook(() => useAccessState());

    act(() => {
      result.current.showGranted("Access granted");
    });

    // Fast-forward time by 3 seconds
    act(() => {
      // Mock timer advancement
      const originalSetTimeout = global.setTimeout;
      const callbacks: Array<() => void> = [];
      
      global.setTimeout = ((callback: () => void, delay: number) => {
        const id = originalSetTimeout(callback, 0);
        callbacks.push(id);
        return id;
      }) as typeof setTimeout;
      
      // Simulate time passing
      setTimeout(() => {
        for (const id of callbacks) {
          originalSetTimeout(() => {}, 0);
        }
      }, 10);
    });

    // Should still be in granted state
    expect(result.current.isGranted).toBe(true);
    expect(result.current.isDenied).toBe(false);
    expect(result.current.message).toBe("Access granted");
  });

  it("should not call callback on reset if no callback provided", () => {
    const { result } = renderHook(() => useAccessState());

    act(() => {
      result.current.showDenied("Access denied");
    });

    // Fast-forward time by 3 seconds
    act(() => {
      jest.advanceTimersByTime(3000);
    });

    // Should reset without errors
    expect(result.current.isGranted).toBe(false);
    expect(result.current.isDenied).toBe(false);
    expect(result.current.message).toBe("");
  });
});