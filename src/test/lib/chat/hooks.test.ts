import { describe, expect, it, jest } from "bun:test";
import { act, renderHook } from "@testing-library/react";
import { useAccessState, useChatMessages } from "~/lib/chat/hooks";

describe("Chat Hooks", () => {
  describe("useChatMessages", () => {
    it("should initialize with empty state", () => {
      const { result } = renderHook(() =>
        useChatMessages({ sessionId: "test-session" }),
      );
      expect(result.current.messages).toEqual([]);
    });

    it("should initialize with provided message", () => {
      const { result } = renderHook(() =>
        useChatMessages({
          sessionId: "test-session",
          initialMessage: "Hello",
        }),
      );
      expect(result.current.messages).toHaveLength(2); // AI + User
      expect(result.current.messages[0]?.role).toBe("assistant");
      expect(result.current.messages[1]?.role).toBe("user");
      expect(result.current.messages[1]?.content).toBe("Hello");
    });

    it("should add messages correctly", () => {
      const { result } = renderHook(() =>
        useChatMessages({ sessionId: "test-session" }),
      );
      act(() => {
        result.current.addUserMessage("User test");
      });
      expect(result.current.messages).toHaveLength(1);
      expect(result.current.messages[0]?.content).toBe("User test");
    });
  });

  describe("useAccessState", () => {
    it("should handle grant state", () => {
      const { result } = renderHook(() => useAccessState());
      act(() => {
        result.current.showGranted("Granted!");
      });
      expect(result.current.isGranted).toBe(true);
      expect(result.current.message).toBe("Granted!");
    });

    it("should handle deny state with auto-reset", () => {
      jest.useFakeTimers();
      const { result } = renderHook(() => useAccessState());

      act(() => {
        result.current.showDenied("Denied!");
      });

      expect(result.current.isDenied).toBe(true);
      expect(result.current.message).toBe("Denied!");

      // Fast-forward time
      act(() => {
        jest.advanceTimersByTime(3001);
      });

      expect(result.current.isDenied).toBe(false);
      expect(result.current.message).toBe("");

      jest.useRealTimers();
    });
  });
});
