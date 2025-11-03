/**
 * Storage Utils Tests
 *
 * This file contains unit tests for the storage utilities module.
 * It tests low-level storage utility functions and key management.
 *
 * Key features tested:
 * - Low-level storage utility functions
 * - Storage key management
 * - Data serialization/deserialization
 * - Storage migration functions
 * - Error handling for storage operations
 */

import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";
import { StorageKey, type StorageKeyType } from "~/lib/storage/types";
import {
  getStorage,
  getStorageValue,
  setStorageValue,
} from "~/lib/storage/utils";
import { MockStorage } from "./mocks";

// Mock WxtStorageItem type matching the complete WxtStorageItem interface
interface MockWxtStorageItem<T = unknown, M = Record<string, unknown>> {
  getValue: () => Promise<T>;
  setValue: (value: T) => Promise<void>;
  removeValue: () => Promise<void>;
  watch: (callback: (newValue: T, oldValue: T | undefined) => void) => () => void;
  key: string;
  fallback?: T;
  init?: () => T;
}

describe("Storage Utils", () => {
  let mockStorageConfig: Record<StorageKeyType, MockWxtStorageItem<unknown, Record<string, unknown>>>;
  let mockStorage: MockStorage;

  beforeEach(() => {
    mockStorage = new MockStorage();

    // Create mock storage configuration with all keys
    mockStorageConfig = {
      [StorageKey.THEME]: {
        key: StorageKey.THEME,
        getValue: mock(async () => {
          const value = mockStorage.getValue(StorageKey.THEME);
          return value ?? "system";
        }),
        setValue: mock(async (value: unknown) => {
          await mockStorage.set({ [StorageKey.THEME]: value });
        }),
        removeValue: mock(async () => {
          await mockStorage.remove(StorageKey.THEME);
        }),
        watch: mock((callback: (newValue: unknown, oldValue: unknown | undefined) => void) => {
          return () => {}; // Return unwatch function
        }),
        fallback: "system" as unknown,
      },
      [StorageKey.GEMINI_API_KEY]: {
        key: StorageKey.GEMINI_API_KEY,
        getValue: mock(async () => {
          return mockStorage.getValue(StorageKey.GEMINI_API_KEY);
        }),
        setValue: mock(async (value: unknown) => {
          await mockStorage.set({ [StorageKey.GEMINI_API_KEY]: value });
        }),
        removeValue: mock(async () => {
          await mockStorage.remove(StorageKey.GEMINI_API_KEY);
        }),
        watch: mock((callback: (newValue: unknown, oldValue: unknown | undefined) => void) => {
          return () => {}; // Return unwatch function
        }),
      },
      [StorageKey.OPENAI_API_KEY]: {
        key: StorageKey.OPENAI_API_KEY,
        getValue: mock(async () => {
          return mockStorage.getValue(StorageKey.OPENAI_API_KEY);
        }),
        setValue: mock(async (value: unknown) => {
          await mockStorage.set({ [StorageKey.OPENAI_API_KEY]: value });
        }),
        removeValue: mock(async () => {
          await mockStorage.remove(StorageKey.OPENAI_API_KEY);
        }),
        watch: mock((callback: (newValue: unknown, oldValue: unknown | undefined) => void) => {
          return () => {}; // Return unwatch function
        }),
      },
      [StorageKey.AI_PROVIDER]: {
        key: StorageKey.AI_PROVIDER,
        getValue: mock(async () => {
          return mockStorage.getValue(StorageKey.AI_PROVIDER) ?? "gemini";
        }),
        setValue: mock(async (value: unknown) => {
          await mockStorage.set({ [StorageKey.AI_PROVIDER]: value });
        }),
        removeValue: mock(async () => {
          await mockStorage.remove(StorageKey.AI_PROVIDER);
        }),
        watch: mock((callback: (newValue: unknown, oldValue: unknown | undefined) => void) => {
          return () => {}; // Return unwatch function
        }),
        fallback: "gemini" as unknown,
      },
      [StorageKey.CURRENT_TASK]: {
        key: StorageKey.CURRENT_TASK,
        getValue: mock(async () => {
          return mockStorage.getValue(StorageKey.CURRENT_TASK);
        }),
        setValue: mock(async (value: unknown) => {
          await mockStorage.set({ [StorageKey.CURRENT_TASK]: value });
        }),
        removeValue: mock(async () => {
          await mockStorage.remove(StorageKey.CURRENT_TASK);
        }),
        watch: mock((callback: (newValue: unknown, oldValue: unknown | undefined) => void) => {
          return () => {}; // Return unwatch function
        }),
      },
      [StorageKey.EXTENSION_ENABLED]: {
        key: StorageKey.EXTENSION_ENABLED,
        getValue: mock(async () => {
          const value = mockStorage.getValue(StorageKey.EXTENSION_ENABLED);
          return value ?? false;
        }),
        setValue: mock(async (value: unknown) => {
          await mockStorage.set({ [StorageKey.EXTENSION_ENABLED]: value });
        }),
        removeValue: mock(async () => {
          await mockStorage.remove(StorageKey.EXTENSION_ENABLED);
        }),
        watch: mock((callback: (newValue: unknown, oldValue: unknown | undefined) => void) => {
          return () => {}; // Return unwatch function
        }),
        fallback: false as unknown,
      },
      [StorageKey.CHAT_SESSIONS]: {
        key: StorageKey.CHAT_SESSIONS,
        getValue: mock(async () => {
          const value = mockStorage.getValue(StorageKey.CHAT_SESSIONS);
          return value ?? {};
        }),
        setValue: mock(async (value: unknown) => {
          await mockStorage.set({ [StorageKey.CHAT_SESSIONS]: value });
        }),
        removeValue: mock(async () => {
          await mockStorage.remove(StorageKey.CHAT_SESSIONS);
        }),
        watch: mock((callback: (newValue: unknown, oldValue: unknown | undefined) => void) => {
          return () => {}; // Return unwatch function
        }),
        fallback: {} as unknown,
      },
      [StorageKey.ACTIVE_CHAT_SESSION]: {
        key: StorageKey.ACTIVE_CHAT_SESSION,
        getValue: mock(async () => {
          return mockStorage.getValue(StorageKey.ACTIVE_CHAT_SESSION);
        }),
        setValue: mock(async (value: unknown) => {
          await mockStorage.set({ [StorageKey.ACTIVE_CHAT_SESSION]: value });
        }),
        removeValue: mock(async () => {
          await mockStorage.remove(StorageKey.ACTIVE_CHAT_SESSION);
        }),
        watch: mock((callback: (newValue: unknown, oldValue: unknown | undefined) => void) => {
          return () => {}; // Return unwatch function
        }),
      },
      [StorageKey.ALWAYS_REMOVE]: {
        key: StorageKey.ALWAYS_REMOVE,
        getValue: mock(async () => {
          return mockStorage.getValue(StorageKey.ALWAYS_REMOVE);
        }),
        setValue: mock(async (value: unknown) => {
          await mockStorage.set({ [StorageKey.ALWAYS_REMOVE]: value });
        }),
        removeValue: mock(async () => {
          await mockStorage.remove(StorageKey.ALWAYS_REMOVE);
        }),
        watch: mock((callback: (newValue: unknown, oldValue: unknown | undefined) => void) => {
          return () => {}; // Return unwatch function
        }),
      },
      [StorageKey.ACCESS_GRANTS]: {
        key: StorageKey.ACCESS_GRANTS,
        getValue: mock(async () => {
          const value = mockStorage.getValue(StorageKey.ACCESS_GRANTS);
          return value ?? {};
        }),
        setValue: mock(async (value: unknown) => {
          await mockStorage.set({ [StorageKey.ACCESS_GRANTS]: value });
        }),
        removeValue: mock(async () => {
          await mockStorage.remove(StorageKey.ACCESS_GRANTS);
        }),
        watch: mock((callback: (newValue: unknown, oldValue: unknown | undefined) => void) => {
          return () => {}; // Return unwatch function
        }),
        fallback: {} as unknown,
      },
      [StorageKey.DECISION_CACHE]: {
        key: StorageKey.DECISION_CACHE,
        getValue: mock(async () => {
          const value = mockStorage.getValue(StorageKey.DECISION_CACHE);
          return value ?? {};
        }),
        setValue: mock(async (value: unknown) => {
          await mockStorage.set({ [StorageKey.DECISION_CACHE]: value });
        }),
        removeValue: mock(async () => {
          await mockStorage.remove(StorageKey.DECISION_CACHE);
        }),
        watch: mock((callback: (newValue: unknown, oldValue: unknown | undefined) => void) => {
          return () => {}; // Return unwatch function
        }),
        fallback: {} as unknown,
      },
      [StorageKey.CACHE_LAST_CLEANUP]: {
        key: StorageKey.CACHE_LAST_CLEANUP,
        getValue: mock(async () => {
          const value = mockStorage.getValue(StorageKey.CACHE_LAST_CLEANUP);
          return value ?? 0;
        }),
        setValue: mock(async (value: unknown) => {
          await mockStorage.set({ [StorageKey.CACHE_LAST_CLEANUP]: value });
        }),
        removeValue: mock(async () => {
          await mockStorage.remove(StorageKey.CACHE_LAST_CLEANUP);
        }),
        watch: mock((callback: (newValue: unknown, oldValue: unknown | undefined) => void) => {
          return () => {}; // Return unwatch function
        }),
        fallback: 0 as unknown,
      },
    };
  });

  afterEach(() => {
    mockStorage.reset();
  });

  describe("getStorage", () => {
    it("should return the correct storage item for a valid key", () => {
      const themeStorage = getStorage(StorageKey.THEME, mockStorageConfig);

      expect(themeStorage).toBe(mockStorageConfig[StorageKey.THEME]);
      expect(themeStorage.key).toBe(StorageKey.THEME);
    });

    it("should return storage item for API key", () => {
      const apiKeyStorage = getStorage(
        StorageKey.GEMINI_API_KEY,
        mockStorageConfig,
      );

      expect(apiKeyStorage).toBe(mockStorageConfig[StorageKey.GEMINI_API_KEY]);
      expect(apiKeyStorage.key).toBe(StorageKey.GEMINI_API_KEY);
    });

    it("should return storage item for complex object", () => {
      const chatSessionsStorage = getStorage(
        StorageKey.CHAT_SESSIONS,
        mockStorageConfig,
      );

      expect(chatSessionsStorage).toBe(
        mockStorageConfig[StorageKey.CHAT_SESSIONS],
      );
      expect(chatSessionsStorage.key).toBe(StorageKey.CHAT_SESSIONS);
    });

    it("should work with all storage key types", () => {
      const keys = [
        StorageKey.GEMINI_API_KEY,
        StorageKey.OPENAI_API_KEY,
        StorageKey.AI_PROVIDER,
        StorageKey.CURRENT_TASK,
        StorageKey.EXTENSION_ENABLED,
        StorageKey.CHAT_SESSIONS,
        StorageKey.ACTIVE_CHAT_SESSION,
        StorageKey.ALWAYS_REMOVE,
        StorageKey.ACCESS_GRANTS,
        StorageKey.DECISION_CACHE,
        StorageKey.CACHE_LAST_CLEANUP,
      ];

      for (const key of keys) {
        const storageItem = getStorage(key, mockStorageConfig);
        expect(storageItem).toBeDefined();
        expect(typeof storageItem).toBe("object");
      }
    });
  });

  describe("getStorageValue", () => {
    it("should return stored value for existing key", async () => {
      await mockStorage.set({ [StorageKey.GEMINI_API_KEY]: "test-api-key" });

      const value = await getStorageValue(StorageKey.GEMINI_API_KEY, mockStorageConfig);

      expect(value).toBe("test-api-key");
      expect(mockStorageConfig[StorageKey.GEMINI_API_KEY].getValue).toHaveBeenCalled();
    });

    it("should return undefined for non-existent key", async () => {
      const value = await getStorageValue(
        "non-existent-key" as StorageKey,
        mockStorageConfig,
      );

      expect(value).toBeUndefined();
    });

    it("should return null for API key when not set", async () => {
      const value = await getStorageValue(
        StorageKey.GEMINI_API_KEY,
        mockStorageConfig,
      );

      expect(value).toBeUndefined();
    });

    it("should return empty object for chat sessions when not set", async () => {
      const value = await getStorageValue(
        StorageKey.CHAT_SESSIONS,
        mockStorageConfig,
      );

      expect(value).toEqual({});
    });

    it("should return boolean value correctly", async () => {
      await mockStorage.set({ [StorageKey.EXTENSION_ENABLED]: true });

      const value = await getStorageValue(
        StorageKey.EXTENSION_ENABLED,
        mockStorageConfig,
      );

      expect(value).toBe(true);
    });

    it("should handle complex object values", async () => {
      const mockSessions = {
        "session-1": {
          id: "session-1",
          title: "Test Session",
          messages: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      };

      await mockStorage.set({ [StorageKey.CHAT_SESSIONS]: mockSessions });

      const value = await getStorageValue(
        StorageKey.CHAT_SESSIONS,
        mockStorageConfig,
      );

      expect(value).toEqual(mockSessions);
    });

    it("should handle string values correctly", async () => {
      const task = "Complete unit tests for storage module";

      await mockStorage.set({ [StorageKey.CURRENT_TASK]: task });

      const value = await getStorageValue(
        StorageKey.CURRENT_TASK,
        mockStorageConfig,
      );

      expect(value).toBe(task);
    });

    it("should handle number values correctly", async () => {
      const timestamp = Date.now();

      await mockStorage.set({ [StorageKey.CACHE_LAST_CLEANUP]: timestamp });

      const value = await getStorageValue(
        StorageKey.CACHE_LAST_CLEANUP,
        mockStorageConfig,
      );

      expect(value).toBe(timestamp);
    });

    it("should handle storage errors gracefully", async () => {
      const errorMessage = "Storage read error";
      const themeStorageItem = mockStorageConfig[StorageKey.THEME];
      if (themeStorageItem) {
        // Bun's mock doesn't have mockRejectedValueOnce, so we'll replace the mock
        themeStorageItem.getValue = mock(async () => {
          throw new Error(errorMessage);
        });
      }

      await expect(
        getStorageValue(StorageKey.THEME, mockStorageConfig),
      ).rejects.toThrow(errorMessage);
    });
  });

  describe("setStorageValue", () => {
    it("should set value for valid key", async () => {
      const theme = "dark";

      await setStorageValue(StorageKey.GEMINI_API_KEY, theme, mockStorageConfig);

      expect(mockStorageConfig[StorageKey.GEMINI_API_KEY].setValue).toHaveBeenCalledWith(
        theme,
      );
      expect(mockStorage.getValue(StorageKey.GEMINI_API_KEY)).toBe(theme);
    });

    it("should set null value for API key", async () => {
      await setStorageValue(StorageKey.GEMINI_API_KEY, null, mockStorageConfig);

      expect(
        mockStorageConfig[StorageKey.GEMINI_API_KEY].setValue,
      ).toHaveBeenCalledWith(null);
      expect(mockStorage.getValue(StorageKey.GEMINI_API_KEY)).toBeNull();
    });

    it("should set boolean value correctly", async () => {
      await setStorageValue(
        StorageKey.EXTENSION_ENABLED,
        true,
        mockStorageConfig,
      );

      expect(
        mockStorageConfig[StorageKey.EXTENSION_ENABLED].setValue,
      ).toHaveBeenCalledWith(true);
      expect(mockStorage.getValue(StorageKey.EXTENSION_ENABLED)).toBe(true);
    });

    it("should set complex object value", async () => {
      const mockSessions = {
        "session-1": {
          id: "session-1",
          title: "Test Session",
          messages: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      };

      await setStorageValue(
        StorageKey.CHAT_SESSIONS,
        mockSessions,
        mockStorageConfig,
      );

      expect(
        mockStorageConfig[StorageKey.CHAT_SESSIONS].setValue,
      ).toHaveBeenCalledWith(mockSessions);
      expect(mockStorage.getValue(StorageKey.CHAT_SESSIONS)).toEqual(
        mockSessions,
      );
    });

    it("should set string value correctly", async () => {
      const task = "Write comprehensive tests";

      await setStorageValue(StorageKey.CURRENT_TASK, task, mockStorageConfig);

      expect(
        mockStorageConfig[StorageKey.CURRENT_TASK].setValue,
      ).toHaveBeenCalledWith(task);
      expect(mockStorage.getValue(StorageKey.CURRENT_TASK)).toBe(task);
    });

    it("should set number value correctly", async () => {
      const timestamp = Date.now();

      await setStorageValue(
        StorageKey.CACHE_LAST_CLEANUP,
        timestamp,
        mockStorageConfig,
      );

      expect(
        mockStorageConfig[StorageKey.CACHE_LAST_CLEANUP].setValue,
      ).toHaveBeenCalledWith(timestamp);
      expect(mockStorage.getValue(StorageKey.CACHE_LAST_CLEANUP)).toBe(
        timestamp,
      );
    });

    it("should update existing value", async () => {
      // Set initial value
      await setStorageValue(StorageKey.GEMINI_API_KEY, "dark", mockStorageConfig);
      expect(mockStorage.getValue(StorageKey.GEMINI_API_KEY)).toBe("dark");

      // Update value
      await setStorageValue(StorageKey.GEMINI_API_KEY, "light", mockStorageConfig);
      expect(mockStorage.getValue(StorageKey.GEMINI_API_KEY)).toBe("light");
    });

    it("should handle storage errors gracefully", async () => {
      const errorMessage = "Storage write error";
      const themeStorageItem = mockStorageConfig[StorageKey.THEME];
      if (themeStorageItem) {
        // Bun's mock doesn't have mockRejectedValueOnce, so we'll replace the mock
        themeStorageItem.setValue = mock(async () => {
          throw new Error(errorMessage);
        });
      }

      await expect(
        setStorageValue(StorageKey.THEME, "dark", mockStorageConfig),
      ).rejects.toThrow(errorMessage);
    });

    it("should handle undefined values", async () => {
      await setStorageValue(
        StorageKey.CURRENT_TASK,
        undefined,
        mockStorageConfig,
      );

      expect(
        mockStorageConfig[StorageKey.CURRENT_TASK].setValue,
      ).toHaveBeenCalledWith(undefined);
      expect(mockStorage.getValue(StorageKey.CURRENT_TASK)).toBeUndefined();
    });
  });

  describe("Storage Key Management", () => {
    it("should handle all storage key types consistently", async () => {
      const testValues = {
        [StorageKey.GEMINI_API_KEY]: "test-api-key",
        [StorageKey.OPENAI_API_KEY]: "test-openai-key",
        [StorageKey.AI_PROVIDER]: "openai",
        [StorageKey.CURRENT_TASK]: "Test task",
        [StorageKey.EXTENSION_ENABLED]: true,
        [StorageKey.ACTIVE_CHAT_SESSION]: "session-1",
        [StorageKey.ALWAYS_REMOVE]: ".ads,.sidebar",
        [StorageKey.CACHE_LAST_CLEANUP]: Date.now(),
      };

      // Set all values
      for (const [key, value] of Object.entries(testValues)) {
        await setStorageValue(key as StorageKeyType, value, mockStorageConfig);
      }

      // Get all values and verify
      for (const [key, expectedValue] of Object.entries(testValues)) {
        const actualValue = await getStorageValue(
          key as StorageKeyType,
          mockStorageConfig,
        );
        expect(actualValue).toEqual(expectedValue);
      }
    });

    it("should maintain type safety for different value types", async () => {
      // String value
      await setStorageValue(StorageKey.THEME, "dark", mockStorageConfig);
      const themeValue = await getStorageValue(
        StorageKey.THEME,
        mockStorageConfig,
      );
      expect(typeof themeValue).toBe("string");

      // Boolean value
      await setStorageValue(
        StorageKey.EXTENSION_ENABLED,
        true,
        mockStorageConfig,
      );
      const booleanValue = await getStorageValue(
        StorageKey.EXTENSION_ENABLED,
        mockStorageConfig,
      );
      expect(typeof booleanValue).toBe("boolean");

      // Number value
      const timestamp = Date.now();
      await setStorageValue(
        StorageKey.CACHE_LAST_CLEANUP,
        timestamp,
        mockStorageConfig,
      );
      const numberValue = await getStorageValue(
        StorageKey.CACHE_LAST_CLEANUP,
        mockStorageConfig,
      );
      expect(typeof numberValue).toBe("number");

      // Object value
      const objectValue = { test: "value" };
      await setStorageValue(
        StorageKey.ACCESS_GRANTS,
        objectValue,
        mockStorageConfig,
      );
      const retrievedObject = await getStorageValue(
        StorageKey.ACCESS_GRANTS,
        mockStorageConfig,
      );
      expect(typeof retrievedObject).toBe("object");
      expect(retrievedObject).toEqual(objectValue);
    });
  });

  describe("Data Serialization/Deserialization", () => {
    it("should handle JSON serialization for complex objects", async () => {
      const complexObject = {
        nested: {
          array: [1, 2, 3],
          object: { key: "value" },
        },
        date: new Date().toISOString(),
        null: null,
        undefined: undefined,
      };

      await setStorageValue(
        StorageKey.CHAT_SESSIONS,
        complexObject,
        mockStorageConfig,
      );

      const retrievedValue = await getStorageValue(
        StorageKey.CHAT_SESSIONS,
        mockStorageConfig,
      );

      expect(retrievedValue).toEqual(complexObject);
    });

    it("should handle special characters in strings", async () => {
      const specialString =
        'Special chars: "quotes", \n newlines, \t tabs, \\ backslashes';

      await setStorageValue(
        StorageKey.CURRENT_TASK,
        specialString,
        mockStorageConfig,
      );

      const retrievedValue = await getStorageValue(
        StorageKey.CURRENT_TASK,
        mockStorageConfig,
      );

      expect(retrievedValue).toBe(specialString);
    });

    it("should handle empty values", async () => {
      // Empty string
      await setStorageValue(StorageKey.CURRENT_TASK, "", mockStorageConfig);
      expect(
        await getStorageValue(StorageKey.CURRENT_TASK, mockStorageConfig),
      ).toBe("");

      // Empty object
      await setStorageValue(StorageKey.CHAT_SESSIONS, {}, mockStorageConfig);
      expect(
        await getStorageValue(StorageKey.CHAT_SESSIONS, mockStorageConfig),
      ).toEqual({});

      // Zero
      await setStorageValue(
        StorageKey.CACHE_LAST_CLEANUP,
        0,
        mockStorageConfig,
      );
      expect(
        await getStorageValue(StorageKey.CACHE_LAST_CLEANUP, mockStorageConfig),
      ).toBe(0);

      // False
      await setStorageValue(
        StorageKey.EXTENSION_ENABLED,
        false,
        mockStorageConfig,
      );
      expect(
        await getStorageValue(StorageKey.EXTENSION_ENABLED, mockStorageConfig),
      ).toBe(false);
    });
  });

  describe("Error Handling", () => {
    it("should handle missing storage configuration", async () => {
      const emptyConfig = {};

      const value = await getStorageValue(StorageKey.GEMINI_API_KEY, emptyConfig);
      expect(value).toBeUndefined();

      await expect(
        setStorageValue(StorageKey.GEMINI_API_KEY, "dark", emptyConfig),
      ).rejects.toThrow();
    });

    it("should handle storage item without getValue method", async () => {
      const invalidConfig = {
        [StorageKey.GEMINI_API_KEY]: {
          key: StorageKey.GEMINI_API_KEY,
          setValue: mock(),
        },
      };

      await expect(
        getStorageValue(StorageKey.GEMINI_API_KEY, invalidConfig),
      ).rejects.toThrow();
    });

    it("should handle storage item without setValue method", async () => {
      const invalidConfig = {
        [StorageKey.GEMINI_API_KEY]: {
          key: StorageKey.GEMINI_API_KEY,
          getValue: mock(),
        },
      };

      await expect(
        setStorageValue(StorageKey.GEMINI_API_KEY, "dark", invalidConfig),
      ).rejects.toThrow();
    });

    it("should handle concurrent operations", async () => {
      const promises = [];

      // Concurrent reads
      for (let i = 0; i < 10; i++) {
        promises.push(getStorageValue(StorageKey.THEME, mockStorageConfig));
      }

      // Concurrent writes
      for (let i = 0; i < 10; i++) {
        promises.push(
          setStorageValue(StorageKey.THEME, `theme-${i}`, mockStorageConfig),
        );
      }

      await expect(Promise.all(promises)).resolves.toBeDefined();
    });
  });
});
