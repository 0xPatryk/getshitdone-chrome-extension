import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  mock,
} from "bun:test";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { fakeBrowser } from "wxt/testing/fake-browser";
import { storage } from "~/lib/storage/services";
import { StorageKey } from "~/lib/storage/types";
import {
  useCacheInvalidation,
  useCachedDecision,
  useChatAccess,
  usePageAnalysis,
} from "./hooks";
import { setCachedDecision } from "./services";

// Mock messaging only
const mockSendMessage = mock(async () => ({ decision: "ALLOW" }));
const mockReload = mock(() => {});

mock.module("~/lib/messaging", () => ({
  sendMessage: mockSendMessage,
  onMessage: mock(() => {}), // Add generic onMessage mock if needed
}));

// Setup QueryClient for testing
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe("Cache Hooks", () => {
  const originalLocation = window.location;

  beforeAll(() => {
    // Mock window.location.reload
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { reload: mockReload },
    });
  });

  afterAll(() => {
    Object.defineProperty(window, "location", {
      configurable: true,
      value: originalLocation,
    });
  });

  beforeEach(async () => {
    fakeBrowser.reset();
    await storage[StorageKey.DECISION_CACHE].removeValue();
    mockSendMessage.mockClear();
    mockReload.mockClear();
  });

  describe("useCachedDecision", () => {
    it("should fetch cached decision", async () => {
      // Pre-populate storage
      await setCachedDecision("url", "task", null, "ALLOW", null, "reason");

      const { result } = renderHook(
        () => useCachedDecision("url", "task", null),
        { wrapper: createWrapper() },
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      // Check data structure from real service
      expect(result.current.data?.decision).toBe("ALLOW");
      expect(result.current.data?.reason).toBe("reason");
    });
  });

  describe("usePageAnalysis", () => {
    it("should send message for analysis", async () => {
      const { result } = renderHook(
        () => usePageAnalysis("url", "task", null, true),
        { wrapper: createWrapper() },
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data).toEqual({ decision: "ALLOW" });
      expect(mockSendMessage).toHaveBeenCalled();
    });

    it("should not run if disabled", () => {
      const { result } = renderHook(
        () => usePageAnalysis("url", "task", null, false),
        { wrapper: createWrapper() },
      );

      expect(result.current.isFetching).toBe(false);
      expect(mockSendMessage).not.toHaveBeenCalled();
    });
  });

  describe("useChatAccess", () => {
    it("should set cached decision and reload page on success", async () => {
      const { result } = renderHook(() => useChatAccess("url", "task", null), {
        wrapper: createWrapper(),
      });

      await result.current.mutateAsync(15);

      // Verify storage update
      const cached = await storage[StorageKey.DECISION_CACHE].getValue();
      // Since cache key generation involves hashing or specific format, checking for *any* entry might be safer,
      // or using getCachedDecision. But here we just want to ensure it wrote something.
      // useChatAccess -> setCachedDecision(..., "ALLOW_TEMPORARY", ...)
      // But verify logic of mutation fn.

      expect(mockReload).toHaveBeenCalled();

      // Verify something was written to cache
      expect(cached).not.toEqual({});
    });
  });

  describe("useCacheInvalidation", () => {
    it("should allow invalidating queries", () => {
      const { result } = renderHook(() => useCacheInvalidation(), {
        wrapper: createWrapper(),
      });

      expect(result.current.invalidateCache).toBeDefined();
      expect(result.current.invalidateCacheForUrl).toBeDefined();
    });
  });
});
