/**
 * Unit Tests for Updated processChatMessage Function
 *
 * This file contains comprehensive unit tests for the updated processChatMessage function
 * in ai-service module, focusing on the new collaborative approach and optional parameters.
 *
 * @file ai-service.processChatMessage.test.ts
 */

// Mock webextension-polyfill before any imports that might trigger it
Object.defineProperty(globalThis, "chrome", {
  value: {
    runtime: { id: "test-extension-id" },
  },
  writable: true,
  configurable: true,
});

// Mock webextension-polyfill module
mock.module("webextension-polyfill", () => ({}));

// Import setup first to ensure proper mocking
import "./setup";

import { beforeEach, describe, expect, it, mock } from "bun:test";
import type { ChatMessage } from "~/lib/messaging";
import { ChatProcessResultSchema } from "~/lib/messaging";
import { mockData } from "./utils";

// Mock AI SDK functions
const mockGenerateObject = mock(() => Promise.resolve({}));

// Mock getModel function
const mockGetModel = mock(() => ({}));

// Set up mocks before importing the module
mock.module("ai", () => ({
  generateObject: mockGenerateObject,
}));

// Mock utils module
mock.module("~/lib/ai-service/utils", () => ({
  getModel: mockGetModel,
}));

// Helper function to get processChatMessage directly for testing
const getProcessChatMessageFunction = () => {
  // Use require to avoid import issues with webextension-polyfill
  const aiService = require("~/lib/ai-service/services");
  return aiService.processChatMessage;
};

describe("AI Service - processChatMessage (Updated Implementation)", () => {
  beforeEach(() => {
    mockGetModel.mockClear();
    mockGenerateObject.mockClear();
  });

  /**
   * Test backward compatibility with existing parameters
   */
  it("should maintain backward compatibility with existing parameters", async () => {
    // Arrange
    const apiKey = "test-api-key";
    const userTask = "Write a research paper";
    const message = "I need to check some references for 15 minutes";
    const chatHistory: ChatMessage[] = [
      mockData.chatMessage({ content: "Hello", role: "user" }),
      mockData.chatMessage({ content: "Hi there!", role: "assistant" }),
    ];
    const provider = "gemini" as const;

    const mockResponse = {
      response: "I understand you need to check references for your research. I'll grant you 15 minutes to access the materials you need.",
      decision: "GRANT" as const,
      durationMinutes: 15,
    };

    mockGenerateObject.mockResolvedValue({
      object: mockResponse,
    });

    // Get the function using require to avoid import issues
    const processChatMessage = getProcessChatMessageFunction();

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
    expect(mockGenerateObject).toHaveBeenCalledWith({
      model: {},
      schema: ChatProcessResultSchema,
      prompt: expect.stringContaining(userTask),
      temperature: 0.3, // Verify the new temperature value
      mode: "json",
    });
    expect(result.accessGranted).toBe(true);
    expect(result.durationMinutes).toBe(15);
    expect(result.message.content).toBe(mockResponse.response);
  });

  /**
   * Test new optional parameters - pageContent
   */
  it("should handle pageContent parameter correctly", async () => {
    // Arrange
    const apiKey = "test-api-key";
    const userTask = "Debug React component";
    const message = "I need to access this Stack Overflow page to fix my bug";
    const chatHistory: ChatMessage[] = [];
    const pageContent = "<html>Stack Overflow page about React hooks and state management</html>";

    const mockResponse = {
      response: "Stack Overflow is an excellent resource for debugging React issues. Since you're facing a specific technical problem, I'll grant you 25 minutes to find a solution.",
      decision: "GRANT" as const,
      durationMinutes: 25,
    };

    mockGenerateObject.mockResolvedValue({
      object: mockResponse,
    });

    const processChatMessage = getProcessChatMessageFunction();

    // Act
    const result = await processChatMessage(
      apiKey,
      userTask,
      message,
      chatHistory,
      "gemini",
      pageContent,
    );

    // Assert
    expect(result.accessGranted).toBe(true);
    expect(result.durationMinutes).toBe(25);
    expect(mockGenerateObject).toHaveBeenCalledWith({
      model: {},
      schema: ChatProcessResultSchema,
      prompt: expect.stringContaining("PAGE_CONTENT_CONTEXT"),
      temperature: 0.3,
      mode: "json",
    });
  });

  /**
   * Test new optional parameters - activeGrants and chatContexts
   */
  it("should handle activeGrants and chatContexts parameters correctly", async () => {
    // Arrange
    const apiKey = "test-api-key";
    const userTask = "Build React app";
    const message = "I need to access React documentation";
    const chatHistory: ChatMessage[] = [];

    const activeGrants = {
      "https://react.dev": {
        url: "https://react.dev",
        expiresAt: Date.now() + 30 * 60 * 1000,
        grantedAt: Date.now() - 10 * 60 * 1000,
        durationMinutes: 60,
      },
    };

    const chatContexts = {
      "https://react.dev": {
        id: "https://react.dev",
        messages: [
          {
            id: "msg-1",
            content: "I need access to React docs for component development",
            role: "user" as const,
            timestamp: Date.now() - 15 * 60 * 1000,
          },
        ],
        createdAt: Date.now() - 20 * 60 * 1000,
        status: "completed" as const,
      },
    };

    const mockResponse = {
      response: "Since you've previously accessed React docs for component development, I'll grant you another 30 minutes to continue your work.",
      decision: "GRANT" as const,
      durationMinutes: 30,
    };

    mockGenerateObject.mockResolvedValue({
      object: mockResponse,
    });

    const processChatMessage = getProcessChatMessageFunction();

    // Act
    const result = await processChatMessage(
      apiKey,
      userTask,
      message,
      chatHistory,
      "gemini",
      undefined, // pageContent
      activeGrants,
      chatContexts,
    );

    // Assert
    expect(result.accessGranted).toBe(true);
    expect(result.durationMinutes).toBe(30);
    expect(mockGenerateObject).toHaveBeenCalledWith({
      model: {},
      schema: ChatProcessResultSchema,
      prompt: expect.stringContaining("ACTIVE_GRANTS_CONTEXT"),
      temperature: 0.3,
      mode: "json",
    });
  });

  /**
   * Test Reddit inspiration requests (should be denied with alternatives)
   */
  it("should deny Reddit inspiration requests with alternatives", async () => {
    // Arrange
    const apiKey = "test-api-key";
    const userTask = "Develop a Next.js frontend for a new e-commerce site. Focus on component structure.";
    const message = "I need to check Reddit's r/webdev for some inspiration on component design patterns";
    const chatHistory: ChatMessage[] = [];

    const mockResponse = {
      response: "I understand you're looking for inspiration, but Reddit might not be the most focused source for component design patterns. Consider checking official React documentation, component libraries like Material-UI or Chakra UI, or curated resources like UI.dev. These will provide more targeted inspiration without the potential for distraction. Would you like me to suggest some specific resources?",
      decision: "DENY" as const,
    };

    mockGenerateObject.mockResolvedValue({
      object: mockResponse,
    });

    const processChatMessage = getProcessChatMessageFunction();

    // Act
    const result = await processChatMessage(
      apiKey,
      userTask,
      message,
      chatHistory,
    );

    // Assert
    expect(result.accessGranted).toBe(false);
    expect(result.durationMinutes).toBeUndefined();
    expect(result.message.content).toContain("Reddit might not be the most focused");
    expect(result.message.content).toContain("Consider checking official React documentation");
  });

  /**
   * Test Stack Overflow debugging (should be granted)
   */
  it("should grant access to Stack Overflow for debugging", async () => {
    // Arrange
    const apiKey = "test-api-key";
    const userTask = "Debug a React component state issue in the shopping cart";
    const message = "I need to access Stack Overflow to find solutions for React state management bugs";
    const chatHistory: ChatMessage[] = [];

    const mockResponse = {
      response: "Stack Overflow is an excellent resource for debugging React state issues. Since you're facing a specific technical problem, I'll grant you 25 minutes to find a solution. Focus on threads that directly address your state management issue rather than browsing generally.",
      decision: "GRANT" as const,
      durationMinutes: 25,
    };

    mockGenerateObject.mockResolvedValue({
      object: mockResponse,
    });

    const processChatMessage = getProcessChatMessageFunction();

    // Act
    const result = await processChatMessage(
      apiKey,
      userTask,
      message,
      chatHistory,
    );

    // Assert
    expect(result.accessGranted).toBe(true);
    expect(result.durationMinutes).toBe(25);
    expect(result.message.content).toContain("Stack Overflow is an excellent resource");
  });

  /**
   * Test health break requests (should be granted with short duration)
   */
  it("should grant health break requests with short duration", async () => {
    // Arrange
    const apiKey = "test-api-key";
    const userTask = "Write a research paper on the impact of Roman aqueducts on urban development";
    const message = "I need a 5-minute break to stretch and rest my eyes";
    const chatHistory: ChatMessage[] = [];

    const mockResponse = {
      response: "Taking regular breaks is essential for maintaining focus and productivity, especially during intensive research work. I'll grant you 5 minutes for a quick stretch and eye rest. When you return, you'll likely find yourself more focused on your aqueduct research.",
      decision: "GRANT" as const,
      durationMinutes: 5,
    };

    mockGenerateObject.mockResolvedValue({
      object: mockResponse,
    });

    const processChatMessage = getProcessChatMessageFunction();

    // Act
    const result = await processChatMessage(
      apiKey,
      userTask,
      message,
      chatHistory,
    );

    // Assert
    expect(result.accessGranted).toBe(true);
    expect(result.durationMinutes).toBe(5);
    expect(result.message.content).toContain("Taking regular breaks is essential");
  });

  /**
   * Test fake productivity content (should be denied with explanation)
   */
  it("should deny fake productivity content with explanation", async () => {
    // Arrange
    const apiKey = "test-api-key";
    const userTask = "Build an n8n pipeline for data processing";
    const message = "I want to watch a YouTube video about 'How to Become the Most Productive Person'";
    const chatHistory: ChatMessage[] = [];

    const mockResponse = {
      response: "I notice you're requesting general productivity content while working on a specific technical task. This type of content often leads to distraction without directly helping with your n8n pipeline. Instead, consider taking a focused 10-minute break to review your pipeline requirements or documentation. Would that be more helpful for your current task?",
      decision: "DENY" as const,
    };

    mockGenerateObject.mockResolvedValue({
      object: mockResponse,
    });

    const processChatMessage = getProcessChatMessageFunction();

    // Act
    const result = await processChatMessage(
      apiKey,
      userTask,
      message,
      chatHistory,
    );

    // Assert
    expect(result.accessGranted).toBe(false);
    expect(result.durationMinutes).toBeUndefined();
    expect(result.message.content).toContain("general productivity content");
    expect(result.message.content).toContain("fake productivity");
  });

  /**
   * Test social media marketing when task-related (should be granted)
   */
  it("should grant social media access when task-related", async () => {
    // Arrange
    const apiKey = "test-api-key";
    const userTask = "Create a social media marketing plan for a new coffee brand";
    const message = "I need to access Instagram to research competitor strategies and current trends";
    const chatHistory: ChatMessage[] = [];

    const mockResponse = {
      response: "Since you're creating a social media marketing plan, researching competitor strategies on Instagram is directly relevant to your task. I'll grant you 30 minutes to gather insights on competitor approaches and current trends. Try to stay focused on business-related content rather than personal browsing.",
      decision: "GRANT" as const,
      durationMinutes: 30,
    };

    mockGenerateObject.mockResolvedValue({
      object: mockResponse,
    });

    const processChatMessage = getProcessChatMessageFunction();

    // Act
    const result = await processChatMessage(
      apiKey,
      userTask,
      message,
      chatHistory,
    );

    // Assert
    expect(result.accessGranted).toBe(true);
    expect(result.durationMinutes).toBe(30);
    expect(result.message.content).toContain("directly relevant to your task");
  });

  /**
   * Test AI helper tools like ChatGPT (should be granted for technical assistance)
   */
  it("should grant access to AI helper tools for technical assistance", async () => {
    // Arrange
    const apiKey = "test-api-key";
    const userTask = "Debug a Python script for data analysis";
    const message = "I need to access ChatGPT to help me understand this error message";
    const chatHistory: ChatMessage[] = [];

    const mockResponse = {
      response: "Using AI assistants like ChatGPT is a great way to debug code and understand error messages. Since this directly helps with your current Python debugging task, I'll grant you 20 minutes. Focus specifically on getting help with your error message rather than general conversation.",
      decision: "GRANT" as const,
      durationMinutes: 20,
    };

    mockGenerateObject.mockResolvedValue({
      object: mockResponse,
    });

    const processChatMessage = getProcessChatMessageFunction();

    // Act
    const result = await processChatMessage(
      apiKey,
      userTask,
      message,
      chatHistory,
    );

    // Assert
    expect(result.accessGranted).toBe(true);
    expect(result.durationMinutes).toBe(20);
    expect(result.message.content).toContain("AI assistants like ChatGPT");
  });

  /**
   * Test general tech news (should be denied with focused alternatives)
   */
  it("should deny general tech news with focused alternatives", async () => {
    // Arrange
    const apiKey = "test-api-key";
    const userTask = "Write documentation for a new API endpoint";
    const message = "I need to check Twitter for the latest tech news to stay updated";
    const chatHistory: ChatMessage[] = [];

    const mockResponse = {
      response: "While staying updated on tech news is valuable, Twitter might not be the most focused resource while you're writing API documentation. Consider scheduling tech news reading for a dedicated break time. For now, would it help to take a 10-minute break to clear your mind before continuing with the documentation?",
      decision: "DENY" as const,
    };

    mockGenerateObject.mockResolvedValue({
      object: mockResponse,
    });

    const processChatMessage = getProcessChatMessageFunction();

    // Act
    const result = await processChatMessage(
      apiKey,
      userTask,
      message,
      chatHistory,
    );

    // Assert
    expect(result.accessGranted).toBe(false);
    expect(result.durationMinutes).toBeUndefined();
    expect(result.message.content).toContain("not be the most focused resource");
  });

  /**
   * Test the new structured reasoning process
   */
  it("should use structured reasoning process in decision making", async () => {
    // Arrange
    const apiKey = "test-api-key";
    const userTask = "Develop a React Native mobile app";
    const message = "I need to access the official React Native documentation for navigation patterns";
    const chatHistory: ChatMessage[] = [];

    const mockResponse = {
      response: "The official React Native documentation is an essential resource for implementing navigation patterns in your app. Since this is directly relevant to your development task, I'll grant you 35 minutes to study the documentation and implement the navigation patterns you need.",
      decision: "GRANT" as const,
      durationMinutes: 35,
    };

    mockGenerateObject.mockResolvedValue({
      object: mockResponse,
    });

    const processChatMessage = getProcessChatMessageFunction();

    // Act
    const result = await processChatMessage(
      apiKey,
      userTask,
      message,
      chatHistory,
    );

    // Assert
    expect(result.accessGranted).toBe(true);
    expect(result.durationMinutes).toBe(35);
    // Verify that the prompt includes the structured reasoning process
    expect(mockGenerateObject).toHaveBeenCalledWith({
      model: {},
      schema: ChatProcessResultSchema,
      prompt: expect.stringContaining("STRUCTURED_REASONING_PROCESS"),
      temperature: 0.3,
      mode: "json",
    });
  });

  /**
   * Test temperature change from 0.7 to 0.3 produces more consistent results
   */
  it("should use the new temperature value of 0.3 for more consistent results", async () => {
    // Arrange
    const apiKey = "test-api-key";
    const userTask = "Test task";
    const message = "Test message";
    const chatHistory: ChatMessage[] = [];

    mockGenerateObject.mockResolvedValue({
      object: {
        response: "Test response",
        decision: "DENY" as const,
      },
    });

    const processChatMessage = getProcessChatMessageFunction();

    // Act
    await processChatMessage(
      apiKey,
      userTask,
      message,
      chatHistory,
    );

    // Assert
    expect(mockGenerateObject).toHaveBeenCalledWith({
      model: {},
      schema: ChatProcessResultSchema,
      prompt: expect.any(String),
      temperature: 0.3, // Verify the new temperature value
      mode: "json",
    });
  });

  /**
   * Test grants context integration with multiple grants
   */
  it("should integrate multiple grants context correctly", async () => {
    // Arrange
    const apiKey = "test-api-key";
    const userTask = "Build Angular frontend for n8n pipeline";
    const message = "I need to access Angular documentation";
    const chatHistory: ChatMessage[] = [];

    const activeGrants = {
      "https://react.dev": {
        url: "https://react.dev",
        expiresAt: Date.now() + 30 * 60 * 1000,
        grantedAt: Date.now() - 10 * 60 * 1000,
        durationMinutes: 60,
      },
      "https://vuejs.org": {
        url: "https://vuejs.org",
        expiresAt: Date.now() + 45 * 60 * 1000,
        grantedAt: Date.now() - 20 * 60 * 1000,
        durationMinutes: 90,
      },
    };

    const chatContexts = {
      "https://react.dev": {
        id: "https://react.dev",
        messages: [
          {
            id: "msg-1",
            content: "I need access to React docs for component development",
            role: "user" as const,
            timestamp: Date.now() - 15 * 60 * 1000,
          },
        ],
        createdAt: Date.now() - 20 * 60 * 1000,
        status: "completed" as const,
      },
      "https://vuejs.org": {
        id: "https://vuejs.org",
        messages: [
          {
            id: "msg-2",
            content: "Need Vue documentation for comparison",
            role: "user" as const,
            timestamp: Date.now() - 25 * 60 * 1000,
          },
        ],
        createdAt: Date.now() - 30 * 60 * 1000,
        status: "active" as const,
      },
    };

    const mockResponse = {
      response: "Based on your previous access to React and Vue documentation, I'll grant you 40 minutes to access Angular docs since you're clearly working on frontend development.",
      decision: "GRANT" as const,
      durationMinutes: 40,
    };

    mockGenerateObject.mockResolvedValue({
      object: mockResponse,
    });

    const processChatMessage = getProcessChatMessageFunction();

    // Act
    const result = await processChatMessage(
      apiKey,
      userTask,
      message,
      chatHistory,
      "gemini",
      undefined, // pageContent
      activeGrants,
      chatContexts,
    );

    // Assert
    expect(result.accessGranted).toBe(true);
    expect(result.durationMinutes).toBe(40);
    // Verify that the prompt includes both grants in the context
    expect(mockGenerateObject).toHaveBeenCalledWith({
      model: {},
      schema: ChatProcessResultSchema,
      prompt: expect.stringContaining("https://react.dev (30 minutes remaining)"),
      temperature: 0.3,
      mode: "json",
    });
  });

  /**
   * Test page content integration with grants context
   */
  it("should integrate page content with grants context correctly", async () => {
    // Arrange
    const apiKey = "test-api-key";
    const userTask = "Debug React component";
    const message = "I need to access this Stack Overflow page to fix my bug";
    const chatHistory: ChatMessage[] = [];
    const pageContent = "<html>Stack Overflow page about React hooks and state management</html>";

    const activeGrants = {
      "https://stackoverflow.com": {
        url: "https://stackoverflow.com",
        expiresAt: Date.now() + 15 * 60 * 1000,
        grantedAt: Date.now() - 5 * 60 * 1000,
        durationMinutes: 30,
      },
    };

    const chatContexts = {
      "https://stackoverflow.com": {
        id: "https://stackoverflow.com",
        messages: [
          {
            id: "msg-1",
            content: "I need this site for debugging React issues",
            role: "user" as const,
            timestamp: Date.now() - 10 * 60 * 1000,
          },
        ],
        createdAt: Date.now() - 15 * 60 * 1000,
        status: "completed" as const,
      },
    };

    const mockResponse = {
      response: "Since you've previously accessed Stack Overflow for React debugging and this page is specifically about React hooks and state management, I'll grant you 20 minutes to find a solution to your bug.",
      decision: "GRANT" as const,
      durationMinutes: 20,
    };

    mockGenerateObject.mockResolvedValue({
      object: mockResponse,
    });

    const processChatMessage = getProcessChatMessageFunction();

    // Act
    const result = await processChatMessage(
      apiKey,
      userTask,
      message,
      chatHistory,
      "gemini",
      pageContent,
      activeGrants,
      chatContexts,
    );

    // Assert
    expect(result.accessGranted).toBe(true);
    expect(result.durationMinutes).toBe(20);
    // Verify that the prompt includes both page content and grants context
    expect(mockGenerateObject).toHaveBeenCalledWith({
      model: {},
      schema: ChatProcessResultSchema,
      prompt: expect.stringContaining("PAGE_CONTENT_CONTEXT"),
      temperature: 0.3,
      mode: "json",
    });
    expect(mockGenerateObject).toHaveBeenCalledWith({
      model: {},
      schema: ChatProcessResultSchema,
      prompt: expect.stringContaining("ACTIVE_GRANTS_CONTEXT"),
      temperature: 0.3,
      mode: "json",
    });
  });

  /**
   * Test response schema matches ChatProcessResultSchema
   */
  it("should return response that matches ChatProcessResultSchema", async () => {
    // Arrange
    const apiKey = "test-api-key";
    const userTask = "Test task";
    const message = "Test message";
    const chatHistory: ChatMessage[] = [];

    const mockResponse = {
      response: "Test response with collaborative tone",
      decision: "GRANT" as const,
      durationMinutes: 15,
    };

    mockGenerateObject.mockResolvedValue({
      object: mockResponse,
    });

    const processChatMessage = getProcessChatMessageFunction();

    // Act
    const result = await processChatMessage(
      apiKey,
      userTask,
      message,
      chatHistory,
    );

    // Assert
    expect(result.accessGranted).toBe(true);
    expect(result.durationMinutes).toBe(15);
    expect(result.message.content).toBe(mockResponse.response);
    expect(result.message.role).toBe("assistant");
    expect(result.message.id).toMatch(/^msg-\d+-[a-z0-9]+$/);
    expect(typeof result.message.timestamp).toBe("number");
    
    // Verify the response structure matches the expected schema
    expect(result).toEqual({
      message: {
        id: expect.stringMatching(/^msg-\d+-[a-z0-9]+$/),
        content: mockResponse.response,
        role: "assistant",
        timestamp: expect.any(Number),
      },
      accessGranted: true,
      durationMinutes: 15,
    });
  });

  /**
   * Test collaborative tone in responses
   */
  it("should use collaborative tone in responses", async () => {
    // Arrange
    const apiKey = "test-api-key";
    const userTask = "Write code";
    const message = "I want to check Reddit for programming memes";
    const chatHistory: ChatMessage[] = [];

    const mockResponse = {
      response: "I understand you're looking for a break from coding, but Reddit might not be the most focused choice. Consider taking a 5-minute walk or checking a programming tutorial instead. Would that work for you?",
      decision: "DENY" as const,
    };

    mockGenerateObject.mockResolvedValue({
      object: mockResponse,
    });

    const processChatMessage = getProcessChatMessageFunction();

    // Act
    const result = await processChatMessage(
      apiKey,
      userTask,
      message,
      chatHistory,
    );

    // Assert
    expect(result.accessGranted).toBe(false);
    expect(result.message.content).toContain("understand");
    expect(result.message.content).toContain("Consider");
    expect(result.message.content).toContain("Would that work for you?");
  });
});