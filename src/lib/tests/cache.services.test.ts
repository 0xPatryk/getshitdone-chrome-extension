/**
 * Cache Services Tests
 *
 * This file contains unit tests for cache service functions.
 * Tests cover caching, retrieval, and cleanup operations.
 *
 * @module tests/cache.services
 */

import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";
import {
  cleanupExpiredCacheEntries,
  clearDecisionCache,
  getCacheStats,
  getCachedDecision,
  invalidateCacheForAlwaysRemoveChange,
  invalidateCacheForTaskChange,
  removeCachedDecision,
  setCachedDecision,
} from "~/lib/cache/services";
import { StorageKey } from "~/lib/storage/types";

// Mock storage
const mockStorage = {
  [StorageKey.DECISION_CACHE]: {
    getValue: mock(() => Promise.resolve({})),
    setValue: mock(() => Promise.resolve()),
  },
} as unknown;

// Mock the storage module
mock.module("~/lib/storage/services", () => ({
  storage: mockStorage,
}));

describe("Cache Services", () => {
  beforeEach(() => {
    // Reset all mocks before each test
    mockStorage[StorageKey.DECISION_CACHE].getValue.mockClear();
    mockStorage[StorageKey.DECISION_CACHE].setValue.mockClear();
  });

  afterEach(() => {
    // Clean up any global state
    mock.restore();
  });

  describe("getCachedDecision", () => {
    it("should return null when cache entry doesn't exist", async () => {
      const url = "https://example.com";
      const task = "test task";
      const alwaysRemove = null;

      mockStorage[StorageKey.DECISION_CACHE].getValue.mockResolvedValue({});

      const result = await getCachedDecision(url, task, alwaysRemove);

      expect(result).toBeNull();
    });

    it("should return null when cache entry has expired", async () => {
      const url = "https://example.com";
      const task = "test task";
      const alwaysRemove = null;
      const expiredEntry = {
        decision: "ALLOW" as const,
        reason: "Test reason",
        expiresAt: Date.now() - 1000, // Expired 1 second ago
      };

      mockStorage[StorageKey.DECISION_CACHE].getValue.mockResolvedValue({
        "cache-key": expiredEntry,
      });

      const result = await getCachedDecision(url, task, alwaysRemove);

      expect(result).toBeNull();
      expect(
        mockStorage[StorageKey.DECISION_CACHE].setValue,
      ).toHaveBeenCalledWith({
        "cache-key": expiredEntry,
      });
    });

    it("should return cached entry when valid", async () => {
      const url = "https://example.com";
      const task = "test task";
      const alwaysRemove = null;
      const validEntry = {
        decision: "BLOCK_ALL" as const,
        reason: "Test reason",
        expiresAt: Date.now() + 100000, // Expires in future
      };

      mockStorage[StorageKey.DECISION_CACHE].getValue.mockResolvedValue({
        "cache-key": validEntry,
      });

      const result = await getCachedDecision(url, task, alwaysRemove);

      expect(result).toEqual(validEntry);
      expect(
        mockStorage[StorageKey.DECISION_CACHE].setValue,
      ).not.toHaveBeenCalled();
    });
  });

  describe("setCachedDecision", () => {
    it("should set cache entry with correct expiration", async () => {
      const url = "https://example.com";
      const task = "test task";
      const alwaysRemove = null;
      const decision = "ALLOW" as const;
      const reason = "Test reason";
      const selectors = [".test-selector"];

      const existingCache = {
        "existing-key": {
          decision: "BLOCK_ALL" as const,
          reason: "Existing reason",
          expiresAt: Date.now() + 100000,
        },
      };

      mockStorage[StorageKey.DECISION_CACHE].getValue.mockResolvedValue(
        existingCache,
      );

      await setCachedDecision(
        url,
        task,
        alwaysRemove,
        decision,
        selectors,
        reason,
      );

      expect(
        mockStorage[StorageKey.DECISION_CACHE].setValue,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          "cache-key": expect.objectContaining({
            decision,
            reason,
            selectors,
            expiresAt: expect.any(Number),
          }),
        }),
      );
    });

    it("should use custom TTL when provided", async () => {
      const url = "https://example.com";
      const task = "test task";
      const alwaysRemove = null;
      const decision = "ALLOW" as const;
      const reason = "Test reason";
      const customTTL = 5000; // 5 seconds

      mockStorage[StorageKey.DECISION_CACHE].getValue.mockResolvedValue({});

      await setCachedDecision(
        url,
        task,
        alwaysRemove,
        decision,
        null,
        reason,
        customTTL,
      );

      expect(
        mockStorage[StorageKey.DECISION_CACHE].setValue,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          "cache-key": expect.objectContaining({
            expiresAt: Date.now() + customTTL,
          }),
        }),
      );
    });
  });

  describe("removeCachedDecision", () => {
    it("should remove specific cache entry", async () => {
      const cacheKey = "cache-key-to-remove";
      const existingCache = {
        "cache-key-to-remove": {
          decision: "ALLOW" as const,
          reason: "Test reason",
          expiresAt: Date.now() + 100000,
        },
        "keep-this-key": {
          decision: "BLOCK_ALL" as const,
          reason: "Keep this",
          expiresAt: Date.now() + 100000,
        },
      };

      mockStorage[StorageKey.DECISION_CACHE].getValue.mockResolvedValue(
        existingCache,
      );

      await removeCachedDecision(cacheKey);

      expect(
        mockStorage[StorageKey.DECISION_CACHE].setValue,
      ).toHaveBeenCalledWith({
        "keep-this-key": existingCache["keep-this-key"],
      });
    });
  });

  describe("clearDecisionCache", () => {
    it("should clear all cache entries", async () => {
      await clearDecisionCache();

      expect(
        mockStorage[StorageKey.DECISION_CACHE].setValue,
      ).toHaveBeenCalledWith({});
    });
  });

  describe("cleanupExpiredCacheEntries", () => {
    it("should remove expired entries", async () => {
      const now = Date.now();
      const expiredEntry = {
        decision: "ALLOW" as const,
        reason: "Expired entry",
        expiresAt: now - 1000, // Expired
      };
      const validEntry = {
        decision: "BLOCK_ALL" as const,
        reason: "Valid entry",
        expiresAt: now + 100000, // Valid
      };

      mockStorage[StorageKey.DECISION_CACHE].getValue.mockResolvedValue({
        "expired-key": expiredEntry,
        "valid-key": validEntry,
      });

      await cleanupExpiredCacheEntries();

      expect(
        mockStorage[StorageKey.DECISION_CACHE].setValue,
      ).toHaveBeenCalledWith({
        "valid-key": validEntry,
      });
    });
  });

  describe("invalidateCacheForTaskChange", () => {
    it("should remove entries for old task", async () => {
      const oldTask = "old task";
      const newTask = "new task";
      const oldTaskEntry = {
        decision: "ALLOW" as const,
        reason: "Old task entry",
        expiresAt: Date.now() + 100000,
      };
      const newTaskEntry = {
        decision: "BLOCK_ALL" as const,
        reason: "New task entry",
        expiresAt: Date.now() + 100000,
      };
      const unrelatedEntry = {
        decision: "ALLOW" as const,
        reason: "Unrelated entry",
        expiresAt: Date.now() + 100000,
      };

      mockStorage[StorageKey.DECISION_CACHE].getValue.mockResolvedValue({
        "old-task-key": oldTaskEntry,
        "new-task-key": newTaskEntry,
        "unrelated-key": unrelatedEntry,
      });

      await invalidateCacheForTaskChange(oldTask, newTask);

      expect(
        mockStorage[StorageKey.DECISION_CACHE].setValue,
      ).toHaveBeenCalledWith({
        "new-task-key": newTaskEntry,
        "unrelated-key": unrelatedEntry,
      });
    });
  });

  describe("invalidateCacheForAlwaysRemoveChange", () => {
    it("should clear all cache entries", async () => {
      await invalidateCacheForAlwaysRemoveChange();

      expect(
        mockStorage[StorageKey.DECISION_CACHE].setValue,
      ).toHaveBeenCalledWith({});
    });
  });

  describe("getCacheStats", () => {
    it("should return correct statistics", async () => {
      const now = Date.now();
      const expiredEntry = {
        decision: "ALLOW" as const,
        reason: "Expired entry",
        expiresAt: now - 1000, // Expired
      };
      const validEntry = {
        decision: "BLOCK_ALL" as const,
        reason: "Valid entry",
        expiresAt: now + 100000, // Valid
      };

      mockStorage[StorageKey.DECISION_CACHE].getValue.mockResolvedValue({
        "expired-key": expiredEntry,
        "valid-key": validEntry,
      });

      const stats = await getCacheStats();

      expect(stats).toEqual({
        totalEntries: 2,
        expiredEntries: 1,
      });
    });
  });
});
