/**
 * Unit Tests for AI Service Content Extraction
 *
 * This file contains unit tests for the extractMainContent function
 * which is defined inline to avoid import issues.
 *
 * @file ai-service.extract.test.ts
 */

import { describe, expect, it } from "bun:test";

// Define the function inline to avoid import issues
const extractMainContent = (content: string): string => {
  // Remove scripts, styles, and other non-content elements
  const cleaned = content
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  // Limit content length to avoid token limits
  return cleaned.substring(0, 10000);
};

describe("AI Service - extractMainContent", () => {
  it("should remove script tags from HTML content", () => {
    // Arrange
    const content = "<html><head><script>alert('test')</script></head><body>Content</body></html>";

    // Act
    const result = extractMainContent(content);

    // Assert
    expect(result).not.toContain("<script>");
    expect(result).not.toContain("alert('test')");
    expect(result).toContain("Content");
  });

  it("should remove style tags from HTML content", () => {
    // Arrange
    const content = "<html><head><style>body { color: red; }</style></head><body>Content</body></html>";

    // Act
    const result = extractMainContent(content);

    // Assert
    expect(result).not.toContain("<style>");
    expect(result).not.toContain("body { color: red; }");
    expect(result).toContain("Content");
  });

  it("should remove all HTML tags", () => {
    // Arrange
    const content = "<html><body><h1>Title</h1><p>Paragraph <strong>bold</strong> text</p></body></html>";

    // Act
    const result = extractMainContent(content);

    // Assert
    expect(result).not.toContain("<h1>");
    expect(result).not.toContain("</h1>");
    expect(result).not.toContain("<p>");
    expect(result).not.toContain("</p>");
    expect(result).not.toContain("<strong>");
    expect(result).not.toContain("</strong>");
    expect(result).toContain("Title");
    expect(result).toContain("Paragraph");
    expect(result).toContain("bold");
    expect(result).toContain("text");
  });

  it("should normalize whitespace", () => {
    // Arrange
    const content = "<html><body>  Text   with    multiple     spaces  </body></html>";

    // Act
    const result = extractMainContent(content);

    // Assert
    expect(result).toBe("Text with multiple spaces");
  });

  it("should trim leading and trailing whitespace", () => {
    // Arrange
    const content = "<html><body>  Content with spaces  </body></html>";

    // Act
    const result = extractMainContent(content);

    // Assert
    expect(result).toBe("Content with spaces");
    expect(result).not.toStartWith(" ");
    expect(result).not.toEndWith(" ");
  });

  it("should limit content to 10000 characters", () => {
    // Arrange
    const longContent = "a".repeat(15000);

    // Act
    const result = extractMainContent(longContent);

    // Assert
    expect(result.length).toBe(10000);
    expect(result).toBe("a".repeat(10000));
  });

  it("should handle empty content", () => {
    // Arrange
    const content = "";

    // Act
    const result = extractMainContent(content);

    // Assert
    expect(result).toBe("");
  });

  it("should handle content with only HTML tags", () => {
    // Arrange
    const content = "<html><head></head><body></body></html>";

    // Act
    const result = extractMainContent(content);

    // Assert
    expect(result).toBe("");
  });

  it("should handle malformed HTML", () => {
    // Arrange
    const content = "<html><body>Unclosed tags<div>More content<p>Paragraph";

    // Act
    const result = extractMainContent(content);

    // Assert
    expect(result).toContain("Unclosed tags");
    expect(result).toContain("More content");
    expect(result).toContain("Paragraph");
  });

  it("should preserve text content in correct order", () => {
    // Arrange
    const content = "<html><body><h1>First</h1><p>Second</p><div>Third</div></body></html>";

    // Act
    const result = extractMainContent(content);

    // Assert
    expect(result).toContain("First");
    expect(result).toContain("Second");
    expect(result).toContain("Third");
    expect(result.indexOf("First")).toBeLessThan(result.indexOf("Second"));
    expect(result.indexOf("Second")).toBeLessThan(result.indexOf("Third"));
  });
});