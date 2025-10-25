import { useEffect, useState } from "react";
import type { ChatSession } from "~/lib/messaging";
import { Theme } from "~/types";
import { type WxtStorageItem, storage as browserStorage } from "#imports";

// AccessGrant interface for type safety
interface AccessGrant {
  url: string;
  expiresAt: number;
  grantedAt: number;
  durationMinutes: number;
}

export const StorageKey = {
  THEME: "local:theme",
  GEMINI_API_KEY: "local:geminiApiKey",
  OPENAI_API_KEY: "local:openaiApiKey",
  AI_PROVIDER: "local:aiProvider",
  CURRENT_TASK: "local:currentTask",
  EXTENSION_ENABLED: "local:extensionEnabled",
  CHAT_SESSIONS: "local:chatSessions",
  ACTIVE_CHAT_SESSION: "local:activeChatSession",
  ALWAYS_REMOVE: "local:alwaysRemove",
  ACCESS_GRANTS: "local:accessGrants",
} as const;

export type StorageKey = (typeof StorageKey)[keyof typeof StorageKey];

const storage = {
  [StorageKey.THEME]: browserStorage.defineItem<Theme>(StorageKey.THEME, {
    fallback: Theme.SYSTEM,
  }),
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
  [StorageKey.ACCESS_GRANTS]: browserStorage.defineItem<
    Record<string, AccessGrant>
  >(StorageKey.ACCESS_GRANTS, {
    fallback: {},
  }),
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
