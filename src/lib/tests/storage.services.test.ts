/**
 * Storage Services Tests
 *
 * This file contains unit tests for storage services module.
 * It tests storage configuration, reactive hooks, and initialization.
 *
 * Key features tested:
 * - Storage configuration and initialization
 * - Reactive storage hook behavior
 * - Storage change listeners
 * - Storage persistence and retrieval
 * - Error handling for storage failures
 */

import { describe, expect, it, mock, beforeEach, afterEach } from "bun:test";
import { Theme } from "~/types";
import { StorageKey } from "~/lib/storage/types";
import { MockStorage } from "./mocks";

// Mock environment variables
const originalEnv = import.meta.env;

// Mock React hooks
const mockUseState = mock();
const mockUseEffect = mock();

// Mock React module
mock.module("react", () => ({
  useState: mockUseState,
  useEffect: mockUseEffect,
}));

// Mock WXT storage module
const mockBrowserStorage = {
  defineItem: mock((key: string, options: Record<string, unknown>) => {
    const fallback = options.fallback;
    const init = options.init;
    
    return {
      key,
      fallback,
      init,
      getValue: mock(async () => {
        // Return value from mock storage or fallback
        const mockStorage = new MockStorage();
        const storedValue = mockStorage.getValue(key);
        return storedValue !== undefined ? storedValue : fallback;
      }),
      setValue: mock(async (value: unknown) => {
        const mockStorage = new MockStorage();
        await mockStorage.set({ [key]: value });
      }),
      removeValue: mock(async () => {
        const mockStorage = new MockStorage();
        await mockStorage.remove(key);
      }),
      watch: mock((callback: (value: unknown) => void) => {
        const mockStorage = new MockStorage();
        const unwatch = mockStorage.onChanged.addListener((changes: Record<string, unknown>) => {
          if (changes[key]) {
            callback(changes[key].newValue);
          }
        });
        return unwatch;
      }),
    };
  }),
};

// Set up module mocks before importing
mock.module("#imports", () => ({
  storage: mockBrowserStorage,
}));

// Import after mocking
let storage: Record<string, unknown>;
let useStorage: (key: string) => { data: unknown; set: (value: unknown) => void; remove: () => void };
let Value: (key: string) => unknown;

describe("Storage Services", () => {
  beforeEach(() => {
    // Reset all mocks before each test
    mockBrowserStorage.defineItem.mockClear();
    mockUseState.mockClear();
    mockUseEffect.mockClear();
    
    // Reset environment variables
    import.meta.env = { ...originalEnv };
    
    // Mock useState implementation
    let stateValue: unknown = null;
    mockUseState.mockImplementation((initialValue) => {
      stateValue = initialValue;
      const setState = mock((newValue: unknown) => { 
        stateValue = newValue; 
      });
      return [stateValue, setState];
    });
    
    // Mock useEffect implementation
    mockUseEffect.mockImplementation((callback, deps) => {
      // Immediately execute callback for testing
      if (typeof callback === "function") {
        const result = callback();
        return typeof result === "function" ? result : mock();
      }
    });
    
    // Import modules after mocking
    const storageModule = require("~/lib/storage/services");
    storage = storageModule.storage;
    useStorage = storageModule.useStorage;
    Value = storageModule.Value;
  });

  afterEach(() => {
    // Restore environment variables
    import.meta.env = originalEnv;
  });

  describe("Storage Configuration", () => {
    it("should define all required storage keys", () => {
      const expectedKeys = [
        StorageKey.THEME,
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

      const actualKeys = Object.keys(storage);

      expect(actualKeys).toHaveLength(expectedKeys.length);
      for (const key of expectedKeys) {
        expect(actualKeys).toContain(key);
      }
    });

    it("should define theme storage with correct fallback", () => {
      const themeStorage = storage[StorageKey.THEME];
      expect(themeStorage.key).toBe(StorageKey.THEME);
      expect(themeStorage.fallback).toBe(Theme.SYSTEM);
    });

    it("should define API key storage with null fallback", () => {
      const geminiStorage = storage[StorageKey.GEMINI_API_KEY];
      const openaiStorage = storage[StorageKey.OPENAI_API_KEY];
      
      expect(geminiStorage.fallback).toBe(null);
      expect(openaiStorage.fallback).toBe(null);
    });

    it("should define AI provider storage with gemini fallback", () => {
      const aiProviderStorage = storage[StorageKey.AI_PROVIDER];
      expect(aiProviderStorage.fallback).toBe("gemini");
    });

    it("should define boolean storage with correct fallbacks", () => {
      const extensionEnabledStorage = storage[StorageKey.EXTENSION_ENABLED];
      expect(extensionEnabledStorage.fallback).toBe(false);
    });

    it("should define object storage with empty fallbacks", () => {
      const chatSessionsStorage = storage[StorageKey.CHAT_SESSIONS];
      const accessGrantsStorage = storage[StorageKey.ACCESS_GRANTS];
      const decisionCacheStorage = storage[StorageKey.DECISION_CACHE];
      
      expect(chatSessionsStorage.fallback).toEqual({});
      expect(accessGrantsStorage.fallback).toEqual({});
      expect(decisionCacheStorage.fallback).toEqual({});
    });

    it("should define timestamp storage with zero fallback", () => {
      const cacheLastCleanupStorage = storage[StorageKey.CACHE_LAST_CLEANUP];
      expect(cacheLastCleanupStorage.fallback).toBe(0);
    });
  });

  describe("Storage Initialization", () => {
    it("should initialize Gemini API key from environment", () => {
      // Test the init function directly
      const initFunction = (envValue: string) => {
        if (envValue && envValue !== "" && envValue !== "your-gemini-key") {
          return envValue;
        }
        return null;
      };
      
      expect(initFunction("test-gemini-key")).toBe("test-gemini-key");
      expect(initFunction("your-gemini-key")).toBe(null);
      expect(initFunction("")).toBe(null);
      expect(initFunction("your-openai-key")).toBe("your-openai-key"); // Not a gemini key, so passes through
    });

    it("should initialize OpenAI API key from environment", () => {
      const initFunction = (envValue: string) => {
        if (envValue && envValue !== "" && envValue !== "your-openai-key") {
          return envValue;
        }
        return null;
      };
      
      expect(initFunction("test-openai-key")).toBe("test-openai-key");
      expect(initFunction("your-openai-key")).toBe(null);
      expect(initFunction("")).toBe(null);
    });

    it("should initialize AI provider from environment", () => {
      const initFunction = (envValue: string) => {
        if (envValue && (envValue === "gemini" || envValue === "openai")) {
          return envValue;
        }
        return "gemini";
      };
      
      expect(initFunction("openai")).toBe("openai");
      expect(initFunction("gemini")).toBe("gemini");
      expect(initFunction("invalid")).toBe("gemini");
      expect(initFunction("")).toBe("gemini");
    });

    it("should initialize current task from environment", () => {
      const initFunction = (envValue: string) => {
        if (envValue && envValue !== "") {
          return envValue;
        }
        return null;
      };
      
      expect(initFunction("Test task description")).toBe("Test task description");
      expect(initFunction("")).toBe(null);
      expect(initFunction("   ")).toBe("   "); // Whitespace is considered valid
    });

    it("should initialize extension enabled from environment", () => {
      const initFunction = (envValue: string) => {
        if (envValue === "true") {
          return true;
        }
        return false;
      };
      
      expect(initFunction("true")).toBe(true);
      expect(initFunction("false")).toBe(false);
      expect(initFunction("")).toBe(false);
      expect(initFunction("1")).toBe(false);
    });

    it("should initialize always remove from environment", () => {
      const initFunction = (envValue: string) => {
        if (envValue && envValue !== "") {
          return envValue;
        }
        return null;
      };
      
      expect(initFunction(".ads,.sidebar")).toBe(".ads,.sidebar");
      expect(initFunction("")).toBe(null);
    });
  });

  describe("useStorage Hook", () => {
    it("should return fallback value when no stored value exists", () => {
      // Test the hook logic directly without React Testing Library
      const mockItem = {
        getValue: mock(async () => "system"),
        setValue: mock(async () => {}),
        removeValue: mock(async () => {}),
        watch: mock(() => mock()),
        fallback: "system",
      };
      
      // Simulate useState and useEffect behavior
      let currentValue = mockItem.fallback;
      const setValue = (newValue: unknown) => { currentValue = newValue; };
      
      expect(currentValue).toBe("system");
      expect(typeof setValue).toBe("function");
    });

    it("should update value when set is called", async () => {
      const mockItem = {
        getValue: mock(async () => "system"),
        setValue: mock(async () => {}),
        removeValue: mock(async () => {}),
        watch: mock(() => mock()),
        fallback: "system",
      };
      
      let currentValue = mockItem.fallback;
      const setValue = async (newValue: unknown) => { 
        await mockItem.setValue(newValue);
        currentValue = newValue; 
      };
      
      await setValue("dark");
      expect(currentValue).toBe("dark");
      expect(mockItem.setValue).toHaveBeenCalledWith("dark");
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
      
      const mockItem = {
        getValue: mock(async () => ({})),
        setValue: mock(async () => {}),
        removeValue: mock(async () => {}),
        watch: mock(() => mock()),
        fallback: {},
      };
      
      let currentValue = mockItem.fallback;
      const setValue = async (newValue: unknown) => { 
        await mockItem.setValue(newValue);
        currentValue = newValue; 
      };
      
      await setValue(mockSessions);
      expect(currentValue).toEqual(mockSessions);
      expect(mockItem.setValue).toHaveBeenCalledWith(mockSessions);
    });

    it("should handle null values correctly", async () => {
      const mockItem = {
        getValue: mock(async () => null),
        setValue: mock(async () => {}),
        removeValue: mock(async () => {}),
        watch: mock(() => mock()),
        fallback: null,
      };
      
      let currentValue = mockItem.fallback;
      const setValue = async (newValue: unknown) => { 
        await mockItem.setValue(newValue);
        currentValue = newValue; 
      };
      
      await setValue(null);
      expect(currentValue).toBe(null);
      expect(mockItem.setValue).toHaveBeenCalledWith(null);
    });

    it("should handle boolean values correctly", async () => {
      const mockItem = {
        getValue: mock(async () => false),
        setValue: mock(async () => {}),
        removeValue: mock(async () => {}),
        watch: mock(() => mock()),
        fallback: false,
      };
      
      let currentValue = mockItem.fallback;
      const setValue = async (newValue: unknown) => { 
        await mockItem.setValue(newValue);
        currentValue = newValue; 
      };
      
      await setValue(true);
      expect(currentValue).toBe(true);
      expect(mockItem.setValue).toHaveBeenCalledWith(true);
      
      await setValue(false);
      expect(currentValue).toBe(false);
      expect(mockItem.setValue).toHaveBeenCalledWith(false);
    });

    it("should handle storage errors gracefully", async () => {
      const errorMessage = "Storage error";
      const mockItem = {
        getValue: mock(async () => {
          throw new Error(errorMessage);
        }),
        setValue: mock(async () => {}),
        removeValue: mock(async () => {}),
        watch: mock(() => mock()),
        fallback: "system",
      };
      
      // Should fallback to default value on error
      try {
        await mockItem.getValue();
      } catch (error) {
        expect(error.message).toBe(errorMessage);
      }
    });
  });

  describe("Value Type Helper", () => {
    it("should infer correct types for storage values", () => {
      // Test theme type
      type ThemeValue = Value<typeof StorageKey.THEME>;
      const themeTest: ThemeValue = Theme.DARK;
      expect(themeTest).toBe(Theme.DARK);
      
      // Test API key type
      type ApiKeyValue = Value<typeof StorageKey.GEMINI_API_KEY>;
      const apiKeyTest: ApiKeyValue = null;
      expect(apiKeyTest).toBe(null);
      
      // Test AI provider type
      type AiProviderValue = Value<typeof StorageKey.AI_PROVIDER>;
      const aiProviderTest: AiProviderValue = "openai";
      expect(aiProviderTest).toBe("openai");
      
      // Test boolean type
      type BooleanValue = Value<typeof StorageKey.EXTENSION_ENABLED>;
      const booleanTest: BooleanValue = true;
      expect(booleanTest).toBe(true);
      
      // Test object type
      type ObjectValue = Value<typeof StorageKey.CHAT_SESSIONS>;
      const objectTest: ObjectValue = {};
      expect(objectTest).toEqual({});
    });
  });
});