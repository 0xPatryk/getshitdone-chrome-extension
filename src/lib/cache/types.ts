/**
 * Cache Types Module
 *
 * This module defines TypeScript interfaces and constants for caching system.
 * It provides type safety for cache entries and configuration for time-to-live values.
 *
 * Key features:
 * - AnalysisResult-based cache structure
 * - Cache key structure definitions
 * - TTL configuration constants
 * - Unified decision storage
 *
 * @module cache.types
 */

import type { AnalysisResult } from "~/lib/messaging/types";

/**
 * Cache entry structure that extends AnalysisResult with TTL
 */
export interface AnalysisResultCache extends AnalysisResult {
  /** Unix timestamp when this cache entry expires (in milliseconds) */
  expiresAt: number;
}

/**
 * Represents the parsed components of a cache key.
 * This interface is used for debugging and cache analysis.
 */
export interface CacheKeyData {
  /** The original URL that was cached */
  url: string;
  
  /** The current user task */
  task: string;
  
  /** The always-remove configuration */
  alwaysRemove: string | null;
}

/**
 * Cache time-to-live (TTL) configuration values.
 * All values are in milliseconds.
 */
export const CACHE_TTL = {
  /** Default TTL for cache entries (1 week) */
  DEFAULT: 7 * 24 * 60 * 60 * 1000, // 1 week
  
  /** Interval for automatic cache cleanup (1 hour) */
  CLEANUP_INTERVAL: 60 * 60 * 1000, // 1 hour
} as const;