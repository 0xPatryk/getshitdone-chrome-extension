/**
 * Storage Types
 *
 * This module contains type definitions for the storage domain.
 * It includes storage key constants and value types.
 *
 * @module storage/types
 */

/**
 * Storage key constants for all persistent data in the extension.
 * Each key follows the "local:" prefix convention for WXT storage.
 *
 * @constant
 */
export const StorageKey = {
  /**
   * User's preferred theme (light, dark, or system)
   */
  THEME: "local:theme",

  /**
   * API key for Google Gemini AI service
   */
  GEMINI_API_KEY: "local:geminiApiKey",

  /**
   * API key for OpenAI service
   */
  OPENAI_API_KEY: "local:openaiApiKey",

  /**
   * Selected AI provider (gemini or openai)
   */
  AI_PROVIDER: "local:aiProvider",

  /**
   * Current task the user is working on
   */
  CURRENT_TASK: "local:currentTask",

  /**
   * Whether the extension is currently enabled
   */
  EXTENSION_ENABLED: "local:extensionEnabled",

  /**
   * All chat sessions with their message history
   */
  CHAT_SESSIONS: "local:chatSessions",

  /**
   * ID of the currently active chat session
   */
  ACTIVE_CHAT_SESSION: "local:activeChatSession",

  /**
   * CSS selectors for elements to always remove
   */
  ALWAYS_REMOVE: "local:alwaysRemove",

  /**
   * Temporary access grants for specific URLs
   */
  ACCESS_GRANTS: "local:accessGrants",

  /**
   * Cache of AI analysis decisions
   */
  DECISION_CACHE: "local:decisionCache",

  /**
   * Timestamp of last cache cleanup
   */
  CACHE_LAST_CLEANUP: "local:cacheLastCleanup",
} as const;

/**
 * Union type of all possible storage keys
 */
export type StorageKeyType = (typeof StorageKey)[keyof typeof StorageKey];
