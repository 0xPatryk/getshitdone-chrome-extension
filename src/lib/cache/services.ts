/**
 * Cache Services Module
 *
 * This module provides cache service functions for storing, retrieving,
 * and managing cached page decisions. It implements a secure, time-based
 * cache with automatic cleanup and unified decision storage.
 *
 * Key features:
 * - Cache structure with unified decision storage
 * - Time-to-live (TTL) based expiration
 * - Automatic cleanup of expired entries
 * - Cache invalidation on task changes
 *
 * @module cache.services
 */

import type { AnalysisResultCache } from "~/lib/cache/types";
import { CACHE_TTL } from "~/lib/cache/types";
import { createSecureHash, generateCacheKey } from "~/lib/cache/utils";
import { storage } from "~/lib/storage/services";
import { StorageKey } from "~/lib/storage/types";

/**
 * Get cached decision for a page
 */
export const getCachedDecision = async (
  url: string,
  task: string,
  alwaysRemove: string | null,
): Promise<AnalysisResultCache | null> => {
  const cacheKey = generateCacheKey(url, task, alwaysRemove);
  const cache = (await storage[StorageKey.DECISION_CACHE].getValue()) as Record<
    string,
    AnalysisResultCache
  >;

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

  return entry;
};

/**
 * Set cached decision for a page
 */
export const setCachedDecision = async (
  url: string,
  task: string,
  alwaysRemove: string | null,
  decision: "BLOCK_ALL" | "REMOVE_ELEMENTS" | "ALLOW",
  selectors: string[] | null,
  reason: string,
  customTTL?: number,
): Promise<void> => {
  const cacheKey = generateCacheKey(url, task, alwaysRemove);
  const cache = (await storage[StorageKey.DECISION_CACHE].getValue()) as Record<
    string,
    AnalysisResultCache
  >;

  const now = Date.now();
  const ttl = customTTL || CACHE_TTL.DEFAULT;

  const entry: AnalysisResultCache = {
    decision,
    reason,
    selectors: selectors || undefined,
    expiresAt: now + ttl,
  };

  await storage[StorageKey.DECISION_CACHE].setValue({
    ...cache,
    [cacheKey]: entry,
  });
};

/**
 * Remove specific cache entry
 */
export const removeCachedDecision = async (cacheKey: string): Promise<void> => {
  const cache = (await storage[StorageKey.DECISION_CACHE].getValue()) as Record<
    string,
    AnalysisResultCache
  >;
  const { [cacheKey]: _, ...remainingCache } = cache;
  await storage[StorageKey.DECISION_CACHE].setValue(remainingCache);
};

/**
 * Clear all cache entries
 */
export const clearDecisionCache = async (): Promise<void> => {
  await storage[StorageKey.DECISION_CACHE].setValue({});
};

/**
 * Clean up expired cache entries
 */
export const cleanupExpiredCacheEntries = async (): Promise<void> => {
  const cache = (await storage[StorageKey.DECISION_CACHE].getValue()) as Record<
    string,
    AnalysisResultCache
  >;
  const now = Date.now();

  const validEntries = Object.entries(cache).reduce(
    (acc, [cacheKey, entry]) => {
      if (now < entry.expiresAt) {
        acc[cacheKey] = entry;
      }
      return acc;
    },
    {} as Record<string, AnalysisResultCache>,
  );

  await storage[StorageKey.DECISION_CACHE].setValue(validEntries);

  // Update last cleanup timestamp
  await storage[StorageKey.CACHE_LAST_CLEANUP].setValue(now);
};

/**
 * Invalidate cache entries when current task changes
 */
export const invalidateCacheForTaskChange = async (
  oldTask: string,
  newTask: string,
): Promise<void> => {
  const cache = (await storage[StorageKey.DECISION_CACHE].getValue()) as Record<
    string,
    AnalysisResultCache
  >;
  const oldTaskHash = createSecureHash(oldTask);

  const validEntries = Object.entries(cache).reduce(
    (acc, [cacheKey, entry]) => {
      // Extract task hash from cache key
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
    {} as Record<string, AnalysisResultCache>,
  );

  await storage[StorageKey.DECISION_CACHE].setValue(validEntries);
};

/**
 * Invalidate cache entries when alwaysRemove settings change
 */
export const invalidateCacheForAlwaysRemoveChange = async (): Promise<void> => {
  await storage[StorageKey.DECISION_CACHE].setValue({});
};

/**
 * Get cache statistics
 */
export const getCacheStats = async (): Promise<{
  totalEntries: number;
  expiredEntries: number;
}> => {
  const cache = (await storage[StorageKey.DECISION_CACHE].getValue()) as Record<
    string,
    AnalysisResultCache
  >;
  const now = Date.now();

  let expiredEntries = 0;

  for (const entry of Object.values(cache)) {
    if (now >= entry.expiresAt) {
      expiredEntries++;
    }
  }

  return {
    totalEntries: Object.keys(cache).length,
    expiredEntries,
  };
};
