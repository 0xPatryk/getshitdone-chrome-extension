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

// Re-export types
export type { DecisionCacheEntry, CacheKeyData } from "./types";
export { CACHE_TTL } from "./types";

// Re-export utilities
export { createSecureHash, generateCacheKey } from "./utils";

// Re-export services
export {
  getCachedDecision,
  setCachedDecision,
  removeCachedDecision,
  clearDecisionCache,
  cleanupExpiredCacheEntries,
  invalidateCacheForTaskChange,
  invalidateCacheForAlwaysRemoveChange,
  getCacheStats,
} from "./services";
