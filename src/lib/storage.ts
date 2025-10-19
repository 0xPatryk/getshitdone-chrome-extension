import { useEffect, useState } from "react";
import type { ChatSession } from "~/lib/messaging";
import { Theme, type User } from "~/types";
import { type WxtStorageItem, storage as browserStorage } from "#imports";

export const StorageKey = {
  THEME: "local:theme",
  USER: "local:user",
  GEMINI_API_KEY: "local:geminiApiKey",
  CURRENT_TASK: "local:currentTask",
  EXTENSION_ENABLED: "local:extensionEnabled",
  CHAT_SESSIONS: "local:chatSessions",
  ACTIVE_CHAT_SESSION: "local:activeChatSession",
} as const;

export type StorageKey = (typeof StorageKey)[keyof typeof StorageKey];

const storage = {
  [StorageKey.THEME]: browserStorage.defineItem<Theme>(StorageKey.THEME, {
    fallback: Theme.SYSTEM,
  }),
  [StorageKey.USER]: browserStorage.defineItem<User | null>(StorageKey.USER, {
    fallback: null,
  }),
  [StorageKey.GEMINI_API_KEY]: browserStorage.defineItem<string | null>(
    StorageKey.GEMINI_API_KEY,
    {
      fallback: null,
    },
  ),
  [StorageKey.CURRENT_TASK]: browserStorage.defineItem<string | null>(
    StorageKey.CURRENT_TASK,
    {
      fallback: null,
    },
  ),
  [StorageKey.EXTENSION_ENABLED]: browserStorage.defineItem<boolean>(
    StorageKey.EXTENSION_ENABLED,
    {
      fallback: false,
    },
  ),
  [StorageKey.CHAT_SESSIONS]: browserStorage.defineItem<
    Record<string, ChatSession>
  >(StorageKey.CHAT_SESSIONS, {
    fallback: {},
  }),
  [StorageKey.ACTIVE_CHAT_SESSION]: browserStorage.defineItem<string | null>(
    StorageKey.ACTIVE_CHAT_SESSION,
    {
      fallback: null,
    },
  ),
} as const;

export type Value<T extends StorageKey> =
  (typeof storage)[T] extends WxtStorageItem<infer V, infer _> ? V : never;

export const getStorage = <K extends StorageKey>(key: K) => {
  return storage[key];
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
