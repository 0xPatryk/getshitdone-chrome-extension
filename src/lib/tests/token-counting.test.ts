import { describe, expect, it } from "bun:test";
import { countTokens } from "~/lib/ai-service/utils";

describe("Token Counting", () => {
  it("should return 0 for empty content", () => {
    expect(countTokens("")).toBe(0);
    expect(countTokens(null as any)).toBe(0);
    expect(countTokens(undefined as any)).toBe(0);
  });

  it("should estimate tokens for plain text", () => {
    const text = "This is a simple plain text content for testing.";
    // Plain text uses ~4 characters per token ratio
    // This text has 48 characters, so should be ~12 tokens
    const expected = Math.ceil(text.length / 4);
    expect(countTokens(text)).toBe(expected);
  });

  it("should estimate tokens for HTML content with more conservative ratio", () => {
    const html = "<div>This is <b>HTML</b> content with <p>tags</p>.</div>";
    // HTML content uses ~3 characters per token ratio (more conservative)
    // This HTML has 61 characters, so should be ~21 tokens
    const expected = Math.ceil(html.length / 3);
    expect(countTokens(html)).toBe(expected);
  });

  it("should handle mixed content correctly", () => {
    const mixedContent = "Plain text <div>with HTML tags</div> inside";
    // Should detect HTML tags and use HTML ratio
    const expected = Math.ceil(mixedContent.length / 3);
    expect(countTokens(mixedContent)).toBe(expected);
  });

  it("should distinguish between HTML and plain text", () => {
    const plainText = "This is just plain text without any markup";
    const htmlContent = "<p>This is text with <strong>HTML</strong> markup</p>";
    
    // Plain text should use 4:1 ratio
    const plainTokens = Math.ceil(plainText.length / 4);
    expect(countTokens(plainText)).toBe(plainTokens);
    
    // HTML should use 3:1 ratio (more tokens due to tags)
    const htmlTokens = Math.ceil(htmlContent.length / 3);
    expect(countTokens(htmlContent)).toBe(htmlTokens);
    
    // HTML content should result in more tokens than same length plain text
    expect(countTokens(htmlContent)).toBeGreaterThan(countTokens(plainText));
  });
});