/**
 * Storage Services
 *
 * This module contains storage configuration and React hooks.
 * It provides the main storage interface for the application.
 *
 * @module storage/services
 */

import { useEffect, useState } from "react";
import type { DecisionCacheEntry } from "~/lib/cache";
import type { ChatSession } from "~/lib/messaging";
import { Theme } from "~/types";
import { type WxtStorageItem, storage as browserStorage } from "#imports";
import { StorageKey, type StorageKeyType } from "./types";

/**
 * Storage configuration object defining all storage items with their types,
 * fallback values, and initialization functions. Uses WXT's storage system
 * for persistent browser extension storage.
 *
 * @constant
 */
export const storage = {
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
    Record<string, unknown>
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

/**
 * Storage value type helper
 */
export type Value<T extends StorageKeyType> =
  (typeof storage)[T] extends WxtStorageItem<infer V, infer _> ? V : never;

/**
 * React hook for reactive storage access
 *
 * @param key - The storage key to watch
 * @returns Storage value with setters
 */
export const useStorage = <K extends StorageKeyType>(key: K) => {
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
