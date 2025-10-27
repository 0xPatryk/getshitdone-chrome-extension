/**
 * Test Setup for WXT Extension with Bun
 *
 * This file sets up the testing environment for the Chrome extension,
 * providing mocks for Chrome APIs and browser context. It's designed to
 * work with Bun's test framework and integrates seamlessly with WXT.
 *
 * Key features:
 * - Chrome API mocking (storage, messaging, tabs, etc.)
 * - Browser context simulation
 * - DOM environment setup with jsdom
 * - Storage mocking with persistence
 * - Message passing simulation
 */

import { afterEach, beforeEach, mock } from "bun:test";
import { JSDOM } from "jsdom";

// Type definitions for Chrome APIs
interface ChromeStorage {
  local: {
    get: (
      keys?: string | string[] | Record<string, unknown> | null,
    ) => Promise<Record<string, unknown>>;
    set: (items: Record<string, unknown>) => Promise<void>;
    remove: (keys: string | string[]) => Promise<void>;
    clear: () => Promise<void>;
  };
  sync: {
    get: (
      keys?: string | string[] | Record<string, unknown> | null,
    ) => Promise<Record<string, unknown>>;
    set: (items: Record<string, unknown>) => Promise<void>;
    remove: (keys: string | string[]) => Promise<void>;
    clear: () => Promise<void>;
  };
}

interface ChromeRuntime {
  id: string;
  getURL: (path: string) => string;
  sendMessage: (message: unknown) => Promise<unknown>;
  onMessage: {
    addListener: (
      callback: (
        message: unknown,
        sender: unknown,
        sendResponse: (response?: unknown) => void,
      ) => void,
    ) => void;
    removeListener: (
      callback: (
        message: unknown,
        sender: unknown,
        sendResponse: (response?: unknown) => void,
      ) => void,
    ) => void;
  };
}

interface MockTab {
  id?: number;
  url?: string;
  active?: boolean;
  currentWindow?: boolean;
  windowId?: number;
}

interface ChromeTabs {
  create: (createProperties: {
    url: string;
    active?: boolean;
  }) => Promise<MockTab>;
  query: (queryInfo: { active?: boolean; currentWindow?: boolean }) => Promise<
    MockTab[]
  >;
  sendMessage: (
    tabId: number,
    message: unknown,
    options?: { frameId?: number },
  ) => Promise<unknown>;
}

// Mock storage data
const mockStorageData: Record<string, Record<string, unknown>> = {
  local: {},
  sync: {},
};

// Mock message listeners
const mockMessageListeners: Array<
  (
    message: unknown,
    sender: unknown,
    sendResponse: (response?: unknown) => void,
  ) => void
> = [];

// Mock tabs
const mockTabs: MockTab[] = [
  {
    id: 1,
    url: "https://example.com",
    active: true,
    currentWindow: true,
    windowId: 1,
  },
];

// Create Chrome API mocks
const createChromeMocks = () => {
  const chromeStorage: ChromeStorage = {
    local: {
      get: async (keys) => {
        if (!keys) return { ...mockStorageData.local };
        if (typeof keys === "string") {
          return { [keys]: mockStorageData.local[keys] };
        }
        if (Array.isArray(keys)) {
          const result: Record<string, unknown> = {};
          for (const key of keys) {
            result[key] = mockStorageData.local[key];
          }
          return result;
        }
        if (typeof keys === "object") {
          const result: Record<string, unknown> = {};
          for (const key of Object.keys(keys)) {
            result[key] = mockStorageData.local[key] ?? keys[key];
          }
          return result;
        }
        return {};
      },
      set: async (items) => {
        Object.assign(mockStorageData.local, items);
      },
      remove: async (keys) => {
        const keysArray = Array.isArray(keys) ? keys : [keys];
        for (const key of keysArray) {
          delete mockStorageData.local[key];
        }
      },
      clear: async () => {
        mockStorageData.local = {};
      },
    },
    sync: {
      get: async (keys) => {
        if (!keys) return { ...mockStorageData.sync };
        if (typeof keys === "string") {
          return { [keys]: mockStorageData.sync[keys] };
        }
        if (Array.isArray(keys)) {
          const result: Record<string, unknown> = {};
          for (const key of keys) {
            result[key] = mockStorageData.sync[key];
          }
          return result;
        }
        if (typeof keys === "object") {
          const result: Record<string, unknown> = {};
          for (const key of Object.keys(keys)) {
            result[key] = mockStorageData.sync[key] ?? keys[key];
          }
          return result;
        }
        return {};
      },
      set: async (items) => {
        Object.assign(mockStorageData.sync, items);
      },
      remove: async (keys) => {
        const keysArray = Array.isArray(keys) ? keys : [keys];
        for (const key of keysArray) {
          delete mockStorageData.sync[key];
        }
      },
      clear: async () => {
        mockStorageData.sync = {};
      },
    },
  };

  const chromeRuntime: ChromeRuntime = {
    id: "test-extension-id",
    getURL: (path: string) => `chrome-extension://test-extension-id/${path}`,
    sendMessage: async (message) => {
      // Simulate message handling by calling listeners
      const response = await new Promise<unknown>((resolve) => {
        for (const listener of mockMessageListeners) {
          listener(message, { id: "test-sender" }, resolve);
        }
      });
      return response;
    },
    onMessage: {
      addListener: (callback) => {
        mockMessageListeners.push(callback);
      },
      removeListener: (callback) => {
        const index = mockMessageListeners.indexOf(callback);
        if (index > -1) {
          mockMessageListeners.splice(index, 1);
        }
      },
    },
  };

  const chromeTabs: ChromeTabs = {
    create: async (createProperties) => {
      const newTab: MockTab = {
        id: mockTabs.length + 1,
        url: createProperties.url,
        active: createProperties.active ?? false,
        currentWindow: true,
        windowId: 1,
      };
      mockTabs.push(newTab);
      return newTab;
    },
    query: async (queryInfo) => {
      return mockTabs.filter((tab) => {
        if (queryInfo.active !== undefined && tab.active !== queryInfo.active) {
          return false;
        }
        if (
          queryInfo.currentWindow !== undefined &&
          tab.currentWindow !== queryInfo.currentWindow
        ) {
          return false;
        }
        return true;
      });
    },
    sendMessage: async (tabId, message) => {
      // Simulate message sending to content script
      return { success: true, tabId, message };
    },
  };

  return {
    storage: chromeStorage,
    runtime: chromeRuntime,
    tabs: chromeTabs,
  };
};

// Setup DOM environment
const setupDOM = () => {
  const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>", {
    url: "https://example.com",
    pretendToBeVisual: true,
    resources: "usable",
  });

  global.window = dom.window as unknown as Window & typeof globalThis;
  global.document = dom.window.document;
  global.navigator = dom.window.navigator;
  global.HTMLElement = dom.window.HTMLElement;
  global.Element = dom.window.Element;
  global.Node = dom.window.Node;
  global.NodeList = dom.window.NodeList;
  global.HTMLCollection = dom.window.HTMLCollection;
  global.MouseEvent = dom.window.MouseEvent;
  global.KeyboardEvent = dom.window.KeyboardEvent;
  global.Event = dom.window.Event;
  global.EventTarget = dom.window.EventTarget;
  global.CustomEvent = dom.window.CustomEvent;
  global.DOMParser = dom.window.DOMParser;
  global.XMLHttpRequest = dom.window.XMLHttpRequest;
  global.fetch = dom.window.fetch as typeof fetch;
};

// Global test setup
beforeEach(() => {
  // Setup DOM environment
  setupDOM();

  // Create and assign Chrome mocks
  const chromeMocks = createChromeMocks();
  global.chrome = chromeMocks as unknown as typeof chrome;

  // Ensure chrome.runtime.id exists to prevent extension errors
  if (!chromeMocks.runtime.id) {
    chromeMocks.runtime.id = "test-extension-id";
  }

  // Reset storage data
  mockStorageData.local = {};
  mockStorageData.sync = {};

  // Clear message listeners
  mockMessageListeners.length = 0;

  // Reset tabs
  mockTabs.length = 0;
  mockTabs.push({
    id: 1,
    url: "https://example.com",
    active: true,
    currentWindow: true,
    windowId: 1,
  });

  // Mock browser APIs that might be used
  global.browser = {
    storage: chromeMocks.storage,
    runtime: chromeMocks.runtime,
    tabs: chromeMocks.tabs,
  } as typeof chrome;

  // Mock WebExtension polyfill if needed
  global.WebExtensionPolyfill = class WebExtensionPolyfill {
    constructor() {
      // biome-ignore lint/correctness/noConstructorReturn: This is intentional for mocking
      return global.browser;
    }
  } as unknown as new () => typeof chrome;
});

// Cleanup after each test
afterEach(() => {
  // Clear all mocks
  mock.restore();

  // Clean up DOM
  if (global.window) {
    global.window.close();
  }

  // Reset globals
  global.window = undefined as unknown as Window & typeof globalThis;
  global.document = undefined as unknown as Document;
  global.navigator = undefined as unknown as Navigator;
  global.chrome = undefined as unknown as typeof chrome;
  global.browser = undefined as unknown as typeof chrome;
  global.WebExtensionPolyfill = undefined as unknown as new () => typeof chrome;
});

// Export utilities for test files
export const createMockStorage = () => {
  return {
    get: (key: string) => mockStorageData.local[key],
    set: (key: string, value: unknown) => {
      mockStorageData.local[key] = value;
    },
    remove: (key: string) => {
      delete mockStorageData.local[key];
    },
    clear: () => {
      mockStorageData.local = {};
    },
  };
};

export const createMockMessageSender = () => {
  return {
    id: "test-sender-id",
    url: "https://example.com",
    tab: {
      id: 1,
      url: "https://example.com",
    },
  };
};

export const waitForMessage = (predicate: (message: unknown) => boolean) => {
  return new Promise<unknown>((resolve) => {
    const listener = (message: unknown) => {
      if (predicate(message)) {
        chrome.runtime.onMessage.removeListener(listener);
        resolve(message);
      }
    };
    chrome.runtime.onMessage.addListener(listener);
  });
};

// Export mock data for tests to manipulate
export { mockStorageData, mockMessageListeners, mockTabs };
