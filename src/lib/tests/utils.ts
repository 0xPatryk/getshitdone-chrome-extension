/**
 * Test Utilities for WXT Extension with Bun
 *
 * This file provides utility functions and helpers for common testing patterns
 * used throughout the Chrome extension test suite. These utilities simplify
 * testing of React components, storage operations, messaging, and other
 * extension-specific functionality.
 *
 * Key features:
 * - React component testing helpers
 * - Storage testing utilities
 * - Message passing test helpers
 * - DOM manipulation utilities
 * - Async testing helpers
 */

import { render, type RenderOptions } from "@testing-library/react";
import type { ReactElement } from "react";
import { mockStorageData, mockMessageListeners } from "./setup";

// Custom render function with providers
export const renderWithProviders = (
  ui: ReactElement,
  options?: RenderOptions,
) => {
  // Add any providers here if needed (Theme, Query, etc.)
  return render(ui, {
    ...options,
  });
};

// Storage testing utilities
export const storageHelpers = {
  // Set up initial storage state
  setInitialStorage: (data: Record<string, unknown>) => {
    Object.assign(mockStorageData.local, data);
  },

  // Get current storage state
  getStorageState: () => ({ ...mockStorageData.local }),

  // Clear storage
  clearStorage: () => {
    mockStorageData.local = {};
  },

  // Check if key exists in storage
  hasKey: (key: string) => key in mockStorageData.local,

  // Get specific value from storage
  getValue: (key: string) => mockStorageData.local[key],

  // Set specific value in storage
  setValue: (key: string, value: unknown) => {
    mockStorageData.local[key] = value;
  },
};

// Message testing utilities
export const messageHelpers = {
  // Get current message listeners
  getListeners: () => [...mockMessageListeners],

  // Clear all message listeners
  clearListeners: () => {
    mockMessageListeners.length = 0;
  },

  // Simulate receiving a message
  simulateMessage: (message: unknown, sender = { id: "test-sender" }) => {
    const responses: unknown[] = [];
    for (const listener of mockMessageListeners) {
      const response = new Promise<unknown>((resolve) => {
        listener(message, sender, resolve);
      });
      responses.push(response);
    }
    return Promise.all(responses);
  },

  // Wait for a specific message type
  waitForMessage: (predicate: (message: unknown) => boolean) => {
    return new Promise<unknown>((resolve) => {
      const listener = (message: unknown) => {
        if (predicate(message)) {
          const index = mockMessageListeners.indexOf(listener);
          if (index > -1) {
            mockMessageListeners.splice(index, 1);
          }
          resolve(message);
        }
      };
      mockMessageListeners.push(listener);
    });
  },
};

// DOM testing utilities
export const domHelpers = {
  // Create a mock element
  createElement: (tag: string, attributes: Record<string, string> = {}, children = "") => {
    const element = document.createElement(tag);
    for (const [key, value] of Object.entries(attributes)) {
      element.setAttribute(key, value);
    }
    if (children) {
      element.textContent = children;
    }
    return element;
  },

  // Create a mock shadow root
  createShadowRoot: (host: HTMLElement) => {
    const shadowRoot = host.attachShadow({ mode: "open" });
    return shadowRoot;
  },

  // Simulate user input
  simulateInput: (element: HTMLInputElement, value: string) => {
    element.value = value;
    element.dispatchEvent(new Event("input", { bubbles: true }));
    element.dispatchEvent(new Event("change", { bubbles: true }));
  },

  // Simulate click event
  simulateClick: (element: HTMLElement) => {
    element.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  },

  // Simulate keyboard event
  simulateKeyboard: (element: HTMLElement, key: string, options: KeyboardEventInit = {}) => {
    element.dispatchEvent(new KeyboardEvent("keydown", { key, ...options }));
    element.dispatchEvent(new KeyboardEvent("keyup", { key, ...options }));
  },
};

// Async testing utilities
export const asyncHelpers = {
  // Wait for a specific amount of time
  wait: (ms: number) => new Promise((resolve) => setTimeout(resolve, ms)),

  // Wait for condition to be true
  waitFor: (
    condition: () => boolean,
    timeout = 5000,
    interval = 100,
  ): Promise<void> => {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      
      const check = () => {
        if (condition()) {
          resolve();
        } else if (Date.now() - startTime > timeout) {
          reject(new Error(`Condition not met within ${timeout}ms`));
        } else {
          setTimeout(check, interval);
        }
      };
      
      check();
    });
  },

  // Wait for element to appear in DOM
  waitForElement: (
    selector: string,
    timeout = 5000,
  ): Promise<Element> => {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      
      const check = () => {
        // Ensure document exists
        if (typeof document === 'undefined') {
          reject(new Error('Document not available in test environment'));
          return;
        }
        
        const element = document.querySelector(selector);
        if (element) {
          resolve(element);
        } else if (Date.now() - startTime > timeout) {
          reject(new Error(`Element ${selector} not found within ${timeout}ms`));
        } else {
          setTimeout(check, 50);
        }
      };
      
      check();
    });
  },
};

// Mock data generators
export const mockData = {
  // Generate mock user data
  user: (overrides: Partial<Record<string, unknown>> = {}) => ({
    id: "test-user-id",
    name: "Test User",
    email: "test@example.com",
    ...overrides,
  }),

  // Generate mock chat message
  chatMessage: (overrides: Partial<Record<string, unknown>> = {}) => ({
    id: "test-message-id",
    content: "Test message content",
    role: "user" as const,
    timestamp: Date.now(),
    ...overrides,
  }),

  // Generate mock task data
  task: (overrides: Partial<Record<string, unknown>> = {}) => ({
    id: "test-task-id",
    title: "Test Task",
    description: "Test task description",
    completed: false,
    createdAt: Date.now(),
    ...overrides,
  }),

  // Generate mock storage data
  storageData: (overrides: Record<string, unknown> = {}) => ({
    "local:user": mockData.user(),
    "local:theme": "light",
    "local:settings": { notifications: true },
    ...overrides,
  }),
};

// Test context helpers
export const testContext = {
  // Create a test context with specific storage state
  withStorage: (storageData: Record<string, unknown>) => {
    storageHelpers.setInitialStorage(storageData);
    return {
      cleanup: () => storageHelpers.clearStorage(),
    };
  },

  // Create a test context with message listeners
  withMessages: () => {
    const originalListeners = [...mockMessageListeners];
    return {
      cleanup: () => {
        mockMessageListeners.length = 0;
        mockMessageListeners.push(...originalListeners);
      },
    };
  },

  // Create a test context with DOM setup
  withDOM: (html = "<div></div>") => {
    // Ensure document and body exist
    if (typeof document === 'undefined') {
      const mockDocument = {
        body: {
          innerHTML: "",
        },
        createElement: (tag: string) => ({
          tagName: tag.toUpperCase(),
          setAttribute: () => {},
          appendChild: () => {},
          classList: {
            contains: () => false,
          },
          textContent: "",
          dispatchEvent: () => {},
        }),
        querySelector: () => null,
      };
      (global as { document: typeof mockDocument }).document = mockDocument;
    }
    
    document.body.innerHTML = html;
    return {
      cleanup: () => {
        document.body.innerHTML = "";
      },
    };
  },
};

// Assertion helpers
export const assertions = {
  // Assert that storage contains specific key/value
  storageContains: async (key: string, expectedValue: unknown) => {
    const actualValue = await chrome.storage.local.get(key);
    global.expect(actualValue[key]).toEqual(expectedValue);
  },

  // Assert that element exists in DOM
  elementExists: (selector: string) => {
    global.expect(document.querySelector(selector)).toBeTruthy();
  },

  // Assert that element has specific text
  elementHasText: (selector: string, expectedText: string) => {
    const element = document.querySelector(selector);
    global.expect(element?.textContent).toContain(expectedText);
  },

  // Assert that element has specific class
  elementHasClass: (selector: string, className: string) => {
    const element = document.querySelector(selector);
    global.expect(element?.classList.contains(className)).toBe(true);
  },
};