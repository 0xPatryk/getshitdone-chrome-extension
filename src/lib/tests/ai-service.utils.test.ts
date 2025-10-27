/**
 * Unit Tests for AI Service Utilities
 *
 * This file contains comprehensive unit tests for the AI service utility functions
 * in the ai-service module, focusing on the logic rather than external dependencies.
 *
 * @file ai-service.utils.test.ts
 */

import { beforeEach, describe, expect, it } from "bun:test";
import type { AIProvider } from "~/lib/ai-service/types";

describe("AI Service Utils - getModel", () => {
  it("should throw an error for unsupported provider", () => {
    // Arrange
    const provider = "unsupported" as AIProvider;
    const apiKey = "test-api-key";

    // Act & Assert
    // We'll test the actual function without mocking
    // This tests the error handling logic directly
    expect(() => {
      // Import the function directly in the test
      const { getModel } = require("~/lib/ai-service/utils");
      return getModel(provider, apiKey);
    }).toThrow("Unsupported provider: unsupported");
  });

  it("should handle gemini provider", () => {
    // Arrange
    const provider: AIProvider = "gemini";
    const apiKey = "test-google-api-key";

    // Act & Assert
    // We'll test that the function doesn't throw for valid providers
    expect(() => {
      const { getModel } = require("~/lib/ai-service/utils");
      return getModel(provider, apiKey);
    }).not.toThrow();
  });

  it("should handle openai provider", () => {
    // Arrange
    const provider: AIProvider = "openai";
    const apiKey = "test-openai-api-key";

    // Act & Assert
    // We'll test that the function doesn't throw for valid providers
    expect(() => {
      const { getModel } = require("~/lib/ai-service/utils");
      return getModel(provider, apiKey);
    }).not.toThrow();
  });
});

describe("AI Service Utils - getGoogleProvider", () => {
  it("should create a Google provider instance", () => {
    // Arrange
    const apiKey = "test-google-api-key";

    // Act & Assert
    // We'll test that the function creates a provider instance
    expect(() => {
      const { getGoogleProvider } = require("~/lib/ai-service/utils");
      const provider = getGoogleProvider(apiKey);
      // The function should return a provider instance
      expect(provider).toBeDefined();
      expect(typeof provider).toBe("function");
    }).not.toThrow();
  });
});

describe("AI Service Utils - getOpenAIProvider", () => {
  it("should create an OpenAI provider instance", () => {
    // Arrange
    const apiKey = "test-openai-api-key";

    // Act & Assert
    // We'll test that the function creates a provider instance
    expect(() => {
      const { getOpenAIProvider } = require("~/lib/ai-service/utils");
      const provider = getOpenAIProvider(apiKey);
      // The function should return a provider instance
      expect(provider).toBeDefined();
      expect(typeof provider).toBe("function");
    }).not.toThrow();
  });
});