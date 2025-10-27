/**
 * Unit Tests for AI Service Functions
 *
 * This file contains comprehensive unit tests for the AI service functions
 * in the ai-service module, including page content analysis, chat message
 * processing, and content extraction utilities.
 *
 * @file ai-service.services.test.ts
 */

import { beforeEach, describe, expect, it, mock } from "bun:test";
import type { ChatMessage } from "~/lib/messaging";
import { AnalysisResultSchema } from "~/lib/messaging";
import { mockData } from "./utils";

// Mock the AI SDK functions
const mockGenerateObject = mock(() => Promise.resolve({}));
const mockGenerateText = mock(() => Promise.resolve({}));

// Mock the getModel function
const mockGetModel = mock(() => ({}));

// Set up mocks before importing the module
mock.module("ai", () => ({
  generateObject: mockGenerateObject,
  generateText: mockGenerateText,
}));

// Mock the utils module
mock.module("~/lib/ai-service/utils", () => ({
  getModel: mockGetModel,
}));

// Import after setting up mocks
import {
  analyzePageContent,
  extractMainContent,
  processChatMessage,
} from "~/lib/ai-service/services";

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
});

describe("AI Service - analyzePageContent", () => {
  beforeEach(() => {
    mockGetModel.mockClear();
    mockGenerateObject.mockClear();
  });

  it("should analyze page content and return BLOCK_ALL decision", async () => {
    // Arrange
    const apiKey = "test-api-key";
    const userTask = "Write a research paper on climate change";
    const pageContent =
      "<html>Social media content with lots of distractions</html>";
    const url = "https://facebook.com";
    const provider = "gemini" as const;
    const alwaysRemove = ".ads,.sidebar";

    const mockAnalysisResult = {
      decision: "BLOCK_ALL" as const,
      reason:
        "This page is a social media platform and likely to be a distraction",
      selectors: [".ads", ".sidebar"],
    };

    mockGenerateObject.mockResolvedValue({
      object: mockAnalysisResult,
    });

    // Act
    const result = await analyzePageContent(
      apiKey,
      userTask,
      pageContent,
      url,
      provider,
      alwaysRemove,
    );

    // Assert
    expect(mockGetModel).toHaveBeenCalledWith(provider, apiKey);
    expect(mockGenerateObject).toHaveBeenCalledWith({
      model: {},
      schema: AnalysisResultSchema,
      prompt: expect.stringContaining(userTask),
      temperature: 0.1,
      mode: "json",
    });
    expect(result).toEqual(mockAnalysisResult);
    expect(result.decision).toBe("BLOCK_ALL");
  });

  it("should analyze page content and return REMOVE_ELEMENTS decision", async () => {
    // Arrange
    const apiKey = "test-api-key";
    const userTask = "Research for academic paper";
    const pageContent = "<html>News article with ads and sidebars</html>";
    const url = "https://news.example.com/article";
    const provider = "openai" as const;

    const mockAnalysisResult = {
      decision: "REMOVE_ELEMENTS" as const,
      reason: "Page contains relevant content but has distracting elements",
      selectors: [".ads", ".sidebar", ".recommendations"],
    };

    mockGenerateObject.mockResolvedValue({
      object: mockAnalysisResult,
    });

    // Act
    const result = await analyzePageContent(
      apiKey,
      userTask,
      pageContent,
      url,
      provider,
    );

    // Assert
    expect(result).toEqual(mockAnalysisResult);
    expect(result.decision).toBe("REMOVE_ELEMENTS");
    expect(result.selectors).toContain(".ads");
  });

  it("should analyze page content and return ALLOW decision", async () => {
    // Arrange
    const apiKey = "test-api-key";
    const userTask = "Research machine learning algorithms";
    const pageContent = "<html>Academic paper about machine learning</html>";
    const url = "https://arxiv.org/ml-paper";
    const provider = "gemini" as const;

    const mockAnalysisResult = {
      decision: "ALLOW" as const,
      reason: "Page content is directly relevant to the user's task",
    };

    mockGenerateObject.mockResolvedValue({
      object: mockAnalysisResult,
    });

    // Act
    const result = await analyzePageContent(
      apiKey,
      userTask,
      pageContent,
      url,
      provider,
    );

    // Assert
    expect(result).toEqual(mockAnalysisResult);
    expect(result.decision).toBe("ALLOW");
    expect(result.selectors).toBeUndefined();
  });

  it("should return fallback ALLOW decision when AI analysis fails", async () => {
    // Arrange
    const apiKey = "test-api-key";
    const userTask = "Test task";
    const pageContent = "<html>Test content</html>";
    const url = "https://example.com";
    const provider = "gemini" as const;
    const error = new Error("API error");

    mockGenerateObject.mockRejectedValue(error);

    // Act
    const result = await analyzePageContent(
      apiKey,
      userTask,
      pageContent,
      url,
      provider,
    );

    // Assert
    expect(result.decision).toBe("ALLOW");
    expect(result.reason).toContain("AI analysis failed");
    expect(result.reason).toContain("API error");
  });

  it("should use default provider when not specified", async () => {
    // Arrange
    const apiKey = "test-api-key";
    const userTask = "Test task";
    const pageContent = "<html>Test content</html>";
    const url = "https://example.com";

    mockGenerateObject.mockResolvedValue({
      object: {
        decision: "ALLOW" as const,
        reason: "Test",
      },
    });

    // Act
    await analyzePageContent(apiKey, userTask, pageContent, url);

    // Assert
    expect(mockGetModel).toHaveBeenCalledWith("gemini", apiKey);
  });
});

describe("AI Service - processChatMessage", () => {
  beforeEach(() => {
    mockGetModel.mockClear();
    mockGenerateText.mockClear();
  });

  it("should process chat message and grant access with duration", async () => {
    // Arrange
    const apiKey = "test-api-key";
    const userTask = "Write research paper";
    const message = "I need to check some references for 15 minutes";
    const chatHistory: ChatMessage[] = [
      mockData.chatMessage({ content: "Hello", role: "user" }),
      mockData.chatMessage({ content: "Hi there!", role: "assistant" }),
    ];
    const provider = "gemini" as const;

    const aiResponse =
      "ACCESS_GRANTED: 15 I understand you need to check references for your research.";
    mockGenerateText.mockResolvedValue({ text: aiResponse });

    // Act
    const result = await processChatMessage(
      apiKey,
      userTask,
      message,
      chatHistory,
      provider,
    );

    // Assert
    expect(mockGetModel).toHaveBeenCalledWith(provider, apiKey);
    expect(mockGenerateText).toHaveBeenCalledWith({
      model: {},
      prompt:
        expect.stringContaining(userTask) && expect.stringContaining(message),
      temperature: 0.3,
    });
    expect(result.accessGranted).toBe(true);
    expect(result.durationMinutes).toBe(15);
    expect(result.message.content).toBe(aiResponse);
    expect(result.message.role).toBe("assistant");
  });

  it("should process chat message and deny access", async () => {
    // Arrange
    const apiKey = "test-api-key";
    const userTask = "Complete assignment";
    const message = "I want to watch funny videos for an hour";
    const chatHistory: ChatMessage[] = [];
    const provider = "openai" as const;

    const aiResponse =
      "ACCESS_DENIED: Watching videos is not related to your assignment. Consider focusing on your work first.";
    mockGenerateText.mockResolvedValue({ text: aiResponse });

    // Act
    const result = await processChatMessage(
      apiKey,
      userTask,
      message,
      chatHistory,
      provider,
    );

    // Assert
    expect(result.accessGranted).toBe(false);
    expect(result.durationMinutes).toBeUndefined();
    expect(result.message.content).toBe(aiResponse);
  });

  it("should parse ACCESS_GRANTED with different duration formats", async () => {
    // Arrange
    const apiKey = "test-api-key";
    const userTask = "Test task";
    const message = "Test message";
    const chatHistory: ChatMessage[] = [];
    const provider = "gemini" as const;

    // Test various duration formats
    const testCases = [
      { response: "ACCESS_GRANTED: 5", expected: 5 },
      { response: "ACCESS_GRANTED: 30", expected: 30 },
      { response: "ACCESS_GRANTED: 60", expected: 60 },
      { response: "Some text ACCESS_GRANTED: 20 more text", expected: 20 },
    ];

    for (const testCase of testCases) {
      mockGenerateText.mockResolvedValue({ text: testCase.response });

      // Act
      const result = await processChatMessage(
        apiKey,
        userTask,
        message,
        chatHistory,
        provider,
      );

      // Assert
      expect(result.accessGranted).toBe(true);
      expect(result.durationMinutes).toBe(testCase.expected);
    }
  });

  it("should handle ACCESS_DENIED responses", async () => {
    // Arrange
    const apiKey = "test-api-key";
    const userTask = "Test task";
    const message = "Test message";
    const chatHistory: ChatMessage[] = [];
    const provider = "gemini" as const;

    const testCases = [
      "ACCESS_DENIED: This is not relevant",
      "Some text ACCESS_DENIED: Not related more text",
      "ACCESS_DENIED: Focus on your task instead",
    ];

    for (const response of testCases) {
      mockGenerateText.mockResolvedValue({ text: response });

      // Act
      const result = await processChatMessage(
        apiKey,
        userTask,
        message,
        chatHistory,
        provider,
      );

      // Assert
      expect(result.accessGranted).toBe(false);
      expect(result.durationMinutes).toBeUndefined();
      expect(result.message.content).toBe(response);
    }
  });

  it("should return fallback response when AI processing fails", async () => {
    // Arrange
    const apiKey = "test-api-key";
    const userTask = "Test task";
    const message = "Test message";
    const chatHistory: ChatMessage[] = [];
    const provider = "gemini" as const;
    const error = new Error("API error");

    mockGenerateText.mockRejectedValue(error);

    // Act
    const result = await processChatMessage(
      apiKey,
      userTask,
      message,
      chatHistory,
      provider,
    );

    // Assert
    expect(result.accessGranted).toBe(false);
    expect(result.durationMinutes).toBeUndefined();
    expect(result.message.content).toContain("trouble processing your request");
    expect(result.message.role).toBe("assistant");
  });

  it("should use default provider when not specified", async () => {
    // Arrange
    const apiKey = "test-api-key";
    const userTask = "Test task";
    const message = "Test message";
    const chatHistory: ChatMessage[] = [];

    mockGenerateText.mockResolvedValue({ text: "ACCESS_DENIED: Test" });

    // Act
    await processChatMessage(apiKey, userTask, message, chatHistory);

    // Assert
    expect(mockGetModel).toHaveBeenCalledWith("gemini", apiKey);
  });

  it("should generate unique message IDs", async () => {
    // Arrange
    const apiKey = "test-api-key";
    const userTask = "Test task";
    const message = "Test message";
    const chatHistory: ChatMessage[] = [];
    const provider = "gemini" as const;

    mockGenerateText.mockResolvedValue({ text: "ACCESS_GRANTED: 10" });

    // Act
    const result1 = await processChatMessage(
      apiKey,
      userTask,
      message,
      chatHistory,
      provider,
    );
    const result2 = await processChatMessage(
      apiKey,
      userTask,
      message,
      chatHistory,
      provider,
    );

    // Assert
    expect(result1.message.id).not.toBe(result2.message.id);
    expect(result1.message.id).toMatch(/^msg-\d+-[a-z0-9]+$/);
    expect(result2.message.id).toMatch(/^msg-\d+-[a-z0-9]+$/);
  });

  it("should include timestamp in message", async () => {
    // Arrange
    const apiKey = "test-api-key";
    const userTask = "Test task";
    const message = "Test message";
    const chatHistory: ChatMessage[] = [];
    const provider = "gemini" as const;
    const beforeTime = Date.now();

    mockGenerateText.mockResolvedValue({ text: "ACCESS_GRANTED: 10" });

    // Act
    const result = await processChatMessage(
      apiKey,
      userTask,
      message,
      chatHistory,
      provider,
    );
    const afterTime = Date.now();

    // Assert
    expect(result.message.timestamp).toBeGreaterThanOrEqual(beforeTime);
    expect(result.message.timestamp).toBeLessThanOrEqual(afterTime);
  });
});
