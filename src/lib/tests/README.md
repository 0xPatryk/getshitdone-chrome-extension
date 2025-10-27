# Test Setup for WXT Extension with Bun

This directory contains a comprehensive test setup for the Chrome extension using Bun's test framework. The setup provides mocking for Chrome APIs, utilities for common testing patterns, and configuration for different test categories.

## Files Overview

### Core Setup Files

- **[`setup.ts`](./setup.ts)** - Main test setup file that configures Chrome API mocks and DOM environment
- **[`utils.ts`](./utils.ts)** - Utility functions for common testing patterns (storage, messaging, DOM, async operations)
- **[`mocks.ts`](./mocks.ts)** - Advanced mock implementations for storage, messaging, tabs, and runtime APIs
- **[`config.ts`](./config.ts)** - Test environment configuration and category-specific settings
- **[`example.test.ts`](./example.test.ts)** - Comprehensive examples demonstrating how to use the test setup

## Features

### Chrome API Mocking
- Complete Chrome storage API mocking (local and sync)
- Runtime API mocking with message passing
- Tabs API mocking for tab management
- Event simulation and listener management

### Test Utilities
- Storage helpers for testing data persistence
- Message passing utilities for extension communication
- DOM manipulation helpers for UI testing
- Async testing utilities for timing-dependent operations
- Mock data generators for consistent test data

### Test Configuration
- Category-specific configurations (unit, integration, e2e, component)
- Timeout and environment variable management
- Coverage and reporting configuration

## Usage

### Basic Test Structure

```typescript
import { describe, expect, it, beforeEach } from "bun:test";
import { storageHelpers, mockData } from "./utils";
import { MockStorage } from "./mocks";

describe("Feature Tests", () => {
  let mockStorage: MockStorage;

  beforeEach(() => {
    mockStorage = new MockStorage();
  });

  it("should test storage operations", async () => {
    const testData = mockData.user();
    await mockStorage.set(testData);
    
    const result = await mockStorage.get();
    expect(result).toEqual(testData);
  });
});
```

### Running Tests

```bash
# Run all tests
bun test

# Run specific test categories
bun run test:unit
bun run test:integration
bun run test:e2e
bun run test:component

# Run with coverage
bun run test:coverage

# Watch mode
bun run test:watch
```

### Test Categories

#### Unit Tests
- Fast, isolated tests
- Mock external dependencies
- File pattern: `*.unit.test.{ts,tsx}`

#### Integration Tests
- Test component interactions
- Use real storage and messaging mocks
- File pattern: `*.integration.test.{ts,tsx}`

#### E2E Tests
- Full workflow testing
- Longer timeouts
- File pattern: `*.e2e.test.{ts,tsx}`

#### Component Tests
- React component testing
- DOM manipulation
- File pattern: `*.component.test.{ts,tsx}`

## Chrome Extension Specific Testing

### Storage Testing
```typescript
import { storageHelpers } from "./utils";

// Set up initial storage state
storageHelpers.setInitialStorage({ "local:theme": "dark" });

// Test storage operations
await chrome.storage.local.set({ "local:user": "test-user" });
const result = await chrome.storage.local.get("local:user");
expect(result["local:user"]).toBe("test-user");
```

### Message Passing Testing
```typescript
import { messageHelpers } from "./utils";

// Set up message listener
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "TEST") {
    sendResponse({ success: true });
  }
});

// Send test message
const response = await chrome.runtime.sendMessage({ type: "TEST" });
expect(response).toEqual({ success: true });
```

### Tabs API Testing
```typescript
// Create a new tab
const tab = await chrome.tabs.create({ url: "https://example.com" });
expect(tab.url).toBe("https://example.com");

// Query for active tabs
const activeTabs = await chrome.tabs.query({ active: true });
expect(activeTabs).toHaveLength(1);
```

## Mock Data Generators

Use the built-in mock data generators for consistent test data:

```typescript
import { mockData } from "./utils";

const user = mockData.user({ name: "Custom User" });
const message = mockData.chatMessage({ role: "assistant" });
const task = mockData.task({ completed: true });
```

## DOM Testing

For UI component testing, use the DOM utilities:

```typescript
import { domHelpers, testContext } from "./utils";

// Set up DOM environment
testContext.withDOM('<div id="app"></div>');

// Create elements
const button = domHelpers.createElement("button", { 
  "data-testid": "test-button" 
}, "Click me");

// Simulate interactions
domHelpers.simulateClick(button);
```

## Async Testing

Handle async operations with the provided utilities:

```typescript
import { asyncHelpers } from "./utils";

// Wait for conditions
await asyncHelpers.waitFor(() => conditionMet, 5000);

// Wait for DOM elements
const element = await asyncHelpers.waitForElement("#my-element");

// Wait for specific time
await asyncHelpers.wait(1000);
```

## Best Practices

1. **Use appropriate test categories** - Unit tests for logic, integration tests for interactions
2. **Mock external dependencies** - Use the provided Chrome API mocks
3. **Clean up after tests** - Use beforeEach/afterEach hooks
4. **Use descriptive test names** - Clearly indicate what is being tested
5. **Test edge cases** - Include error handling and boundary conditions
6. **Keep tests isolated** - Each test should be independent
7. **Use mock data generators** - Maintain consistency across tests

## Configuration

Test configuration is managed in [`config.ts`](./config.ts). You can customize:

- Default timeouts
- Environment variables
- Mock permissions
- Coverage settings
- Test patterns

## Troubleshooting

### Common Issues

1. **Chrome API not available** - Ensure test setup is imported
2. **DOM not available** - Use `testContext.withDOM()` for DOM tests
3. **Async timeouts** - Increase timeout in test configuration
4. **Mock data inconsistency** - Use provided mock data generators

### Debugging

Enable verbose logging for debugging:

```typescript
import { testCategories } from "./config";

// Enable verbose output
testCategories.unit.enableVerbose();
```

## Integration with WXT

The test setup is designed to work seamlessly with WXT:

- Uses WXT's storage patterns with `local:` prefix
- Compatible with WXT's messaging system
- Supports WXT's entry point structure
- Works with WXT's build and development workflows

## Next Steps

1. Explore the [`example.test.ts`](./example.test.ts) file for comprehensive examples
2. Start writing tests for your extension features
3. Configure CI/CD to run tests automatically
4. Add coverage reporting to your development workflow
5. Extend the test setup as needed for specific requirements