/**
 * Cache Types Module
 *
 * This module defines TypeScript interfaces and constants for the caching system.
 * It provides type safety for cache entries and configuration for time-to-live values.
 *
 * Key features:
 * - Type definitions for cache entries
 * - Cache key structure definitions
 * - TTL configuration constants
 * - Metadata schemas for cache entries
 *
 * @module cache.types
 */

import type { AnalysisResult } from "~/lib/messaging";

/**
 * Represents a cached decision entry with metadata and expiration information.
 * Each entry contains the analysis result, timestamps, and optional metadata about
 * how the decision was made.
 *
 * @interface DecisionCacheEntry
 */
export interface DecisionCacheEntry {
  /**
   * The analysis result containing the decision, reasoning, and CSS selectors
   */
  result: AnalysisResult;

  /**
   * Unix timestamp when this cache entry was created (in milliseconds)
   */
  createdAt: number;

  /**
   * Unix timestamp when this cache entry expires (in milliseconds)
   */
  expiresAt: number;

  /**
   * Type of cache entry which determines the TTL and invalidation behavior
   * - "ai_decision": Cache entries from AI analysis (24-hour TTL)
   * - "user_unblock": Cache entries from user manual unblocks (1-hour TTL)
   */
  type: "ai_decision" | "user_unblock";

  /**
   * Optional metadata about how the decision was made
   */
  metadata?: {
    /**
     * The AI provider that made this decision
     */
    provider?: "gemini" | "openai";
    
    /**
     * Whether this was a fallback decision due to AI service failure
     */
    isFallback?: boolean;
  };
}

/**
 * Represents the parsed components of a cache key.
 * This interface is used for debugging and cache analysis.
 *
 * @interface CacheKeyData
 */
export interface CacheKeyData {
  /**
   * The original URL that was cached
   */
  url: string;
  
  /**
   * Hash of the task context
   */
  taskHash: string;
  
  /**
   * Hash of the always-remove configuration
   */
  alwaysRemoveHash: string;
}

/**
 * Cache time-to-live (TTL) configuration values.
 * All values are in milliseconds.
 *
 * @constant
 * @example
 * ```typescript
 * // AI decisions are cached for 24 hours
 * const aiDecisionTTL = CACHE_TTL.AI_DECISION;
 *
 * // User unblocks are cached for 1 hour
 * const userUnblockTTL = CACHE_TTL.USER_UNBLOCK;
 * ```
 */
export const CACHE_TTL = {
  /**
   * TTL for AI-generated decisions (24 hours)
   * Longer TTL to reduce API costs for repeated analyses
   */
  AI_DECISION: 24 * 60 * 60 * 1000, // 24 hours
  
  /**
   * TTL for user manual unblocks (1 hour)
   * Shorter TTL to allow users to re-evaluate their decisions
   */
  USER_UNBLOCK: 60 * 60 * 1000, // 1 hour minimum for user unblocks
  
  /**
   * Interval for automatic cache cleanup (1 hour)
   * Determines how often expired entries should be removed
   */
  CLEANUP_INTERVAL: 60 * 60 * 1000, // 1 hour
} as const;
