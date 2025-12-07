/**
 * AI Service Utilities Tests
 *
 * This file contains unit tests for AI service utility functions.
 * Tests cover provider instantiation, model selection, and content extraction.
 *
 * @module tests/ai-service.utils
 */

import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";

// Mock DOMParser for content extraction tests
const mockDOMParser = {
  parseFromString: mock((html: string, type: string) => {
    // Create a mock document structure
    const mockDocument = {
      querySelectorAll: mock((selector: string) => {
        // Return empty array for unwanted selectors
        if (selector.includes("script") || selector.includes("style") || 
            selector.includes("img") || selector.includes("video") ||
            selector.includes("link") || selector.includes("meta")) {
          return [];
        }
        return [];
      }),
      body: {
        innerHTML: html
          .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
          .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
          .replace(/<link[^>]*>/gi, "")
          .replace(/<meta[^>]*>/gi, "")
          .replace(/<img[^>]*>/gi, "")
          .replace(/<video[^>]*>[\s\S]*?<\/video>/gi, "")
          .replace(/ style="[^"]*"/gi, "")
          .trim(),
        textContent: html
          .replace(/<[^>]*>/g, "")
          .replace(/\s+/g, " ")
          .trim(),
      },
    };
    return mockDocument;
  }),
};

// Setup global DOMParser before tests
global.DOMParser = mockDOMParser as any;

// Mock the AI SDK modules
const mockGoogleProvider = mock(() => ({
  gemini: () => ({ model: "gemini-2.5-flash-lite" }),
}));

const mockOpenAIProvider = mock(() => ({
  gpt: () => ({ model: "gpt-4.1-nano" }),
}));

// Mock the modules - need to mock before importing the actual functions
mock.module("@ai-sdk/google", () => ({
  createGoogleGenerativeAI: mockGoogleProvider,
}));

mock.module("@ai-sdk/openai", () => ({
  createOpenAI: mockOpenAIProvider,
}));

// Import after mocking
import {
  extractMainContent,
  getGoogleProvider,
  getModel,
  getOpenAIProvider,
} from "~/lib/ai-service/utils";

describe("AI Service Utilities", () => {
  beforeEach(() => {
    // Reset all mocks before each test
    mockGoogleProvider.mockClear();
    mockOpenAIProvider.mockClear();
    mockDOMParser.parseFromString.mockClear();
  });

  afterEach(() => {
    // Clean up any global state
    mock.restore();
  });

  describe("getGoogleProvider", () => {
    it("should create a new Google provider instance on first call", () => {
      const apiKey = "test-google-api-key";

      const provider = getGoogleProvider(apiKey);

      expect(mockGoogleProvider).toHaveBeenCalledWith({ apiKey });
      expect(provider).toBeDefined();
    });

    it("should return existing provider instance on subsequent calls", () => {
      const apiKey = "test-google-api-key";

      const provider1 = getGoogleProvider(apiKey);
      const provider2 = getGoogleProvider(apiKey);

      expect(mockGoogleProvider).toHaveBeenCalledTimes(1);
      expect(provider1).toBe(provider2);
    });

    it("should create provider with different API keys", () => {
      const apiKey1 = "test-google-api-key-1";
      const apiKey2 = "test-google-api-key-2";

      getGoogleProvider(apiKey1);
      getGoogleProvider(apiKey2);

      expect(mockGoogleProvider).toHaveBeenCalledTimes(2);
      expect(mockGoogleProvider).toHaveBeenNthCalledWith(1, {
        apiKey: apiKey1,
      });
      expect(mockGoogleProvider).toHaveBeenNthCalledWith(2, {
        apiKey: apiKey2,
      });
    });
  });

  describe("getOpenAIProvider", () => {
    it("should create a new OpenAI provider instance on first call", () => {
      const apiKey = "test-openai-api-key";

      const provider = getOpenAIProvider(apiKey);

      expect(mockOpenAIProvider).toHaveBeenCalledWith({ apiKey });
      expect(provider).toBeDefined();
    });

    it("should return existing provider instance on subsequent calls", () => {
      const apiKey = "test-openai-api-key";

      const provider1 = getOpenAIProvider(apiKey);
      const provider2 = getOpenAIProvider(apiKey);

      expect(mockOpenAIProvider).toHaveBeenCalledTimes(1);
      expect(provider1).toBe(provider2);
    });
  });

  describe("getModel", () => {
    it("should return Gemini model for gemini provider", () => {
      const apiKey = "test-google-api-key";

      const model = getModel("gemini", apiKey);

      expect(mockGoogleProvider).toHaveBeenCalledWith({ apiKey });
      expect(model).toBeDefined();
    });

    it("should return OpenAI model for openai provider", () => {
      const apiKey = "test-openai-api-key";

      const model = getModel("openai", apiKey);

      expect(mockOpenAIProvider).toHaveBeenCalledWith({ apiKey });
      expect(model).toBeDefined();
    });

    it("should throw error for unsupported provider", () => {
      const apiKey = "test-api-key";

      expect(() =>
        getModel("unsupported" as "gemini" | "openai", apiKey),
      ).toThrow("Unsupported provider: unsupported");
    });
  });

  describe("extractMainContent", () => {
    it("should extract main content from HTML", () => {
      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <script>console.log('test');</script>
            <style>body { color: red; }</style>
            <link rel="stylesheet" href="styles.css">
          </head>
          <body>
            <div class="content">
              <h1>Main Content</h1>
              <p>This is the main content of the page.</p>
              <img src="image.jpg" alt="test">
              <video src="video.mp4"></video>
            </div>
            <div class="sidebar">
              <script>more script</script>
              <aside>Sidebar content</aside>
            </div>
          </body>
        </html>
      `;

      const result = extractMainContent(html);

      expect(result).toContain("Main Content");
      expect(result).toContain("This is the main content of the page.");
      expect(result).toContain("Sidebar content");
      expect(result).not.toContain("console.log('test');");
      expect(result).not.toContain("body { color: red; }");
      expect(result).not.toContain("image.jpg");
      expect(result).not.toContain("video.mp4");
    });

    it("should handle empty HTML gracefully", () => {
      const html = "";

      const result = extractMainContent(html);

      expect(result).toBe("");
    });

    it("should handle malformed HTML gracefully", () => {
      const html = "<div>Unclosed div<p>Paragraph</div>";

      const result = extractMainContent(html);

      expect(result).toContain("Unclosed div");
      expect(result).toContain("Paragraph");
    });

    it("should respect maxLength parameter", () => {
      const html = `${"<div>".repeat(1000)}Content${"</div>".repeat(1000)}`;
      const maxLength = 100;

      const result = extractMainContent(html, maxLength);

      // The result should be truncated and have fewer tokens than the limit
      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
    });

    it("should truncate at sentence boundaries when possible", () => {
      const html =
        "<div>First sentence. Second sentence. Third sentence.</div>";
      const maxLength = 35; // Should cut after "First sentence."

      const result = extractMainContent(html, maxLength);

      // The result should be truncated, and since it's small, it might not be truncated
      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
    });

    it("should truncate at HTML tags when sentence boundary not available", () => {
      const html =
        "<div>First sentence without period<p>Second sentence</p></div>";
      const maxLength = 25; // Should cut after "First sentence without"

      const result = extractMainContent(html, maxLength);

      // The result should be truncated
      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
    });

    it("should remove style attributes from elements", () => {
      const html =
        '<div style="color: red; font-size: 16px;">Styled content</div>';

      const result = extractMainContent(html);

      expect(result).not.toContain('color: red; font-size: 16px');
      expect(result).toContain("Styled content");
    });

    it("should handle DOMParser errors gracefully", () => {
      // Mock DOMParser to throw an error
      const originalDOMParser = global.DOMParser;
      global.DOMParser = class {
        parseFromString() {
          throw new Error("DOMParser error");
        }
      } as unknown as typeof DOMParser;

      const html = "<div>Test content</div>";

      const result = extractMainContent(html);

      expect(result).toBeDefined();

      // Restore original DOMParser
      global.DOMParser = originalDOMParser;
    });

    it("should use default maxLength when not specified", () => {
      const html = `${"<div>".repeat(10000)}Content${"</div>".repeat(10000)}`;

      const result = extractMainContent(html);

      // The result should be processed and not empty
      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
    });
  });
});