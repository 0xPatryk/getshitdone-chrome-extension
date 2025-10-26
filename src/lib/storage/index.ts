/**
 * Storage Module
 *
 * This module provides a comprehensive storage abstraction layer for the focus extension.
 * It handles persistent storage of user preferences, cache data, chat sessions, and
 * access grants using WXT's storage system with type safety and React hooks.
 *
 * Key features:
 * - Type-safe storage keys and values
 * - React hooks for reactive storage
 * - Access grant management
 * - Environment variable initialization
 * - Storage utility functions
 *
 * @module storage
 */

// Re-export storage types
export { StorageKey, type StorageKeyType } from "./types";

// Re-export storage services
export { storage, useStorage, type Value } from "./services";

// Re-export everything from the grants domain
export { type AccessGrant, AccessGrantSchema } from "../grants";

// Re-export cache functions for convenience
export {
  getCachedDecision,
  setCachedDecision,
  removeCachedDecision,
  clearDecisionCache,
  cleanupExpiredCacheEntries,
  invalidateCacheForTaskChange,
  invalidateCacheForAlwaysRemoveChange,
  getCacheStats,
  generateCacheKey,
} from "../cache";

// Re-export storage utility functions
export { getStorage, getStorageValue, setStorageValue } from "./utils";
