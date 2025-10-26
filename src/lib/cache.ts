/**
 * Cache Module
 *
 * This module provides caching functionality for AI analysis results to improve performance
 * and reduce API costs. It implements a secure, time-based cache with automatic cleanup
 * and invalidation strategies.
 *
 * Key features:
 * - Secure hash-based cache keys
 * - Time-to-live (TTL) based expiration
 * - Automatic cleanup of expired entries
 * - Cache invalidation on task changes
 * - Statistics and monitoring
 *
 * @module cache
 */

import { sha256 } from "@noble/hashes/sha2.js";
import { bytesToHex } from "@noble/hashes/utils.js";
import type { DecisionCacheEntry } from "~/lib/cache.types";
import { CACHE_TTL } from "~/lib/cache.types";
import type { AnalysisResult } from "~/lib/messaging";
import { StorageKey, getStorageValue, setStorageValue } from "~/lib/storage";

/**
 * Creates a secure hash for cache keys using SHA-256.
 * Uses the first 16 characters of the hex-encoded hash for compactness.
 *
 * @param str - The input string to hash
 * @returns A 16-character hexadecimal hash
 *
 * @example
 * ```typescript
 * const hash = createSecureHash("https://example.com:write report:null");
 * console.log(hash); // "a1b2c3d4e5f6g7h8"
 * ```
 */
const createSecureHash = (str: string): string => {
  const hash = sha256(new TextEncoder().encode(str));
  return bytesToHex(hash).substring(0, 16);
};

/**
 * Generates a unique cache key based on URL, task, and always-remove settings.
 * Combines the parameters and creates a secure hash for consistent lookup.
 *
 * @param url - The URL of the page being cached
 * @param task - The current user task
 * @param alwaysRemove - The always-remove CSS selector configuration
 * @returns A unique cache key for the combination of parameters
 *
 * @example
 * ```typescript
 * const key = generateCacheKey(
 *   "https://example.com",
 *   "Write research paper",
 *   ".ads,.sidebar"
 * );
 * ```
 */
export const generateCacheKey = (
  url: string,
  task: string,
  alwaysRemove: string | null,
): string => {
  const content = `${url}:${task}:${alwaysRemove}`;
  const key = createSecureHash(content);

  return key;
};

// Cache lookup function
export const getCachedDecision = async (
  url: string,
  task: string,
  alwaysRemove: string | null,
): Promise<AnalysisResult | null> => {
  const cacheKey = generateCacheKey(url, task, alwaysRemove);
  const cache = await getStorageValue(StorageKey.DECISION_CACHE);

  const entry = cache[cacheKey];
  if (!entry) {
    return null;
  }

  // Check if entry has expired
  if (Date.now() >= entry.expiresAt) {
    // Remove expired entry
    await removeCachedDecision(cacheKey);
    return null;
  }

  return entry.result;
};

// Cache storage function
export const setCachedDecision = async (
  url: string,
  task: string,
  alwaysRemove: string | null,
  result: AnalysisResult,
  type: "ai_decision" | "user_unblock" = "ai_decision",
  provider?: "gemini" | "openai",
  isFallback?: boolean,
): Promise<void> => {
  const cacheKey = generateCacheKey(url, task, alwaysRemove);
  const cache = await getStorageValue(StorageKey.DECISION_CACHE);

  const now = Date.now();
  let expiresAt: number;

  if (type === "ai_decision") {
    expiresAt = now + CACHE_TTL.AI_DECISION;
  } else {
    // For user unblocks, use a shorter TTL (1 hour minimum)
    expiresAt = now + CACHE_TTL.USER_UNBLOCK;
  }

  const entry: DecisionCacheEntry = {
    result,
    createdAt: now,
    expiresAt,
    type,
    metadata: {
      provider,
      isFallback,
    },
  };

  await setStorageValue(StorageKey.DECISION_CACHE, {
    ...cache,
    [cacheKey]: entry,
  });
};

// Remove specific cache entry
export const removeCachedDecision = async (cacheKey: string): Promise<void> => {
  const cache = await getStorageValue(StorageKey.DECISION_CACHE);
  const { [cacheKey]: _, ...remainingCache } = cache;
  await setStorageValue(StorageKey.DECISION_CACHE, remainingCache);
};

// Clear all cache entries
export const clearDecisionCache = async (): Promise<void> => {
  await setStorageValue(StorageKey.DECISION_CACHE, {});
};

// Clean up expired cache entries
export const cleanupExpiredCacheEntries = async (): Promise<void> => {
  const cache = await getStorageValue(StorageKey.DECISION_CACHE);
  const now = Date.now();

  const validEntries = Object.entries(cache).reduce(
    (acc, [cacheKey, entry]) => {
      if (now < entry.expiresAt) {
        acc[cacheKey] = entry;
      }
      return acc;
    },
    {} as Record<string, DecisionCacheEntry>,
  );

  await setStorageValue(StorageKey.DECISION_CACHE, validEntries);

  // Update last cleanup timestamp
  await setStorageValue(StorageKey.CACHE_LAST_CLEANUP, now);
};

// Invalidate cache entries when the current task changes
export const invalidateCacheForTaskChange = async (
  oldTask: string,
  newTask: string,
): Promise<void> => {
  const cache = await getStorageValue(StorageKey.DECISION_CACHE);
  const oldTaskHash = createSecureHash(oldTask);

  const validEntries = Object.entries(cache).reduce(
    (acc, [cacheKey, entry]) => {
      // Extract task hash from cache key
      const parts = cacheKey.split(":");
      if (parts.length >= 2) {
        const taskHash = parts[1];

        // Keep entries that don't match the old task hash
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

  await setStorageValue(StorageKey.DECISION_CACHE, validEntries);
};

// Invalidate cache entries when alwaysRemove settings change
export const invalidateCacheForAlwaysRemoveChange = async (): Promise<void> => {
  await setStorageValue(StorageKey.DECISION_CACHE, {});
};

// Get cache statistics
export const getCacheStats = async (): Promise<{
  totalEntries: number;
  aiDecisionEntries: number;
  userUnblockEntries: number;
  expiredEntries: number;
}> => {
  const cache = await getStorageValue(StorageKey.DECISION_CACHE);
  const now = Date.now();

  let aiDecisionEntries = 0;
  let userUnblockEntries = 0;
  let expiredEntries = 0;

  for (const entry of Object.values(cache)) {
    if (entry.type === "ai_decision") {
      aiDecisionEntries++;
    } else if (entry.type === "user_unblock") {
      userUnblockEntries++;
    }

    if (now >= entry.expiresAt) {
      expiredEntries++;
    }
  }

  return {
    totalEntries: Object.keys(cache).length,
    aiDecisionEntries,
    userUnblockEntries,
    expiredEntries,
  };
};
