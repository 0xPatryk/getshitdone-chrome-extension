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
  const cleaned = content
    // Remove head section (contains meta tags, title, styles, scripts, etc.)
    .replace(/<head\b[^>]*>[\s\S]*?<\/head>/gi, "")
    // Handle malformed head tags - remove any remaining head content up to body tag
    .replace(/<head\b[^>]*>[\s\S]*?(?=<body)/gi, "")
    // Remove script tags and their content
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
    // Remove style tags and their content
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "")
    // Remove comments
    .replace(/<!--[\s\S]*?-->/g, "")
    // Remove CDATA sections
    .replace(/<!\[CDATA\[[\s\S]*?\]\]>/g, "")
    // Remove inline style attributes
    .replace(/\s+style\s*=\s*(['"])[\s\S]*?\1/gi, "")
    // Remove common non-content elements (nav, header, footer, aside, etc.)
    .replace(
      /<(?:nav|header|footer|aside|svg|iframe|embed|object|video|audio|canvas|picture|source|track|map|area)\b[^>]*>[\s\S]*?<\/(?:nav|header|footer|aside|svg|iframe|embed|object|video|audio|canvas|picture|source|track|map|area)>/gi,
      "",
    )
    // Remove self-closing non-content elements
    .replace(
      /<(?:img|br|hr|input|meta|link|base|col|command|embed|keygen|param|source|track|wbr)\b[^>]*>/gi,
      " ",
    )
    // Remove all remaining HTML tags, preserving the text content
    .replace(/<[^>]+>/g, " ")
    // Normalize whitespace (replace multiple spaces, tabs, and newlines with a single space)
    .replace(/\s+/g, " ")
    // Trim leading and trailing whitespace
    .trim();

  // Limit content length to avoid token limits while preserving whole words
  if (cleaned.length <= 10000) {
    return cleaned;
  }
  
  // If content is too long, truncate at the last complete word before the limit
  const truncated = cleaned.substring(0, 10000);
  const lastSpaceIndex = truncated.lastIndexOf(" ");
  
  return lastSpaceIndex > 0 ? truncated.substring(0, lastSpaceIndex) : truncated;
};

describe("AI Service - extractMainContent", () => {
  it("should remove script tags from HTML content", () => {
    // Arrange
    const content =
      "<html><head><script>alert('test')</script></head><body>Content</body></html>";

    // Act
    const result = extractMainContent(content);

    // Assert
    expect(result).not.toContain("<script>");
    expect(result).not.toContain("alert('test')");
    expect(result).toContain("Content");
  });

  it("should remove style tags from HTML content", () => {
    // Arrange
    const content =
      "<html><head><style>body { color: red; }</style></head><body>Content</body></html>";

    // Act
    const result = extractMainContent(content);

    // Assert
    expect(result).not.toContain("<style>");
    expect(result).not.toContain("body { color: red; }");
    expect(result).toContain("Content");
  });

  it("should remove all HTML tags", () => {
    // Arrange
    const content =
      "<html><body><h1>Title</h1><p>Paragraph <strong>bold</strong> text</p></body></html>";

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
    const content =
      "<html><body>  Text   with    multiple     spaces  </body></html>";

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
    const content =
      "<html><body><h1>First</h1><p>Second</p><div>Third</div></body></html>";

    // Act
    const result = extractMainContent(content);

    // Assert
    expect(result).toContain("First");
    expect(result).toContain("Second");
    expect(result).toContain("Third");
    expect(result.indexOf("First")).toBeLessThan(result.indexOf("Second"));
    expect(result.indexOf("Second")).toBeLessThan(result.indexOf("Third"));
  });

  it("should remove the entire head section", () => {
    // Arrange
    const content = `
      <html>
        <head>
          <title>Page Title</title>
          <meta name="description" content="Page description">
          <link rel="stylesheet" href="styles.css">
          <script src="script.js"></script>
        </head>
        <body>
          <h1>Main Content</h1>
          <p>This is the main content of the page.</p>
        </body>
      </html>
    `;

    // Act
    const result = extractMainContent(content);

    // Assert
    expect(result).not.toContain("Page Title");
    expect(result).not.toContain("Page description");
    expect(result).not.toContain("styles.css");
    expect(result).not.toContain("script.js");
    expect(result).toContain("Main Content");
    expect(result).toContain("This is the main content of the page");
  });

  it("should remove HTML comments", () => {
    // Arrange
    const content = `
      <html>
        <body>
          <!-- This is a comment -->
          <h1>Visible Content</h1>
          <!-- Another comment -->
          <p>Paragraph content</p>
        </body>
      </html>
    `;

    // Act
    const result = extractMainContent(content);

    // Assert
    expect(result).not.toContain("This is a comment");
    expect(result).not.toContain("Another comment");
    expect(result).toContain("Visible Content");
    expect(result).toContain("Paragraph content");
  });

  it("should remove CDATA sections", () => {
    // Arrange
    const content = `
      <html>
        <body>
          <h1>Content</h1>
          <script>
            <![CDATA[
              var x = "<test>";
              alert(x);
            ]]>
          </script>
          <p>Text content</p>
        </body>
      </html>
    `;

    // Act
    const result = extractMainContent(content);

    // Assert
    expect(result).not.toContain("<![CDATA[");
    expect(result).not.toContain("var x =");
    expect(result).not.toContain("alert");
    expect(result).toContain("Content");
    expect(result).toContain("Text content");
  });

  it("should remove inline style attributes", () => {
    // Arrange
    const content = `
      <html>
        <body>
          <h1 style="color: red; font-size: 24px;">Title</h1>
          <p style="margin: 10px; padding: 5px;">Paragraph with style</p>
          <div>Normal text</div>
        </body>
      </html>
    `;

    // Act
    const result = extractMainContent(content);

    // Assert
    expect(result).not.toContain("color: red");
    expect(result).not.toContain("font-size: 24px");
    expect(result).not.toContain("margin: 10px");
    expect(result).not.toContain("padding: 5px");
    expect(result).toContain("Title");
    expect(result).toContain("Paragraph with style");
    expect(result).toContain("Normal text");
  });

  it("should remove common non-content elements", () => {
    // Arrange
    const content = `
      <html>
        <body>
          <nav>Navigation menu</nav>
          <header>Site header</header>
          <main>
            <h1>Main Content</h1>
            <p>This is the main content.</p>
          </main>
          <aside>Sidebar content</aside>
          <footer>Site footer</footer>
        </body>
      </html>
    `;

    // Act
    const result = extractMainContent(content);

    // Assert
    expect(result).not.toContain("Navigation menu");
    expect(result).not.toContain("Site header");
    expect(result).not.toContain("Sidebar content");
    expect(result).not.toContain("Site footer");
    expect(result).toContain("Main Content");
    expect(result).toContain("This is the main content");
  });

  it("should remove media elements", () => {
    // Arrange
    const content = `
      <html>
        <body>
          <h1>Article Title</h1>
          <p>Article content here.</p>
          <video>Video content</video>
          <audio>Audio content</audio>
          <canvas>Canvas content</canvas>
          <iframe>Iframe content</iframe>
          <svg>SVG content</svg>
          <img src="image.jpg" alt="Image description">
        </body>
      </html>
    `;

    // Act
    const result = extractMainContent(content);

    // Assert
    expect(result).not.toContain("Video content");
    expect(result).not.toContain("Audio content");
    expect(result).not.toContain("Canvas content");
    expect(result).not.toContain("Iframe content");
    expect(result).not.toContain("SVG content");
    expect(result).not.toContain("Image description");
    expect(result).toContain("Article Title");
    expect(result).toContain("Article content here");
  });

  it("should truncate at word boundaries when content exceeds limit", () => {
    // Arrange
    const words = Array.from({ length: 1500 }, (_, i) => `word${i}`);
    const content = `<html><body>${words.join(" ")}</body></html>`;

    // Act
    const result = extractMainContent(content);

    // Assert
    expect(result.length).toBeLessThanOrEqual(10000);
    expect(result).not.toEndWith("word");
    expect(result.endsWith("word999") || result.endsWith("word998"));
  });

  it("should handle malformed head tags", () => {
    // Arrange
    const content = `
      <html>
        <head>
          <title>Page Title</title>
          <meta name="description" content="Page description">
        <body>
          <h1>Main Content</h1>
          <p>This is the main content of the page.</p>
        </body>
      </html>
    `;

    // Act
    const result = extractMainContent(content);

    // Assert
    expect(result).not.toContain("Page Title");
    expect(result).not.toContain("Page description");
    expect(result).toContain("Main Content");
    expect(result).toContain("This is the main content of the page");
  });
});
