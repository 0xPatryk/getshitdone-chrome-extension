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

import { useEffect, useState } from "react";
import type { DecisionCacheEntry } from "~/lib/cache.types";
import type { ChatSession } from "~/lib/messaging";
import { Theme } from "~/types";
import { type WxtStorageItem, storage as browserStorage } from "#imports";

/**
 * Interface representing a temporary access grant for a specific URL.
 * Stores information about when access was granted and when it expires.
 *
 * @interface AccessGrant
 */
interface AccessGrant {
  /**
   * The URL that access was granted for
   */
  url: string;
  
  /**
   * Unix timestamp when the grant expires (in milliseconds)
   */
  expiresAt: number;
  
  /**
   * Unix timestamp when the grant was issued (in milliseconds)
   */
  grantedAt: number;
  
  /**
   * Duration of the grant in minutes
   */
  durationMinutes: number;
}

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
export type StorageKey = (typeof StorageKey)[keyof typeof StorageKey];

/**
 * Storage configuration object defining all storage items with their types,
 * fallback values, and initialization functions. Uses WXT's storage system
 * for persistent browser extension storage.
 *
 * @constant
 */
const storage = {
  /**
   * User theme preference with system default
   */
  [StorageKey.THEME]: browserStorage.defineItem<Theme>(StorageKey.THEME, {
    fallback: Theme.SYSTEM,
  }),
  
  /**
   * Gemini API key with environment variable initialization
   */
  [StorageKey.GEMINI_API_KEY]: browserStorage.defineItem<string | null>(
    StorageKey.GEMINI_API_KEY,
    {
      fallback: null,
      init: () => {
        const envValue = import.meta.env.VITE_GEMINI_API_KEY;
        if (envValue && envValue !== "" && envValue !== "your-gemini-key") {
          return envValue;
        }
        return null;
      },
    },
  ),
  
  /**
   * OpenAI API key with environment variable initialization
   */
  [StorageKey.OPENAI_API_KEY]: browserStorage.defineItem<string | null>(
    StorageKey.OPENAI_API_KEY,
    {
      fallback: null,
      init: () => {
        const envValue = import.meta.env.VITE_OPENAI_API_KEY;
        if (envValue && envValue !== "" && envValue !== "your-openai-key") {
          return envValue;
        }
        return null;
      },
    },
  ),
  
  /**
   * AI provider selection with environment variable initialization
   */
  [StorageKey.AI_PROVIDER]: browserStorage.defineItem<"gemini" | "openai">(
    StorageKey.AI_PROVIDER,
    {
      fallback: "gemini",
      init: () => {
        const envValue = import.meta.env.VITE_AI_PROVIDER;
        if (envValue && (envValue === "gemini" || envValue === "openai")) {
          return envValue;
        }
        return "gemini";
      },
    },
  ),
  
  /**
   * Current task with environment variable initialization
   */
  [StorageKey.CURRENT_TASK]: browserStorage.defineItem<string | null>(
    StorageKey.CURRENT_TASK,
    {
      fallback: null,
      init: () => {
        const envValue = import.meta.env.VITE_CURRENT_TASK;
        if (envValue && envValue !== "") {
          return envValue;
        }
        return null;
      },
    },
  ),
  
  /**
   * Extension enabled state with environment variable initialization
   */
  [StorageKey.EXTENSION_ENABLED]: browserStorage.defineItem<boolean>(
    StorageKey.EXTENSION_ENABLED,
    {
      fallback: false,
      init: () => {
        const envValue = import.meta.env.VITE_EXTENSION_ENABLED;
        if (envValue === "true") {
          return true;
        }
        return false;
      },
    },
  ),
  
  /**
   * Chat sessions storage
   */
  [StorageKey.CHAT_SESSIONS]: browserStorage.defineItem<
    Record<string, ChatSession>
  >(StorageKey.CHAT_SESSIONS, {
    fallback: {},
  }),
  
  /**
   * Active chat session ID
   */
  [StorageKey.ACTIVE_CHAT_SESSION]: browserStorage.defineItem<string | null>(
    StorageKey.ACTIVE_CHAT_SESSION,
    {
      fallback: null,
    },
  ),
  
  /**
   * Always remove CSS selectors with environment variable initialization
   */
  [StorageKey.ALWAYS_REMOVE]: browserStorage.defineItem<string | null>(
    StorageKey.ALWAYS_REMOVE,
    {
      fallback: null,
      init: () => {
        const envValue = import.meta.env.VITE_ALWAYS_REMOVE;
        if (envValue && envValue !== "") {
          return envValue;
        }
        return null;
      },
    },
  ),
  
  /**
   * Access grants storage
   */
  [StorageKey.ACCESS_GRANTS]: browserStorage.defineItem<
    Record<string, AccessGrant>
  >(StorageKey.ACCESS_GRANTS, {
    fallback: {},
  }),
  
  /**
   * Decision cache storage
   */
  [StorageKey.DECISION_CACHE]: browserStorage.defineItem<
    Record<string, DecisionCacheEntry>
  >(StorageKey.DECISION_CACHE, {
    fallback: {},
  }),
  
  /**
   * Last cache cleanup timestamp
   */
  [StorageKey.CACHE_LAST_CLEANUP]: browserStorage.defineItem<number>(
    StorageKey.CACHE_LAST_CLEANUP,
    {
      fallback: 0,
    },
  ),
} as const;

export type Value<T extends StorageKey> =
  (typeof storage)[T] extends WxtStorageItem<infer V, infer _> ? V : never;

export const getStorage = <K extends StorageKey>(key: K) => {
  return storage[key];
};

export const getStorageValue = async <K extends StorageKey>(
  key: K,
): Promise<Value<K>> => {
  const storageItem = storage[key];
  return (await storageItem.getValue()) as Value<K>;
};

export const setStorageValue = async <K extends StorageKey>(
  key: K,
  value: Value<K>,
): Promise<void> => {
  const storageItem = storage[key] as WxtStorageItem<
    Value<K>,
    Record<string, unknown>
  >;
  await storageItem.setValue(value);
};

export const useStorage = <K extends StorageKey>(key: K) => {
  const item = storage[key] as WxtStorageItem<
    Value<K>,
    Record<string, unknown>
  >;
  const [value, setValue] = useState<Value<K> | null>(null);

  useEffect(() => {
    const unwatch = item.watch((value) => {
      setValue(value);
    });

    return () => {
      unwatch();
    };
  }, [item]);

  useEffect(() => {
    (async () => {
      const value = await item.getValue();
      setValue(value);
    })();
  }, [item.getValue]);

  const remove = () => {
    void item.removeValue();
  };

  const set = (value: Value<K>) => {
    void item.setValue(value);
  };

  return { data: value ?? item.fallback, remove, set };
};

// Access grant helper functions
export const getActiveAccessGrant = async (
  url: string,
): Promise<AccessGrant | null> => {
  const grants = await getStorageValue(StorageKey.ACCESS_GRANTS);
  const grant = grants[url];

  if (!grant) {
    return null;
  }

  // Check if grant has expired
  if (Date.now() >= grant.expiresAt) {
    // Remove expired grant
    await removeAccessGrant(url);
    return null;
  }

  return grant;
};

export const setAccessGrant = async (grant: AccessGrant): Promise<void> => {
  const grantsStorage = getStorage(StorageKey.ACCESS_GRANTS);
  const grants = await grantsStorage.getValue();
  await grantsStorage.setValue({
    ...grants,
    [grant.url]: grant,
  });
};

export const removeAccessGrant = async (url: string): Promise<void> => {
  const grantsStorage = getStorage(StorageKey.ACCESS_GRANTS);
  const grants = await grantsStorage.getValue();
  const { [url]: _, ...remainingGrants } = grants;
  await grantsStorage.setValue(remainingGrants);
};

export const cleanupExpiredGrants = async (): Promise<void> => {
  const grantsStorage = getStorage(StorageKey.ACCESS_GRANTS);
  const grants = await grantsStorage.getValue();
  const now = Date.now();

  const validGrants = Object.entries(grants).reduce(
    (acc, [url, grant]) => {
      if (now < grant.expiresAt) {
        acc[url] = grant;
      }
      return acc;
    },
    {} as Record<string, AccessGrant>,
  );

  await grantsStorage.setValue(validGrants);
};

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
} from "~/lib/cache";
