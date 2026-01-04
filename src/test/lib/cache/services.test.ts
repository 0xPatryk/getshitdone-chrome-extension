/**
 * Cache Services Unit Tests
 *
 * Tests for cache storage operations including get, set, remove, cleanup and invalidation.
 * Uses WXT's fakeBrowser for in-memory storage simulation.
 *
 * @module cache/services.test
 */

import { beforeEach, describe, expect, it } from "bun:test";
import { fakeBrowser } from "wxt/testing/fake-browser";
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
import { CACHE_TTL } from "~/lib/cache/types";
import { generateCacheKey } from "~/lib/cache/utils";
import { storage } from "~/lib/storage/services";
import { StorageKey } from "~/lib/storage/types";

describe("Cache Services", () => {
  beforeEach(async () => {
    // Reset fakeBrowser state between tests
    fakeBrowser.reset();
    // Explicitly remove cache keys to ensure no pollution
    await storage[StorageKey.DECISION_CACHE].removeValue();
    await storage[StorageKey.CACHE_LAST_CLEANUP].removeValue();
    await storage[StorageKey.ALWAYS_REMOVE].removeValue();
  });

  describe("getCachedDecision", () => {
    it("should return null when cache is empty", async () => {
      const result = await getCachedDecision(
        "https://example.com",
        "write report",
        null,
      );
      expect(result).toBeNull();
    });

    it("should return cached decision when it exists and is not expired", async () => {
      const url = "https://example.com";
      const task = "write report";
      const decision = "ALLOW";
      const reason = "Content is relevant";

      // Set a cache entry
      await setCachedDecision(url, task, null, decision, null, reason);

      // Retrieve it
      const result = await getCachedDecision(url, task, null);

      expect(result).not.toBeNull();
      expect(result?.decision).toBe(decision);
      expect(result?.reason).toBe(reason);
    });

    it("should return null and remove expired entries", async () => {
      const url = "https://example.com";
      const task = "task";
      const cacheKey = generateCacheKey(url, task, null);

      // Manually set an expired entry
      const expiredEntry = {
        decision: "ALLOW" as const,
        reason: "test",
        expiresAt: Date.now() - 1000, // Already expired
      };

      await storage[StorageKey.DECISION_CACHE].setValue({
        [cacheKey]: expiredEntry,
      });

      // Should return null for expired entry
      const result = await getCachedDecision(url, task, null);
      expect(result).toBeNull();

      // Entry should be removed
      const cache = await storage[StorageKey.DECISION_CACHE].getValue();
      expect(cache?.[cacheKey]).toBeUndefined();
    });

    it("should differentiate between different URLs", async () => {
      await setCachedDecision(
        "https://site-a.com",
        "task",
        null,
        "ALLOW",
        null,
        "Allowed",
      );
      await setCachedDecision(
        "https://site-b.com",
        "task",
        null,
        "BLOCK_ALL",
        null,
        "Blocked",
      );

      const resultA = await getCachedDecision(
        "https://site-a.com",
        "task",
        null,
      );
      const resultB = await getCachedDecision(
        "https://site-b.com",
        "task",
        null,
      );

      expect(resultA?.decision).toBe("ALLOW");
      expect(resultB?.decision).toBe("BLOCK_ALL");
    });

    it("should differentiate between different tasks", async () => {
      const url = "https://example.com";

      await setCachedDecision(url, "task-1", null, "ALLOW", null, "Reason 1");
      await setCachedDecision(
        url,
        "task-2",
        null,
        "BLOCK_ALL",
        null,
        "Reason 2",
      );

      const result1 = await getCachedDecision(url, "task-1", null);
      const result2 = await getCachedDecision(url, "task-2", null);

      expect(result1?.decision).toBe("ALLOW");
      expect(result2?.decision).toBe("BLOCK_ALL");
    });
  });

  describe("setCachedDecision", () => {
    it("should store decision with correct structure", async () => {
      const url = "https://example.com";
      const task = "task";
      const decision = "BLOCK_ALL" as const;
      const selectors = [".ads", ".sidebar"];
      const reason = "Distracting content";

      await setCachedDecision(url, task, null, decision, selectors, reason);

      const result = await getCachedDecision(url, task, null);

      expect(result?.decision).toBe(decision);
      expect(result?.selectors).toEqual(selectors);
      expect(result?.reason).toBe(reason);
      expect(result?.expiresAt).toBeGreaterThan(Date.now());
    });

    it("should use default TTL when not specified", async () => {
      const now = Date.now();
      await setCachedDecision(
        "https://example.com",
        "task",
        null,
        "ALLOW",
        null,
        "reason",
      );

      const result = await getCachedDecision(
        "https://example.com",
        "task",
        null,
      );

      // Should expire around default TTL from now
      expect(result?.expiresAt).toBeGreaterThanOrEqual(
        now + CACHE_TTL.DEFAULT - 1000,
      );
      expect(result?.expiresAt).toBeLessThanOrEqual(
        now + CACHE_TTL.DEFAULT + 1000,
      );
    });

    it("should use custom TTL when specified", async () => {
      const customTTL = 5 * 60 * 1000; // 5 minutes
      const now = Date.now();

      await setCachedDecision(
        "https://example.com",
        "task",
        null,
        "ALLOW",
        null,
        "reason",
        customTTL,
      );

      const result = await getCachedDecision(
        "https://example.com",
        "task",
        null,
      );

      expect(result?.expiresAt).toBeGreaterThanOrEqual(now + customTTL - 1000);
      expect(result?.expiresAt).toBeLessThanOrEqual(now + customTTL + 1000);
    });

    it("should handle null selectors", async () => {
      await setCachedDecision(
        "https://example.com",
        "task",
        null,
        "ALLOW",
        null,
        "reason",
      );

      const result = await getCachedDecision(
        "https://example.com",
        "task",
        null,
      );

      expect(result?.selectors).toBeUndefined();
    });

    it("should update existing entry", async () => {
      const url = "https://example.com";
      const task = "task";

      await setCachedDecision(url, task, null, "BLOCK_ALL", null, "First");
      await setCachedDecision(url, task, null, "ALLOW", null, "Second");

      const result = await getCachedDecision(url, task, null);

      expect(result?.decision).toBe("ALLOW");
      expect(result?.reason).toBe("Second");
    });
  });

  describe("removeCachedDecision", () => {
    it("should remove specific cache entry", async () => {
      const url = "https://example.com";
      const task = "task";
      const cacheKey = generateCacheKey(url, task, null);

      await setCachedDecision(url, task, null, "ALLOW", null, "reason");

      // Verify it exists
      let result = await getCachedDecision(url, task, null);
      expect(result).not.toBeNull();

      // Remove it
      await removeCachedDecision(cacheKey);

      // Verify it's gone
      result = await getCachedDecision(url, task, null);
      expect(result).toBeNull();
    });

    it("should not affect other entries", async () => {
      await setCachedDecision(
        "https://a.com",
        "task",
        null,
        "ALLOW",
        null,
        "A",
      );
      await setCachedDecision(
        "https://b.com",
        "task",
        null,
        "BLOCK_ALL",
        null,
        "B",
      );

      const cacheKeyA = generateCacheKey("https://a.com", "task", null);
      await removeCachedDecision(cacheKeyA);

      // A should be gone
      const resultA = await getCachedDecision("https://a.com", "task", null);
      expect(resultA).toBeNull();

      // B should still exist
      const resultB = await getCachedDecision("https://b.com", "task", null);
      expect(resultB?.decision).toBe("BLOCK_ALL");
    });

    it("should handle removing non-existent key gracefully", async () => {
      // Should not throw
      await expect(
        removeCachedDecision("non-existent-key"),
      ).resolves.toBeUndefined();
    });
  });

  describe("clearDecisionCache", () => {
    it("should remove all cache entries", async () => {
      await setCachedDecision(
        "https://a.com",
        "task",
        null,
        "ALLOW",
        null,
        "A",
      );
      await setCachedDecision(
        "https://b.com",
        "task",
        null,
        "BLOCK_ALL",
        null,
        "B",
      );
      await setCachedDecision(
        "https://c.com",
        "task",
        null,
        "ALLOW",
        null,
        "C",
      );

      await clearDecisionCache();

      const stats = await getCacheStats();
      expect(stats.totalEntries).toBe(0);
    });

    it("should handle empty cache gracefully", async () => {
      await expect(clearDecisionCache()).resolves.toBeUndefined();
    });
  });

  describe("cleanupExpiredCacheEntries", () => {
    it("should remove only expired entries", async () => {
      const now = Date.now();

      // Set one valid and one expired entry directly
      const validKey = generateCacheKey("https://valid.com", "task", null);
      const expiredKey = generateCacheKey("https://expired.com", "task", null);

      await storage[StorageKey.DECISION_CACHE].setValue({
        [validKey]: {
          decision: "ALLOW",
          reason: "valid",
          expiresAt: now + 3600000, // 1 hour from now
        },
        [expiredKey]: {
          decision: "BLOCK_ALL",
          reason: "expired",
          expiresAt: now - 1000, // Already expired
        },
      });

      await cleanupExpiredCacheEntries();

      const cache = (await storage[
        StorageKey.DECISION_CACHE
      ].getValue()) as Record<string, unknown>;
      expect(cache[validKey]).toBeDefined();
      expect(cache[expiredKey]).toBeUndefined();
    });

    it("should update last cleanup timestamp", async () => {
      const before = Date.now();
      await cleanupExpiredCacheEntries();
      const after = Date.now();

      const lastCleanup =
        await storage[StorageKey.CACHE_LAST_CLEANUP].getValue();
      expect(lastCleanup).toBeGreaterThanOrEqual(before);
      expect(lastCleanup).toBeLessThanOrEqual(after);
    });
  });

  describe("invalidateCacheForTaskChange", () => {
    it("should remove entries matching old task", async () => {
      const url = "https://example.com";
      const oldTask = "old task";
      const newTask = "new task";

      await setCachedDecision(url, oldTask, null, "BLOCK_ALL", null, "old");

      await invalidateCacheForTaskChange(oldTask, newTask);

      const result = await getCachedDecision(url, oldTask, null);
      expect(result).toBeNull();
    });

    it("should preserve entries for different tasks", async () => {
      const url = "https://example.com";

      await setCachedDecision(url, "task-a", null, "ALLOW", null, "A");
      await setCachedDecision(url, "task-b", null, "BLOCK_ALL", null, "B");

      await invalidateCacheForTaskChange("task-a", "task-c");

      // task-a should be gone
      const resultA = await getCachedDecision(url, "task-a", null);
      expect(resultA).toBeNull();

      // task-b should still exist
      const resultB = await getCachedDecision(url, "task-b", null);
      expect(resultB?.decision).toBe("BLOCK_ALL");
    });
  });

  describe("invalidateCacheForAlwaysRemoveChange", () => {
    it("should clear all cache entries", async () => {
      await setCachedDecision(
        "https://a.com",
        "task",
        ".ads",
        "ALLOW",
        null,
        "A",
      );
      await setCachedDecision(
        "https://b.com",
        "task",
        ".sidebar",
        "BLOCK_ALL",
        null,
        "B",
      );

      await invalidateCacheForAlwaysRemoveChange();

      const stats = await getCacheStats();
      expect(stats.totalEntries).toBe(0);
    });
  });

  describe("getCacheStats", () => {
    it("should return correct stats for empty cache", async () => {
      const stats = await getCacheStats();
      expect(stats.totalEntries).toBe(0);
      expect(stats.expiredEntries).toBe(0);
    });

    it("should count total entries", async () => {
      await setCachedDecision(
        "https://a.com",
        "task",
        null,
        "ALLOW",
        null,
        "A",
      );
      await setCachedDecision(
        "https://b.com",
        "task",
        null,
        "BLOCK_ALL",
        null,
        "B",
      );

      const stats = await getCacheStats();
      expect(stats.totalEntries).toBe(2);
    });

    it("should count expired entries", async () => {
      const now = Date.now();
      const validKey = generateCacheKey("https://valid.com", "task", null);
      const expiredKey = generateCacheKey("https://expired.com", "task", null);

      await storage[StorageKey.DECISION_CACHE].setValue({
        [validKey]: {
          decision: "ALLOW",
          reason: "valid",
          expiresAt: now + 3600000,
        },
        [expiredKey]: {
          decision: "BLOCK_ALL",
          reason: "expired",
          expiresAt: now - 1000,
        },
      });

      const stats = await getCacheStats();
      expect(stats.totalEntries).toBe(2);
      expect(stats.expiredEntries).toBe(1);
    });
  });
});
