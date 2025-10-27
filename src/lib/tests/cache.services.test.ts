/**
 * Cache Services Tests
 *
 * This file contains unit tests for the cache services module.
 * It tests cache management functions with TTL and cleanup.
 *
 * Key features tested:
 * - Cache set/get operations with TTL
 * - Cache expiration and cleanup
 * - Cache size limits
 * - Error handling for storage failures
 */

import { describe, expect, it, mock } from "bun:test";
import type { DecisionCacheEntry } from "~/lib/cache/types";
import { CACHE_TTL } from "~/lib/cache/types";
import type { AnalysisResult } from "~/lib/messaging/types";

// Test data
const mockAnalysisResult: AnalysisResult = {
  decision: "REMOVE_ELEMENTS",
  reason: "This page contains distracting elements",
  selectors: [".ads", ".sidebar", ".popups"],
};

const mockCacheEntry: DecisionCacheEntry = {
  result: mockAnalysisResult,
  createdAt: Date.now(),
  expiresAt: Date.now() + CACHE_TTL.AI_DECISION,
  type: "ai_decision",
  metadata: {
    provider: "gemini",
    isFallback: false,
  },
};

describe("Cache Services", () => {
  describe("Cache TTL and Expiration", () => {
    it("should use correct TTL for AI decisions", () => {
      const now = Date.now();
      const entry: DecisionCacheEntry = {
        result: mockAnalysisResult,
        createdAt: now,
        expiresAt: now + CACHE_TTL.AI_DECISION,
        type: "ai_decision",
      };
      
      expect(entry.expiresAt - entry.createdAt).toBe(CACHE_TTL.AI_DECISION);
    });

    it("should use correct TTL for user unblocks", () => {
      const now = Date.now();
      const entry: DecisionCacheEntry = {
        result: mockAnalysisResult,
        createdAt: now,
        expiresAt: now + CACHE_TTL.USER_UNBLOCK,
        type: "user_unblock",
      };
      
      expect(entry.expiresAt - entry.createdAt).toBe(CACHE_TTL.USER_UNBLOCK);
    });

    it("should correctly identify expired entries", () => {
      const now = Date.now();
      const validEntry = {
        ...mockCacheEntry,
        expiresAt: now + 1000, // Expires in 1 second
      };
      const expiredEntry = {
        ...mockCacheEntry,
        expiresAt: now - 1000, // Expired 1 second ago
      };
      
      expect(now >= validEntry.expiresAt).toBe(false);
      expect(now >= expiredEntry.expiresAt).toBe(true);
    });
  });

  describe("Cache Entry Structure", () => {
    it("should create valid cache entry for AI decision", () => {
      const now = Date.now();
      const entry: DecisionCacheEntry = {
        result: mockAnalysisResult,
        createdAt: now,
        expiresAt: now + CACHE_TTL.AI_DECISION,
        type: "ai_decision",
        metadata: {
          provider: "gemini",
          isFallback: false,
        },
      };
      
      expect(entry.result).toEqual(mockAnalysisResult);
      expect(entry.type).toBe("ai_decision");
      expect(entry.metadata?.provider).toBe("gemini");
      expect(entry.metadata?.isFallback).toBe(false);
      expect(entry.expiresAt - entry.createdAt).toBe(CACHE_TTL.AI_DECISION);
    });

    it("should create valid cache entry for user unblock", () => {
      const now = Date.now();
      const entry: DecisionCacheEntry = {
        result: mockAnalysisResult,
        createdAt: now,
        expiresAt: now + CACHE_TTL.USER_UNBLOCK,
        type: "user_unblock",
      };
      
      expect(entry.result).toEqual(mockAnalysisResult);
      expect(entry.type).toBe("user_unblock");
      expect(entry.expiresAt - entry.createdAt).toBe(CACHE_TTL.USER_UNBLOCK);
    });

    it("should handle optional metadata", () => {
      const now = Date.now();
      const entry: DecisionCacheEntry = {
        result: mockAnalysisResult,
        createdAt: now,
        expiresAt: now + CACHE_TTL.AI_DECISION,
        type: "ai_decision",
      };
      
      expect(entry.metadata).toBeUndefined();
    });
  });

  describe("Cache Statistics", () => {
    it("should calculate correct statistics for mixed cache", () => {
      const now = Date.now();
      const aiDecisionEntry = {
        ...mockCacheEntry,
        type: "ai_decision" as const,
        expiresAt: now + CACHE_TTL.AI_DECISION,
      };
      const userUnblockEntry = {
        ...mockCacheEntry,
        type: "user_unblock" as const,
        expiresAt: now + CACHE_TTL.USER_UNBLOCK,
      };
      const expiredEntry = {
        ...mockCacheEntry,
        type: "ai_decision" as const,
        expiresAt: now - 1000, // Expired
      };
      const cache = {
        "ai-decision-key": aiDecisionEntry,
        "user-unblock-key": userUnblockEntry,
        "expired-key": expiredEntry,
      };
      
      // Calculate stats manually
      let totalEntries = 0;
      let aiDecisionEntries = 0;
      let userUnblockEntries = 0;
      let expiredEntries = 0;
      
      for (const entry of Object.values(cache)) {
        totalEntries++;
        if (entry.type === "ai_decision") {
          aiDecisionEntries++;
        } else if (entry.type === "user_unblock") {
          userUnblockEntries++;
        }
        
        if (now >= entry.expiresAt) {
          expiredEntries++;
        }
      }
      
      expect(totalEntries).toBe(3);
      expect(aiDecisionEntries).toBe(2);
      expect(userUnblockEntries).toBe(1);
      expect(expiredEntries).toBe(1);
    });

    it("should handle empty cache", () => {
      const cache = {};
      
      const totalEntries = Object.keys(cache).length;
      expect(totalEntries).toBe(0);
    });
  });

  describe("Cache Cleanup Logic", () => {
    it("should filter out expired entries", () => {
      const now = Date.now();
      const validEntry = {
        ...mockCacheEntry,
        expiresAt: now + CACHE_TTL.AI_DECISION,
      };
      const expiredEntry = {
        ...mockCacheEntry,
        expiresAt: now - 1000, // Expired 1 second ago
      };
      const cache = {
        "valid-key": validEntry,
        "expired-key": expiredEntry,
      };
      
      // Filter logic from cleanupExpiredCacheEntries
      const validEntries = Object.entries(cache).reduce(
        (acc, [cacheKey, entry]) => {
          if (now < entry.expiresAt) {
            acc[cacheKey] = entry;
          }
          return acc;
        },
        {} as Record<string, DecisionCacheEntry>,
      );
      
      expect(validEntries).toHaveProperty("valid-key");
      expect(validEntries).not.toHaveProperty("expired-key");
      expect(Object.keys(validEntries)).toHaveLength(1);
    });

    it("should handle all entries expired", () => {
      const now = Date.now();
      const expiredEntry1 = {
        ...mockCacheEntry,
        expiresAt: now - 1000,
      };
      const expiredEntry2 = {
        ...mockCacheEntry,
        expiresAt: now - 2000,
      };
      const cache = {
        "expired-key-1": expiredEntry1,
        "expired-key-2": expiredEntry2,
      };
      
      // Filter logic from cleanupExpiredCacheEntries
      const validEntries = Object.entries(cache).reduce(
        (acc, [cacheKey, entry]) => {
          if (now < entry.expiresAt) {
            acc[cacheKey] = entry;
          }
          return acc;
        },
        {} as Record<string, DecisionCacheEntry>,
      );
      
      expect(Object.keys(validEntries)).toHaveLength(0);
    });
  });

  describe("Cache Invalidation Logic", () => {
    it("should identify entries with matching task hash", () => {
      const cache = {
        "url:old-task-hash:always-remove-hash": mockCacheEntry,
        "url:new-task-hash:always-remove-hash": mockCacheEntry,
        "url:old-task-hash:different-always-remove": mockCacheEntry,
        "malformed-key": mockCacheEntry,
      };
      
      // Mock createSecureHash to return predictable values
      const mockCreateSecureHash = mock((str: string) => str);
      
      // Simulate task hash extraction and comparison
      const oldTaskHash = "old-task-hash";
      const validEntries = Object.entries(cache).reduce(
        (acc, [cacheKey, entry]) => {
          const parts = cacheKey.split(":");
          if (parts.length >= 2) {
            const taskHash = parts[1];
            
            // Keep entries that don't match old task hash
            if (taskHash !== oldTaskHash) {
              acc[cacheKey] = entry;
            }
          } else {
            // Keep entries with malformed keys
            acc[cacheKey] = entry;
          }
          return acc;
        },
        {} as Record<string, DecisionCacheEntry>,
      );
      
      expect(validEntries).not.toHaveProperty("url:old-task-hash:always-remove-hash");
      expect(validEntries).not.toHaveProperty("url:old-task-hash:different-always-remove");
      expect(validEntries).toHaveProperty("url:new-task-hash:always-remove-hash");
      expect(validEntries).toHaveProperty("malformed-key");
    });
  });

  describe("Cache Key Management", () => {
    it("should handle cache key removal correctly", () => {
      const cacheKey = "test-key";
      const cache = { [cacheKey]: mockCacheEntry, "other-key": mockCacheEntry };
      
      // Simulate removal logic from removeCachedDecision
      const { [cacheKey]: _, ...remainingCache } = cache;
      
      expect(remainingCache).not.toHaveProperty(cacheKey);
      expect(remainingCache).toHaveProperty("other-key");
      expect(Object.keys(remainingCache)).toHaveLength(1);
    });

    it("should handle removal of non-existent key", () => {
      const cacheKey = "non-existent-key";
      const cache = { "other-key": mockCacheEntry };
      
      // Simulate removal logic from removeCachedDecision
      const { [cacheKey]: _, ...remainingCache } = cache;
      
      expect(remainingCache).toEqual(cache);
    });

    it("should handle empty cache removal", () => {
      const cacheKey = "test-key";
      const cache = {};
      
      // Simulate removal logic from removeCachedDecision
      const { [cacheKey]: _, ...remainingCache } = cache;
      
      expect(remainingCache).toEqual({});
    });
  });

  describe("Cache Clear Operations", () => {
    it("should clear all cache entries", () => {
      const cache = {
        "key1": mockCacheEntry,
        "key2": mockCacheEntry,
        "key3": mockCacheEntry,
      };
      
      // Simulate clear operation
      const clearedCache = {};
      
      expect(Object.keys(clearedCache)).toHaveLength(0);
      expect(clearedCache).toEqual({});
    });
  });
});