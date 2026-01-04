/**
 * AI Service Utilities Unit Tests
 *
 * Tests for token counting, content extraction, provider factories, and model selection.
 * These test pure functions and singleton patterns.
 *
 * Note: Tests run in bun environment with happy-dom polyfill for DOMParser.
 *
 * @module ai-service/utils.test
 */

import { beforeEach, describe, expect, it } from "bun:test";

import {
  countTokens,
  extractMainContent,
  getGoogleProvider,
  getModel,
  getOpenAIProvider,
  resetProviders,
} from "./utils";

describe("countTokens", () => {
  describe("basic functionality", () => {
    it("should return 0 for empty string", () => {
      expect(countTokens("")).toBe(0);
    });

    it("should return 0 for null-ish values", () => {
      // @ts-expect-error - testing edge case
      expect(countTokens(null)).toBe(0);
      // @ts-expect-error - testing edge case
      expect(countTokens(undefined)).toBe(0);
    });

    it("should estimate tokens for plain text", () => {
      // Plain text uses ~4 characters per token
      const text = "This is a simple test sentence.";
      const tokens = countTokens(text);
      expect(tokens).toBeGreaterThan(0);
      expect(tokens).toBe(Math.ceil(text.length / 4));
    });

    it("should estimate tokens for HTML content", () => {
      // HTML uses ~3 characters per token due to tags
      const html = "<div><p>Hello world</p></div>";
      const tokens = countTokens(html);
      expect(tokens).toBeGreaterThan(0);
      expect(tokens).toBe(Math.ceil(html.length / 3));
    });
  });

  describe("HTML detection", () => {
    it("should detect HTML tags and use HTML ratio", () => {
      const html = "<span>test</span>";
      const plainText = "span test span";

      const htmlTokens = countTokens(html);
      const plainTokens = countTokens(plainText);

      // HTML uses ratio 3, plain text uses ratio 4
      // For same-ish length, HTML should produce more tokens
      expect(htmlTokens).toBe(Math.ceil(html.length / 3));
      expect(plainTokens).toBe(Math.ceil(plainText.length / 4));
    });

    it("should handle nested HTML tags", () => {
      const nestedHtml =
        "<div><section><article><p>Content</p></article></section></div>";
      const tokens = countTokens(nestedHtml);
      expect(tokens).toBe(Math.ceil(nestedHtml.length / 3));
    });

    it("should detect self-closing tags", () => {
      const selfClosing = "<img src='test.jpg' /><br/>";
      const tokens = countTokens(selfClosing);
      expect(tokens).toBe(Math.ceil(selfClosing.length / 3));
    });
  });

  describe("edge cases", () => {
    it("should handle whitespace only content", () => {
      const whitespace = "   \n\t   ";
      const tokens = countTokens(whitespace);
      expect(tokens).toBeGreaterThan(0);
    });

    it("should handle very long strings", () => {
      const longText = "word ".repeat(10000);
      const tokens = countTokens(longText);
      expect(tokens).toBeGreaterThan(0);
      expect(tokens).toBe(Math.ceil(longText.length / 4));
    });

    it("should handle unicode content", () => {
      const unicode = "日本語テスト 🚀 اختبار";
      const tokens = countTokens(unicode);
      expect(tokens).toBeGreaterThan(0);
    });

    it("should handle mixed HTML and text", () => {
      const mixed = "Start text <div>HTML section</div> end text";
      const tokens = countTokens(mixed);
      expect(tokens).toBe(Math.ceil(mixed.length / 3)); // Should detect HTML
    });
  });
});

describe("extractMainContent", () => {
  describe("extraction behavior", () => {
    // Tests behavior with DOMParser available via valid environment
    it("should return content when under token limit", () => {
      const html = "<p>Hello World</p>";
      const result = extractMainContent(html);
      // Content is returned cleaned or as-is
      expect(result).toContain("Hello");
      expect(result).toContain("World");
    });

    it("should handle short simple content", () => {
      const html = "<div>Simple content</div>";
      const result = extractMainContent(html);
      expect(typeof result).toBe("string");
      expect(result.length).toBeGreaterThan(0);
    });

    it("should not throw for any HTML input", () => {
      const inputs = [
        "<script>alert('xss')</script>",
        "<style>.red{color:red}</style>",
        '<img src="test.jpg"/>',
        "<video src='v.mp4'></video>",
        '<iframe src="https://example.com"></iframe>',
        "<div><p>Unclosed paragraph<div>Nested</p></div>",
      ];

      for (const html of inputs) {
        expect(() => extractMainContent(html)).not.toThrow();
      }
    });

    it("should return string for all inputs", () => {
      const inputs = [
        "plain text",
        "<html><body></body></html>",
        "<div>content</div>",
      ];

      for (const input of inputs) {
        const result = extractMainContent(input);
        expect(typeof result).toBe("string");
      }
    });
  });

  describe("token limiting", () => {
    it("should return content as-is when under token limit", () => {
      const html = "<p>Short content</p>";
      const result = extractMainContent(html, 1000);
      expect(result).toContain("Short content");
    });

    it("should truncate content when over token limit", () => {
      const longContent = `<p>${"word ".repeat(1000)}</p>`;
      const result = extractMainContent(longContent, 100);
      // Result should be shorter than original
      expect(result.length).toBeLessThan(longContent.length);
    });

    it("should convert to plain text for very large content", () => {
      const veryLong = `<p>${"sentence. ".repeat(10000)}</p>`;
      const result = extractMainContent(veryLong, 500);
      // Should be truncated significantly
      expect(result.length).toBeLessThan(veryLong.length);
    });

    it("should handle default token limit", () => {
      const content = "Normal content";
      const result = extractMainContent(content);
      expect(result).toBe(content);
    });
  });

  describe("robustness", () => {
    it("should handle malformed HTML gracefully", () => {
      const malformed = "<div><p>Unclosed paragraph<div>Nested wrong</p></div>";
      const result = extractMainContent(malformed);
      expect(typeof result).toBe("string");
    });

    it("should preserve text content", () => {
      const html =
        "<article><h1>Title</h1><p>Paragraph one.</p><p>Paragraph two.</p></article>";
      const result = extractMainContent(html);
      expect(result).toContain("Title");
      expect(result).toContain("Paragraph one");
      expect(result).toContain("Paragraph two");
    });

    it("should handle empty string", () => {
      const result = extractMainContent("");
      expect(result).toBe("");
    });

    it("should handle plain text (no HTML)", () => {
      const plainText = "This is just plain text without any HTML tags.";
      const result = extractMainContent(plainText);
      expect(result).toBe(plainText);
    });
  });
});

describe("getGoogleProvider", () => {
  beforeEach(() => {
    resetProviders();
  });

  it("should return a provider function", () => {
    const provider = getGoogleProvider("test-api-key");
    expect(typeof provider).toBe("function");
  });

  it("should return the same provider for the same API key (singleton)", () => {
    const provider1 = getGoogleProvider("key-1");
    const provider2 = getGoogleProvider("key-1");
    expect(provider1).toBe(provider2);
  });

  it("should return a new provider when API key changes", () => {
    const provider1 = getGoogleProvider("key-1");
    const provider2 = getGoogleProvider("key-2");
    expect(provider1).not.toBe(provider2);
  });

  it("should handle empty API key", () => {
    const provider = getGoogleProvider("");
    expect(typeof provider).toBe("function");
  });
});

describe("getOpenAIProvider", () => {
  beforeEach(() => {
    resetProviders();
  });

  it("should return a provider function", () => {
    const provider = getOpenAIProvider("test-api-key");
    expect(typeof provider).toBe("function");
  });

  it("should return the same provider for the same API key (singleton)", () => {
    const provider1 = getOpenAIProvider("key-1");
    const provider2 = getOpenAIProvider("key-1");
    expect(provider1).toBe(provider2);
  });

  it("should return a new provider when API key changes", () => {
    const provider1 = getOpenAIProvider("key-1");
    const provider2 = getOpenAIProvider("key-2");
    expect(provider1).not.toBe(provider2);
  });
});

describe("getModel", () => {
  beforeEach(() => {
    resetProviders();
  });

  it("should return a model for gemini provider", () => {
    const model = getModel("gemini", "test-api-key");
    expect(model).toBeDefined();
  });

  it("should return a model for openai provider", () => {
    const model = getModel("openai", "test-api-key");
    expect(model).toBeDefined();
  });

  it("should throw for unsupported provider", () => {
    expect(() => {
      // @ts-expect-error - testing invalid provider
      getModel("unsupported", "test-api-key");
    }).toThrow("Unsupported provider: unsupported");
  });

  it("should use correct model for gemini", () => {
    const model = getModel("gemini", "test-key");
    expect(model).toBeDefined();
    expect(typeof model).toBe("object");
  });

  it("should use correct model for openai", () => {
    const model = getModel("openai", "test-key");
    expect(model).toBeDefined();
    expect(typeof model).toBe("object");
  });
});

describe("resetProviders", () => {
  it("should reset singleton providers", () => {
    // Create providers
    const googleBefore = getGoogleProvider("key-1");
    const openaiBefore = getOpenAIProvider("key-1");

    // Reset
    resetProviders();

    // Get new providers with same key - should be different instances
    const googleAfter = getGoogleProvider("key-1");
    const openaiAfter = getOpenAIProvider("key-1");

    // After reset, new instances should be created
    expect(googleAfter).not.toBe(googleBefore);
    expect(openaiAfter).not.toBe(openaiBefore);
  });
});
