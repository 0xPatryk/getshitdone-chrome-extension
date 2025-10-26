import type { AnalysisResult } from "~/lib/messaging";

export interface DecisionCacheEntry {
  // The analysis result (decision, reason, selectors)
  result: AnalysisResult;

  // When this cache entry was created
  createdAt: number;

  // When this cache entry expires
  expiresAt: number;

  // Type of cache entry for different TTL handling
  type: "ai_decision" | "user_unblock";

  // Optional metadata
  metadata?: {
    // The AI provider used for the decision
    provider?: "gemini" | "openai";
    // Whether this was a fallback decision
    isFallback?: boolean;
  };
}

export interface CacheKeyData {
  url: string;
  taskHash: string;
  alwaysRemoveHash: string;
}

// Cache TTL values (in milliseconds)
export const CACHE_TTL = {
  AI_DECISION: 24 * 60 * 60 * 1000, // 24 hours
  USER_UNBLOCK: 60 * 60 * 1000, // 1 hour minimum for user unblocks
  CLEANUP_INTERVAL: 60 * 60 * 1000, // 1 hour
} as const;
