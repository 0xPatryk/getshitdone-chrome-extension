/**
 * Test Environment Configuration for WXT Extension with Bun
 *
 * This file configures the test environment for the Chrome extension,
 * providing global setup, teardown, and configuration options. It's designed
 * to work with Bun's test framework and integrates with the test setup files.
 *
 * Key features:
 * - Global test configuration
 * - Environment variable setup
 * - Test timeout configuration
 * - Global test hooks
 * - Test reporter configuration
 */

import type { TestConfig } from "bun:test";

// Test configuration options
export interface TestEnvironmentConfig {
  // Timeout configuration
  defaultTimeout: number;
  asyncTimeout: number;

  // Environment configuration
  mockChromeAPIs: boolean;
  setupDOM: boolean;

  // Reporting configuration
  verbose: boolean;
  coverage: boolean;

  // Browser extension specific
  extensionId: string;
  mockPermissions: string[];
}

// Default test configuration
export const defaultTestConfig: TestEnvironmentConfig = {
  defaultTimeout: 5000,
  asyncTimeout: 10000,
  mockChromeAPIs: true,
  setupDOM: true,
  verbose: false,
  coverage: false,
  extensionId: "test-extension-id",
  mockPermissions: ["storage", "tabs", "runtime", "scripting"],
};

// Global test configuration for Bun
export const testConfig: TestConfig = {
  // Test timeout configuration
  timeout: defaultTestConfig.defaultTimeout,

  // Test runner configuration
  bail: false, // Continue running tests after failures
  preload: [
    // Load test setup files
    "./src/lib/tests/setup.ts",
    "./src/lib/tests/mocks.ts",
    "./src/lib/tests/utils.ts",
  ],

  // Test environment setup
  setup: async () => {
    // Set up global test environment
    (global as typeof global & { testConfig: TestEnvironmentConfig }).testConfig = defaultTestConfig;

    // Configure console for tests
    if (defaultTestConfig.verbose) {
      console.log("Test environment setup completed");
    }
  },

  // Test environment teardown
  teardown: async () => {
    // Clean up global test environment
    if (defaultTestConfig.verbose) {
      console.log("Test environment teardown completed");
    }
  },
};

// Environment variable configuration for tests
export const testEnvironment = {
  // Set test environment variables
  setup: () => {
    process.env.NODE_ENV = "test";
    process.env.BUN_ENV = "test";

    // Extension-specific environment variables
    process.env.EXTENSION_ID = defaultTestConfig.extensionId;
    process.env.MOCK_PERMISSIONS = defaultTestConfig.mockPermissions.join(",");

    // API keys for testing (use mock keys)
    process.env.VITE_OPENAI_API_KEY = "test-openai-key";
    process.env.VITE_GOOGLE_AI_API_KEY = "test-google-ai-key";
  },

  // Reset environment variables
  reset: () => {
    // Keep test environment variables but reset others
    process.env.NODE_ENV = "test";
    process.env.BUN_ENV = "test";
  },
};

// Test suite configuration helpers
export const configureTestSuite = (
  overrides: Partial<TestEnvironmentConfig> = {},
) => {
  const config = { ...defaultTestConfig, ...overrides };

  return {
    config,

    // Configure test timeout
    setTimeout: (timeout: number) => {
      testConfig.timeout = timeout;
    },

    // Enable verbose logging
    enableVerbose: () => {
      config.verbose = true;
      console.log("Verbose test logging enabled");
    },

    // Enable coverage collection
    enableCoverage: () => {
      config.coverage = true;
      console.log("Test coverage collection enabled");
    },
  };
};

// Test category configurations
export const testCategories = {
  // Unit test configuration
  unit: configureTestSuite({
    defaultTimeout: 3000,
    asyncTimeout: 5000,
    verbose: false,
    coverage: true,
  }),

  // Integration test configuration
  integration: configureTestSuite({
    defaultTimeout: 10000,
    asyncTimeout: 20000,
    verbose: true,
    coverage: false,
  }),

  // E2E test configuration
  e2e: configureTestSuite({
    defaultTimeout: 30000,
    asyncTimeout: 60000,
    verbose: true,
    coverage: false,
  }),

  // Component test configuration
  component: configureTestSuite({
    defaultTimeout: 5000,
    asyncTimeout: 10000,
    verbose: false,
    coverage: true,
  }),
};

// Test file patterns
export const testPatterns = {
  unit: "**/*.unit.test.{ts,tsx}",
  integration: "**/*.integration.test.{ts,tsx}",
  e2e: "**/*.e2e.test.{ts,tsx}",
  component: "**/*.component.test.{ts,tsx}",
  all: "**/*.test.{ts,tsx}",
};

// Test script configurations
export const testScripts = {
  // Run all tests
  all: "bun test",

  // Run unit tests only
  unit: `bun test ${testPatterns.unit}`,

  // Run integration tests only
  integration: `bun test ${testPatterns.integration}`,

  // Run E2E tests only
  e2e: `bun test ${testPatterns.e2e}`,

  // Run component tests only
  component: `bun test ${testPatterns.component}`,

  // Run tests with coverage
  coverage: "bun test --coverage",

  // Run tests in watch mode
  watch: "bun test --watch",

  // Run tests with verbose output
  verbose: "bun test --verbose",

  // Run specific test file
  file: (file: string) => `bun test ${file}`,

  // Run tests matching a pattern
  pattern: (pattern: string) => `bun test ${pattern}`,
};

// Global test utilities
export const globalTestUtils = {
  // Get current test configuration
  getConfig: (): TestEnvironmentConfig => {
    return (global as typeof global & { testConfig: TestEnvironmentConfig }).testConfig;
  },

  // Check if running in test environment
  isTestEnvironment: (): boolean => {
    return process.env.NODE_ENV === "test" || process.env.BUN_ENV === "test";
  },

  // Get test category from file path
  getTestCategory: (filePath: string): keyof typeof testCategories | null => {
    if (filePath.includes(".unit.test.")) return "unit";
    if (filePath.includes(".integration.test.")) return "integration";
    if (filePath.includes(".e2e.test.")) return "e2e";
    if (filePath.includes(".component.test.")) return "component";
    return null;
  },

  // Configure test based on file path
  configureTestFromFile: (filePath: string) => {
    const category = globalTestUtils.getTestCategory(filePath);
    if (category) {
      return testCategories[category];
    }
    return testCategories.unit; // Default to unit tests
  },
};

// Export configuration for use in test files
export { defaultTestConfig as testConfigDefaults };
export type { TestEnvironmentConfig };
