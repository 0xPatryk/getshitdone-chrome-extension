/**
 * Mock Helpers for WXT Extension Testing
 *
 * This file provides specialized mock implementations for storage and messaging
 * systems used in the Chrome extension. These mocks are designed to closely
 * mimic the behavior of the real Chrome APIs while providing test utilities
 * for inspection and manipulation.
 *
 * Key features:
 * - Advanced storage mocking with persistence
 * - Message passing simulation with listeners
 * - Tab management mocking
 * - Runtime API mocking
 * - Event simulation utilities
 */

import type { Message, Messages } from "~/lib/messaging/types";
import type { StorageKey } from "~/lib/storage/types";

// Enhanced storage mock with WXT-specific features
export class MockStorage {
  private data: Record<string, unknown> = {};
  private listeners: Array<
    (changes: Record<string, unknown>, areaName: string) => void
  > = [];

  // Basic storage operations
  async get(
    keys?: string | string[] | Record<string, unknown> | null,
  ): Promise<Record<string, unknown>> {
    if (!keys) return { ...this.data };
    if (typeof keys === "string") {
      return { [keys]: this.data[keys] };
    }
    if (Array.isArray(keys)) {
      const result: Record<string, unknown> = {};
      for (const key of keys) {
        result[key] = this.data[key];
      }
      return result;
    }
    if (typeof keys === "object") {
      const result: Record<string, unknown> = {};
      for (const key of Object.keys(keys)) {
        result[key] = this.data[key] ?? keys[key];
      }
      return result;
    }
    return {};
  }

  async set(items: Record<string, unknown>): Promise<void> {
    const changes: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(items)) {
      const oldValue = this.data[key];
      this.data[key] = value;

      if (oldValue !== value) {
        changes[key] = { oldValue, newValue: value };
      }
    }

    if (Object.keys(changes).length > 0) {
      this.notifyListeners(changes, "local");
    }
  }

  async remove(keys: string | string[]): Promise<void> {
    const keysArray = Array.isArray(keys) ? keys : [keys];
    const changes: Record<string, unknown> = {};

    for (const key of keysArray) {
      if (key in this.data) {
        changes[key] = { oldValue: this.data[key], newValue: undefined };
        delete this.data[key];
      }
    }

    if (Object.keys(changes).length > 0) {
      this.notifyListeners(changes, "local");
    }
  }

  async clear(): Promise<void> {
    const changes: Record<string, unknown> = {};
    for (const key of Object.keys(this.data)) {
      changes[key] = { oldValue: this.data[key], newValue: undefined };
    }
    this.data = {};
    this.notifyListeners(changes, "local");
  }

  // Storage change listeners
  onChanged = {
    addListener: (
      callback: (changes: Record<string, unknown>, areaName: string) => void,
    ) => {
      this.listeners.push(callback);
    },
    removeListener: (
      callback: (changes: Record<string, unknown>, areaName: string) => void,
    ) => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    },
  };

  // Helper methods for testing
  private notifyListeners(
    changes: Record<string, unknown>,
    areaName: string,
  ): void {
    for (const listener of this.listeners) {
      try {
        listener(changes, areaName);
      } catch (error) {
        console.error("Storage listener error:", error);
      }
    }
  }

  // Test utilities
  hasKey(key: string): boolean {
    return key in this.data;
  }

  getValue(key: string): unknown {
    return this.data[key];
  }

  getAllData(): Record<string, unknown> {
    return { ...this.data };
  }

  reset(): void {
    this.data = {};
    this.listeners = [];
  }

  // WXT-specific storage key helpers
  getTypedValue<T>(key: StorageKey<T>): T | undefined {
    return this.data[key] as T;
  }

  setTypedValue<T>(key: StorageKey<T>, value: T): void {
    this.data[key] = value;
  }
}

// Enhanced messaging mock with type safety
export class MockMessaging {
  private listeners: Array<{
    message: (
      message: unknown,
      sender: unknown,
      sendResponse: (response?: unknown) => void,
    ) => void;
    filter?: (message: unknown) => boolean;
  }> = [];

  // Send message to runtime
  async sendMessage<T extends keyof Messages>(
    message: Message<T>,
  ): Promise<Messages[T]["response"]> {
    const responses: unknown[] = [];

    for (const { message: listener, filter } of this.listeners) {
      if (!filter || filter(message)) {
        const response = await new Promise<unknown>((resolve) => {
          listener(
            message,
            { id: "test-sender", url: "https://example.com" },
            resolve,
          );
        });
        responses.push(response);
      }
    }

    // Return the first response or undefined
    return responses[0] as Messages[T]["response"];
  }

  // Message listeners
  onMessage = {
    addListener: (
      callback: (
        message: unknown,
        sender: unknown,
        sendResponse: (response?: unknown) => void,
      ) => void,
    ) => {
      this.listeners.push({ message: callback });
    },
    addListenerWithFilter: (
      callback: (
        message: unknown,
        sender: unknown,
        sendResponse: (response?: unknown) => void,
      ) => void,
      filter: (message: unknown) => boolean,
    ) => {
      this.listeners.push({ message: callback, filter });
    },
    removeListener: (
      callback: (
        message: unknown,
        sender: unknown,
        sendResponse: (response?: unknown) => void,
      ) => void,
    ) => {
      const index = this.listeners.findIndex(
        ({ message }) => message === callback,
      );
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    },
  };

  // Test utilities
  simulateMessage(
    message: unknown,
    sender = { id: "test-sender" },
  ): Promise<unknown[]> {
    const responses: unknown[] = [];

    for (const { message: listener, filter } of this.listeners) {
      if (!filter || filter(message)) {
        const response = new Promise<unknown>((resolve) => {
          listener(message, sender, resolve);
        });
        responses.push(response);
      }
    }

    return Promise.all(responses);
  }

  waitForMessage<T>(
    predicate: (message: unknown) => boolean,
    timeout = 5000,
  ): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        const index = this.listeners.findIndex(
          ({ message }) => message === listener,
        );
        if (index > -1) {
          this.listeners.splice(index, 1);
        }
        reject(new Error(`Message not received within ${timeout}ms`));
      }, timeout);

      const listener = (message: unknown) => {
        if (predicate(message)) {
          clearTimeout(timeoutId);
          const index = this.listeners.findIndex(
            ({ message: l }) => l === listener,
          );
          if (index > -1) {
            this.listeners.splice(index, 1);
          }
          resolve(message as T);
        }
      };

      this.listeners.push({ message: listener });
    });
  }

  getListenerCount(): number {
    return this.listeners.length;
  }

  reset(): void {
    this.listeners = [];
  }
}

// Mock tabs API
export class MockTabs {
  private tabs: chrome.tabs.Tab[] = [
    {
      id: 1,
      url: "https://example.com",
      active: true,
      windowId: 1,
    },
  ];
  private nextId = 2;

  async create(
    createProperties: chrome.tabs.CreateProperties,
  ): Promise<chrome.tabs.Tab> {
    const newTab: chrome.tabs.Tab = {
      id: this.nextId++,
      url: createProperties.url,
      active: createProperties.active ?? false,
      windowId: 1,
    };
    this.tabs.push(newTab);
    return newTab;
  }

  async query(queryInfo: chrome.tabs.QueryInfo): Promise<chrome.tabs.Tab[]> {
    return this.tabs.filter((tab) => {
      if (queryInfo.active !== undefined && tab.active !== queryInfo.active) {
        return false;
      }
      if (queryInfo.currentWindow !== undefined) {
        // Assume all tabs are in current window for testing
        return queryInfo.currentWindow;
      }
      return true;
    });
  }

  async sendMessage(tabId: number, message: unknown): Promise<unknown> {
    const tab = this.tabs.find((t) => t.id === tabId);
    if (!tab) {
      throw new Error(`Tab with id ${tabId} not found`);
    }
    return { success: true, tabId, message };
  }

  // Test utilities
  addTab(tab: Partial<chrome.tabs.Tab>): chrome.tabs.Tab {
    const newTab: chrome.tabs.Tab = {
      id: this.nextId++,
      url: "https://example.com",
      active: false,
      windowId: 1,
      ...tab,
    };
    this.tabs.push(newTab);
    return newTab;
  }

  removeTab(tabId: number): void {
    const index = this.tabs.findIndex((tab) => tab.id === tabId);
    if (index > -1) {
      this.tabs.splice(index, 1);
    }
  }

  getTab(tabId: number): chrome.tabs.Tab | undefined {
    return this.tabs.find((tab) => tab.id === tabId);
  }

  getAllTabs(): chrome.tabs.Tab[] {
    return [...this.tabs];
  }

  reset(): void {
    this.tabs = [
      {
        id: 1,
        url: "https://example.com",
        active: true,
        windowId: 1,
      },
    ];
    this.nextId = 2;
  }
}

// Mock runtime API
export class MockRuntime {
  private id = "test-extension-id";
  private messageHandlers: Array<(message: unknown) => void> = [];

  getURL(path: string): string {
    return `chrome-extension://${this.id}/${path}`;
  }

  async sendMessage(message: unknown): Promise<unknown> {
    const responses: unknown[] = [];

    for (const handler of this.messageHandlers) {
      const response = await new Promise<unknown>((resolve) => {
        handler(message, { id: "test-sender" }, resolve);
      });
      responses.push(response);
    }

    // Return the first response or default
    return responses.length > 0 ? responses[0] : { success: true };
  }

  onMessage = {
    addListener: (
      callback: (
        message: unknown,
        sender: unknown,
        sendResponse: (response?: unknown) => void,
      ) => void,
    ) => {
      this.messageHandlers.push(callback);
    },
    removeListener: (
      callback: (
        message: unknown,
        sender: unknown,
        sendResponse: (response?: unknown) => void,
      ) => void,
    ) => {
      const index = this.messageHandlers.findIndex(
        (handler) => handler === callback,
      );
      if (index > -1) {
        this.messageHandlers.splice(index, 1);
      }
    },
  };

  // Test utilities
  setId(id: string): void {
    this.id = id;
  }

  getId(): string {
    return this.id;
  }

  reset(): void {
    this.messageHandlers = [];
  }
}

// Factory function to create complete mock Chrome API
export function createMockChromeAPI() {
  const storage = new MockStorage();
  const messaging = new MockMessaging();
  const tabs = new MockTabs();
  const runtime = new MockRuntime();

  return {
    storage: {
      local: storage,
      sync: storage, // Use same instance for simplicity
    },
    runtime,
    tabs,
    messaging,
  };
}

// Event simulation utilities
export const eventSimulator = {
  simulateStorageChange: (
    changes: Record<string, unknown>,
    areaName = "local",
  ) => {
    // This would trigger the storage change event
    console.log("Storage change simulated:", changes, areaName);
  },

  simulateTabUpdate: (
    tabId: number,
    changeInfo: chrome.tabs.TabChangeInfo,
    tab: chrome.tabs.Tab,
  ) => {
    console.log("Tab update simulated:", tabId, changeInfo, tab);
  },

  simulateTabActivated: (activeInfo: chrome.tabs.TabActiveInfo) => {
    console.log("Tab activation simulated:", activeInfo);
  },

  simulateRuntimeMessage: (
    message: unknown,
    sender = { id: "test-sender" },
  ) => {
    console.log("Runtime message simulated:", message, sender);
  },
};
