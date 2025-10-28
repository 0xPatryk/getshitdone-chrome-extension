/**
 * Cache Module
 *
 * This module provides caching functionality for page decisions to improve performance
 * and reduce API costs. It implements a secure, time-based cache with automatic cleanup
 * and unified decision storage.
 *
 * Key features:
 * - Cache structure with unified decision storage
 * - Secure hash-based cache keys
 * - Time-to-live (TTL) based expiration
 * - Automatic cleanup of expired entries
 * - Cache invalidation on task changes
 *
 * @module cache
 */

// Re-export types
export type { AnalysisResultCache, CacheKeyData } from "./types";
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

// Re-export hooks
export {
  useCachedDecision,
  usePageAnalysis,
  useChatAccess,
  useCacheInvalidation,
} from "./hooks";