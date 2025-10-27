/**
 * Example Test File for WXT Extension with Bun
 *
 * This file demonstrates how to use the test setup and utilities
 * for testing various components of the Chrome extension. It serves
 * as a reference and template for writing new tests.
 *
 * Examples include:
 * - Storage operations testing
 * - Message passing testing
 * - DOM manipulation testing
 * - Chrome API mocking
 * - Async testing patterns
 */

import { beforeEach, describe, expect, it } from "bun:test";
import { testCategories } from "./config";
import { MockMessaging, MockStorage, createMockChromeAPI } from "./mocks";
import { asyncHelpers, domHelpers, mockData, testContext } from "./utils";

// Example 1: Testing Storage Operations
describe("Storage Operations", () => {
  let mockStorage: MockStorage;

  beforeEach(() => {
    mockStorage = new MockStorage();
  });

  it("should store and retrieve values", async () => {
    // Set up test data
    const testData = { user: "test-user", theme: "dark" };

    // Store values
    await mockStorage.set(testData);

    // Retrieve values
    const result = await mockStorage.get();

    expect(result).toEqual(testData);
    expect(mockStorage.hasKey("user")).toBe(true);
    expect(mockStorage.getValue("theme")).toBe("dark");
  });

  it("should handle storage changes", async () => {
    let changeReceived = false;
    let receivedChanges: Record<string, unknown> = {};

    // Listen for storage changes
    mockStorage.onChanged.addListener((changes) => {
      changeReceived = true;
      receivedChanges = changes;
    });

    // Make a change
    await mockStorage.set({ newKey: "newValue" });

    expect(changeReceived).toBe(true);
    expect(receivedChanges.newKey).toEqual({
      oldValue: undefined,
      newValue: "newValue",
    });
  });

  it("should remove values correctly", async () => {
    // Set initial data
    await mockStorage.set({ tempKey: "tempValue" });
    expect(mockStorage.hasKey("tempKey")).toBe(true);

    // Remove the key
    await mockStorage.remove("tempKey");
    expect(mockStorage.hasKey("tempKey")).toBe(false);

    // Verify through get
    const result = await mockStorage.get("tempKey");
    expect(result.tempKey).toBeUndefined();
  });
});

// Example 2: Testing Message Passing
describe("Message Passing", () => {
  let mockMessaging: MockMessaging;

  beforeEach(() => {
    mockMessaging = new MockMessaging();
  });

  it("should send and receive messages", async () => {
    const testMessage = { type: "TEST", payload: "test-data" };
    let receivedMessage: unknown;

    // Set up message listener
    mockMessaging.onMessage.addListener((message, sender, sendResponse) => {
      receivedMessage = message;
      sendResponse({ success: true });
    });

    // Send message
    const response = await mockMessaging.sendMessage(testMessage);

    expect(receivedMessage).toEqual(testMessage);
    expect(response).toEqual({ success: true });
  });

  it("should wait for specific messages", async () => {
    const testMessage = { type: "ASYNC_TEST", data: "async-data" };

    // Start waiting for message
    const messagePromise = mockMessaging.waitForMessage(
      (msg) =>
        typeof msg === "object" &&
        msg !== null &&
        (msg as Record<string, unknown>).type === "ASYNC_TEST",
    );

    // Simulate message after delay
    setTimeout(async () => {
      await mockMessaging.simulateMessage(testMessage);
    }, 100);

    // Wait for the message
    const result = await messagePromise;
    expect(result).toEqual(testMessage);
  });
});

// Example 3: Testing DOM Manipulation
describe("DOM Manipulation", () => {
  beforeEach(() => {
    testContext.withDOM(`
      <div id="app">
        <button id="test-button" data-testid="test-button">Click me</button>
        <input id="test-input" data-testid="test-input" />
        <div id="test-output" data-testid="test-output"></div>
      </div>
    `);
  });

  it("should simulate user interactions", () => {
    const button = document.querySelector('[data-testid="test-button"]');
    const input = document.querySelector(
      '[data-testid="test-input"]',
    ) as HTMLInputElement;
    const output = document.querySelector('[data-testid="test-output"]');

    // Simulate input
    if (input) {
      domHelpers.simulateInput(input, "test value");
      expect(input.value).toBe("test value");
    }

    // Simulate click
    if (button) {
      domHelpers.simulateClick(button);
    }

    // Verify output exists
    expect(output).toBeTruthy();
  });

  it("should create and manipulate elements", () => {
    const container = document.getElementById("app");

    // Create new element
    const newElement = domHelpers.createElement(
      "div",
      {
        class: "test-class",
        "data-testid": "new-element",
      },
      "Test content",
    );

    // Append to container
    container?.appendChild(newElement);

    // Verify element exists
    const createdElement = document.querySelector(
      '[data-testid="new-element"]',
    );
    expect(createdElement).toBeTruthy();
    expect(createdElement?.textContent).toBe("Test content");
    expect(createdElement?.classList.contains("test-class")).toBe(true);
  });
});

// Example 4: Testing Chrome API Integration
describe("Chrome API Integration", () => {
  beforeEach(() => {
    const mockAPI = createMockChromeAPI();
    global.chrome = mockAPI as unknown as typeof chrome;
  });

  it("should use Chrome storage API", async () => {
    // Set up test data
    const testData = { "local:theme": "dark", "local:user": "test-user" };

    // Store data using Chrome API
    await chrome.storage.local.set(testData);

    // Retrieve data
    const result = await chrome.storage.local.get();

    expect(result).toEqual(testData);
  });

  it("should handle Chrome messaging", async () => {
    let receivedMessage: unknown;

    // Set up message listener
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      receivedMessage = message;
      sendResponse({ received: true });
    });

    // Send message
    const testMessage = { type: "TEST", data: "test-data" };
    const response = await chrome.runtime.sendMessage(testMessage);

    expect(receivedMessage).toEqual(testMessage);
    expect(response).toEqual({ received: true });
  });
});

// Example 5: Async Testing Patterns
describe("Async Testing Patterns", () => {
  it("should handle async operations with waitFor", async () => {
    let conditionMet = false;

    // Simulate async operation
    setTimeout(() => {
      conditionMet = true;
    }, 100);

    // Wait for condition
    await asyncHelpers.waitFor(() => conditionMet, 1000);

    expect(conditionMet).toBe(true);
  });

  it("should wait for DOM elements", async () => {
    // Simulate element appearing after delay
    setTimeout(() => {
      const element = document.createElement("div");
      element.setAttribute("data-testid", "delayed-element");
      document.body.appendChild(element);
    }, 100);

    // Wait for element
    const element = await asyncHelpers.waitForElement(
      "[data-testid='delayed-element']",
    );

    expect(element).toBeTruthy();
  });

  it("should handle multiple async operations", async () => {
    const promises = [
      asyncHelpers.wait(50),
      asyncHelpers.wait(100),
      asyncHelpers.wait(25),
    ];

    await Promise.all(promises);

    // All promises should resolve
    expect(true).toBe(true);
  });
});

// Example 6: Using Mock Data Generators
describe("Mock Data Generators", () => {
  it("should generate consistent mock data", () => {
    const user = mockData.user();
    const message = mockData.chatMessage();
    const task = mockData.task();

    expect(user).toHaveProperty("id", "test-user-id");
    expect(user).toHaveProperty("name", "Test User");

    expect(message).toHaveProperty("id", "test-message-id");
    expect(message).toHaveProperty("role", "user");

    expect(task).toHaveProperty("id", "test-task-id");
    expect(task).toHaveProperty("completed", false);
  });

  it("should support data overrides", () => {
    const customUser = mockData.user({
      name: "Custom User",
      email: "custom@example.com",
    });

    expect(customUser.name).toBe("Custom User");
    expect(customUser.email).toBe("custom@example.com");
    expect(customUser.id).toBe("test-user-id"); // Default value preserved
  });
});

// Example 7: Test Categories Configuration
describe("Test Categories", () => {
  it("should use unit test configuration", () => {
    const config = testCategories.unit.config;

    expect(config.defaultTimeout).toBe(3000);
    expect(config.asyncTimeout).toBe(5000);
    expect(config.verbose).toBe(false);
    expect(config.coverage).toBe(true);
  });

  it("should use integration test configuration", () => {
    const config = testCategories.integration.config;

    expect(config.defaultTimeout).toBe(10000);
    expect(config.asyncTimeout).toBe(20000);
    expect(config.verbose).toBe(true);
    expect(config.coverage).toBe(false);
  });
});

// Example 8: Error Handling Testing
describe("Error Handling", () => {
  it("should handle storage errors gracefully", async () => {
    const mockStorage = new MockStorage();

    // Try to get non-existent key
    const result = await mockStorage.get("non-existent-key");

    expect(result).toEqual({ "non-existent-key": undefined });
  });

  it("should handle message errors", async () => {
    const mockMessaging = new MockMessaging();

    // Send message with no listeners
    const response = await mockMessaging.sendMessage({ type: "NO_LISTENERS" });

    expect(response).toBeUndefined();
  });
});

// Example 9: Performance Testing
describe("Performance Testing", () => {
  it("should handle large storage operations efficiently", async () => {
    const mockStorage = new MockStorage();
    const largeDataSet: Record<string, unknown> = {};

    // Create large data set
    for (let i = 0; i < 1000; i++) {
      largeDataSet[`key-${i}`] = `value-${i}`;
    }

    const startTime = performance.now();

    // Store large data set
    await mockStorage.set(largeDataSet);

    const endTime = performance.now();
    const duration = endTime - startTime;

    // Should complete within reasonable time (adjust threshold as needed)
    expect(duration).toBeLessThan(1000); // 1 second

    // Verify data was stored correctly
    const result = await mockStorage.get();
    expect(Object.keys(result)).toHaveLength(1000);
  });
});
