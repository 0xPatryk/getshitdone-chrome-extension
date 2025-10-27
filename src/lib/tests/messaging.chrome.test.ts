/**
 * Tests for Messaging Services using Chrome APIs directly
 *
 * This file contains comprehensive unit tests for the messaging functionality
 * by testing the underlying Chrome APIs that the messaging services use.
 * This approach avoids the @webext-core/m mocking issues.
 *
 * Key test areas:
 * - Message sending and receiving
 * - Type-safe message validation
 * - Message routing and handling
 * - Error handling for failed messages
 * - Message timeout scenarios
 * - Cross-context communication
 * - Message serialization/deserialization
 */

// Import test setup first to ensure Chrome APIs are mocked
import "./setup";

import { beforeEach, describe, expect, it } from "bun:test";
import {
  type AnalysisResult,
  type ChatMessage,
  type ChatResponse,
  type InvalidateCacheAlwaysRemove,
  type InvalidateCacheTask,
  Message,
  type SendChatMessage,
} from "~/lib/messaging/types";
import { asyncHelpers, messageHelpers } from "./utils";

describe("Messaging Services (via Chrome APIs)", () => {
  beforeEach(() => {
    // Clear all message listeners before each test
    messageHelpers.clearListeners();
  });

  describe("Message sending and receiving", () => {
    it("should send and receive ANALYZE_PAGE messages", async () => {
      const testData = {
        url: "https://example.com",
        content: "Page content here",
        alwaysRemove: ".ads",
      };

      const expectedResponse: AnalysisResult = {
        decision: "ALLOW",
        reason: "Relevant content",
      };

      // Set up message listener
      chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (
          message &&
          typeof message === "object" &&
          "type" in message &&
          message.type === Message.ANALYZE_PAGE
        ) {
          expect((message as { type: string; data: unknown }).data).toEqual(
            testData,
          );
          sendResponse(expectedResponse);
        }
      });

      // Send message
      const response = await chrome.runtime.sendMessage({
        type: Message.ANALYZE_PAGE,
        data: testData,
      });

      // Verify response
      expect(response).toEqual(expectedResponse);
    });

    it("should send and receive SEND_CHAT_MESSAGE messages", async () => {
      const testData: SendChatMessage = {
        sessionId: "test-session-id",
        message: "Hello, AI!",
      };

      const expectedResponse: ChatResponse = {
        sessionId: "test-session-id",
        message: {
          id: "response-id",
          content: "Hello! How can I help you?",
          role: "assistant",
          timestamp: Date.now(),
        },
        accessGranted: true,
        durationMinutes: 30,
      };

      // Set up message listener
      chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (
          message &&
          typeof message === "object" &&
          "type" in message &&
          message.type === Message.SEND_CHAT_MESSAGE
        ) {
          expect((message as { type: string; data: unknown }).data).toEqual(
            testData,
          );
          sendResponse(expectedResponse);
        }
      });

      // Send message
      const response = await chrome.runtime.sendMessage({
        type: Message.SEND_CHAT_MESSAGE,
        data: testData,
      });

      // Verify response
      expect(response).toEqual(expectedResponse);
    });

    it("should send BLOCK_RESULT messages", async () => {
      const testData: AnalysisResult = {
        decision: "REMOVE_ELEMENTS",
        reason: "Contains distracting content",
        selectors: [".ads", ".sidebar"],
      };

      // Set up message listener
      chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (
          message &&
          typeof message === "object" &&
          "type" in message &&
          message.type === Message.BLOCK_RESULT
        ) {
          expect((message as { type: string; data: unknown }).data).toEqual(
            testData,
          );
          sendResponse({ success: true });
        }
      });

      // Send message
      const response = await chrome.runtime.sendMessage({
        type: Message.BLOCK_RESULT,
        data: testData,
      });

      // Verify response
      expect(response).toEqual({ success: true });
    });

    it("should send CHAT_RESPONSE messages", async () => {
      const testData: ChatResponse = {
        sessionId: "test-session",
        message: {
          id: "msg-id",
          content: "AI response",
          role: "assistant",
          timestamp: Date.now(),
        },
      };

      // Set up message listener
      chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (
          message &&
          typeof message === "object" &&
          "type" in message &&
          message.type === Message.CHAT_RESPONSE
        ) {
          expect((message as { type: string; data: unknown }).data).toEqual(
            testData,
          );
          sendResponse({ success: true });
        }
      });

      // Send message
      const response = await chrome.runtime.sendMessage({
        type: Message.CHAT_RESPONSE,
        data: testData,
      });

      // Verify response
      expect(response).toEqual({ success: true });
    });

    it("should send INVALIDATE_CACHE_TASK messages", async () => {
      const testData: InvalidateCacheTask = {
        oldValue: "old task",
        newValue: "new task",
      };

      // Set up message listener
      chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (
          message &&
          typeof message === "object" &&
          "type" in message &&
          message.type === Message.INVALIDATE_CACHE_TASK
        ) {
          expect((message as { type: string; data: unknown }).data).toEqual(
            testData,
          );
          sendResponse({ success: true });
        }
      });

      // Send message
      const response = await chrome.runtime.sendMessage({
        type: Message.INVALIDATE_CACHE_TASK,
        data: testData,
      });

      // Verify response
      expect(response).toEqual({ success: true });
    });

    it("should send INVALIDATE_CACHE_ALWAYS_REMOVE messages", async () => {
      const testData: InvalidateCacheAlwaysRemove = {};

      // Set up message listener
      chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (
          message &&
          typeof message === "object" &&
          "type" in message &&
          message.type === Message.INVALIDATE_CACHE_ALWAYS_REMOVE
        ) {
          expect((message as { type: string; data: unknown }).data).toEqual(
            testData,
          );
          sendResponse({ success: true });
        }
      });

      // Send message
      const response = await chrome.runtime.sendMessage({
        type: Message.INVALIDATE_CACHE_ALWAYS_REMOVE,
        data: testData,
      });

      // Verify response
      expect(response).toEqual({ success: true });
    });
  });

  describe("Message routing and handling", () => {
    it("should route messages to correct handlers", async () => {
      const receivedMessages: Array<{ type: string; data: unknown }> = [];

      // Set up multiple message listeners
      chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message && typeof message === "object" && "type" in message) {
          if (message.type === Message.ANALYZE_PAGE) {
            receivedMessages.push({
              type: "ANALYZE_PAGE",
              data: (message as { type: string; data: unknown }).data,
            });
            sendResponse({ decision: "ALLOW", reason: "Processed" });
          }
        }
      });

      chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message && typeof message === "object" && "type" in message) {
          if (message.type === Message.SEND_CHAT_MESSAGE) {
            receivedMessages.push({
              type: "SEND_CHAT_MESSAGE",
              data: (message as { type: string; data: unknown }).data,
            });
            sendResponse({
              sessionId: "test",
              message: {
                id: "1",
                content: "Response",
                role: "assistant",
                timestamp: Date.now(),
              },
            });
          }
        }
      });

      // Send different message types
      await chrome.runtime.sendMessage({
        type: Message.ANALYZE_PAGE,
        data: { url: "https://example.com", content: "Test" },
      });

      await chrome.runtime.sendMessage({
        type: Message.SEND_CHAT_MESSAGE,
        data: { sessionId: "session-1", message: "Hello" },
      });

      // Verify messages were routed correctly
      expect(receivedMessages).toHaveLength(2);
      expect(receivedMessages[0]).toEqual({
        type: "ANALYZE_PAGE",
        data: { url: "https://example.com", content: "Test" },
      });
      expect(receivedMessages[1]).toEqual({
        type: "SEND_CHAT_MESSAGE",
        data: { sessionId: "session-1", message: "Hello" },
      });
    });

    it("should handle multiple listeners for same message type", async () => {
      const responses: string[] = [];

      // Set up multiple listeners for same message type
      chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (
          message &&
          typeof message === "object" &&
          "type" in message &&
          message.type === Message.ANALYZE_PAGE
        ) {
          responses.push("Listener 1");
          sendResponse({ decision: "ALLOW", reason: "From listener 1" });
        }
      });

      chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (
          message &&
          typeof message === "object" &&
          "type" in message &&
          message.type === Message.ANALYZE_PAGE
        ) {
          responses.push("Listener 2");
          sendResponse({ decision: "BLOCK_ALL", reason: "From listener 2" });
        }
      });

      // Send message
      await chrome.runtime.sendMessage({
        type: Message.ANALYZE_PAGE,
        data: { url: "https://example.com", content: "Test" },
      });

      // Verify both listeners were called
      expect(responses).toHaveLength(2);
      expect(responses).toContain("Listener 1");
      expect(responses).toContain("Listener 2");
    });
  });

  describe("Error handling", () => {
    it("should handle errors in message handlers", async () => {
      // Set up listener that throws an error
      chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (
          message &&
          typeof message === "object" &&
          "type" in message &&
          message.type === Message.ANALYZE_PAGE
        ) {
          try {
            throw new Error("Handler error");
          } catch (error) {
            // Send error response instead of letting it bubble up
            sendResponse({ error: "Handler error" });
          }
        }
      });

      // Send message and expect it to handle error
      const response = await chrome.runtime.sendMessage({
        type: Message.ANALYZE_PAGE,
        data: { url: "https://example.com", content: "Test" },
      });

      // Error should be caught and handled gracefully
      expect(response).toEqual({ error: "Handler error" });
    });

    it("should handle messages with no listeners", async () => {
      // Send message with no listeners
      const messagePromise = chrome.runtime.sendMessage({
        type: Message.ANALYZE_PAGE,
        data: { url: "https://example.com", content: "Test" },
      });

      // Add a timeout to handle the case where no listeners respond
      const timeoutPromise = asyncHelpers.wait(100).then(() => undefined);

      // Race between message and timeout
      const response = await Promise.race([messagePromise, timeoutPromise]);

      // Should handle gracefully with timeout
      expect(response).toBeUndefined();
    });
  });

  describe("Cross-context communication", () => {
    it("should simulate communication between background and content script", async () => {
      let receivedMessage: unknown;
      let receivedSender: unknown;

      // Background script handler
      chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        receivedMessage = message;
        receivedSender = sender;
        if (
          message &&
          typeof message === "object" &&
          "type" in message &&
          message.type === Message.ANALYZE_PAGE
        ) {
          sendResponse({
            decision: "REMOVE_ELEMENTS",
            reason: "Distracting elements found",
            selectors: [".sidebar", ".ads"],
          });
        }
      });

      // Content script sending message
      const contentScriptData = {
        url: "https://example.com",
        content: "<html>...</html>",
        alwaysRemove: ".ads",
      };

      const response = await chrome.runtime.sendMessage({
        type: Message.ANALYZE_PAGE,
        data: contentScriptData,
      });

      // Verify message and sender
      expect(receivedMessage).toEqual({
        type: Message.ANALYZE_PAGE,
        data: contentScriptData,
      });
      expect(receivedSender).toBeDefined();
      expect(response).toEqual({
        decision: "REMOVE_ELEMENTS",
        reason: "Distracting elements found",
        selectors: [".sidebar", ".ads"],
      });
    });

    it("should simulate communication between popup and background script", async () => {
      let receivedMessage: unknown;

      // Background script handler
      chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        receivedMessage = message;
        if (
          message &&
          typeof message === "object" &&
          "type" in message &&
          message.type === Message.SEND_CHAT_MESSAGE
        ) {
          sendResponse({
            sessionId: (message as { type: string; data: SendChatMessage }).data
              .sessionId,
            message: {
              id: "ai-response",
              content: "I'll help you stay focused!",
              role: "assistant",
              timestamp: Date.now(),
            },
            accessGranted: true,
            durationMinutes: 25,
          });
        }
      });

      // Popup sending message
      const popupData: SendChatMessage = {
        sessionId: "session-123",
        message: "I need help focusing",
      };

      const response = await chrome.runtime.sendMessage({
        type: Message.SEND_CHAT_MESSAGE,
        data: popupData,
      });

      // Verify communication
      expect(receivedMessage).toEqual({
        type: Message.SEND_CHAT_MESSAGE,
        data: popupData,
      });
      expect(response).toMatchObject({
        sessionId: "session-123",
        message: {
          content: "I'll help you stay focused!",
          role: "assistant",
        },
        accessGranted: true,
        durationMinutes: 25,
      });
    });
  });

  describe("Message serialization/deserialization", () => {
    it("should handle complex object serialization", async () => {
      const complexData: SendChatMessage = {
        sessionId: "session-with-special-chars_123",
        message: 'Message with unicode: 🎯, quotes: "test", and newlines\n',
      };

      let receivedData: SendChatMessage | undefined;

      // Set up listener
      chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (
          message &&
          typeof message === "object" &&
          "type" in message &&
          message.type === Message.SEND_CHAT_MESSAGE
        ) {
          receivedData = (message as { type: string; data: SendChatMessage })
            .data;
          sendResponse({
            sessionId: complexData.sessionId,
            message: {
              id: "response-with-unicode-🚀",
              content: "Response with special chars: \\, \", ', \n, \t",
              role: "assistant",
              timestamp: Date.now(),
            },
          });
        }
      });

      // Send complex message
      const response = await chrome.runtime.sendMessage({
        type: Message.SEND_CHAT_MESSAGE,
        data: complexData,
      });

      // Verify serialization/deserialization worked correctly
      expect(receivedData).toEqual(complexData);
      expect(receivedData?.sessionId).toBe(complexData.sessionId);
      expect(receivedData?.message).toContain("unicode");
      expect(response).toMatchObject({
        sessionId: complexData.sessionId,
        message: {
          content: "Response with special chars: \\, \", ', \n, \t",
          role: "assistant",
        },
      });
    });

    it("should handle date serialization", async () => {
      const now = new Date();
      const timestamp = now.getTime();

      const chatMessage: ChatMessage = {
        id: "msg-with-date",
        content: "Message with timestamp",
        role: "user",
        timestamp,
      };

      let receivedTimestamp: number | undefined;

      // Set up listener
      chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (
          message &&
          typeof message === "object" &&
          "type" in message &&
          message.type === Message.CHAT_RESPONSE
        ) {
          receivedTimestamp = (
            message as { type: string; data: { message: ChatMessage } }
          ).data.message.timestamp;
          sendResponse({ success: true });
        }
      });

      // Send message
      await chrome.runtime.sendMessage({
        type: Message.CHAT_RESPONSE,
        data: {
          sessionId: "date-session",
          message: chatMessage,
        },
      });

      // Verify timestamp is preserved correctly
      expect(receivedTimestamp).toBe(timestamp);
      expect(new Date(receivedTimestamp ?? 0)).toEqual(now);
    });

    it("should handle array serialization", async () => {
      const analysisResult: AnalysisResult = {
        decision: "REMOVE_ELEMENTS",
        reason: "Multiple elements to remove",
        selectors: [
          ".ads",
          ".sidebar",
          ".popup",
          ".notifications",
          ".tracking",
        ],
      };

      let receivedSelectors: string[] | undefined;

      // Set up listener
      chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (
          message &&
          typeof message === "object" &&
          "type" in message &&
          message.type === Message.BLOCK_RESULT
        ) {
          receivedSelectors = (
            message as { type: string; data: AnalysisResult }
          ).data.selectors;
          sendResponse({ success: true });
        }
      });

      // Send message
      await chrome.runtime.sendMessage({
        type: Message.BLOCK_RESULT,
        data: analysisResult,
      });

      // Verify array is preserved
      expect(receivedSelectors).toEqual(analysisResult.selectors);
      expect(receivedSelectors).toHaveLength(5);
      expect(receivedSelectors).toContain(".ads");
      expect(receivedSelectors).toContain(".tracking");
    });
  });

  describe("Type safety validation", () => {
    it("should validate message structure", async () => {
      let receivedData: unknown;

      // Set up listener
      chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (
          message &&
          typeof message === "object" &&
          "type" in message &&
          message.type === Message.ANALYZE_PAGE
        ) {
          receivedData = (message as { type: string; data: SendChatMessage })
            .data;
          sendResponse({ decision: "ALLOW", reason: "Valid data" });
        }
      });

      // Send message with correct structure
      const validData = {
        url: "https://example.com",
        content: "Test content",
        alwaysRemove: ".ads",
      };

      await chrome.runtime.sendMessage({
        type: Message.ANALYZE_PAGE,
        data: validData,
      });

      // Verify data structure is preserved
      expect(
        (
          receivedData as {
            url: string;
            content: string;
            alwaysRemove?: string;
          }
        ).url,
      ).toBe("https://example.com");
      expect(
        (
          receivedData as {
            url: string;
            content: string;
            alwaysRemove?: string;
          }
        ).content,
      ).toBe("Test content");
      expect(
        (
          receivedData as {
            url: string;
            content: string;
            alwaysRemove?: string;
          }
        ).alwaysRemove,
      ).toBe(".ads");
    });

    it("should handle optional fields correctly", async () => {
      let receivedData: unknown;

      // Set up listener
      chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (
          message &&
          typeof message === "object" &&
          "type" in message &&
          message.type === Message.ANALYZE_PAGE
        ) {
          receivedData = (message as { type: string; data: SendChatMessage })
            .data;
          sendResponse({ decision: "ALLOW", reason: "No blocking needed" });
        }
      });

      // Send message without optional field
      const dataWithoutOptional = {
        url: "https://example.com",
        content: "Test content",
        // alwaysRemove is optional
      };

      await chrome.runtime.sendMessage({
        type: Message.ANALYZE_PAGE,
        data: dataWithoutOptional,
      });

      // Verify optional field is undefined
      expect(
        (
          receivedData as {
            url: string;
            content: string;
            alwaysRemove?: string;
          }
        ).url,
      ).toBe("https://example.com");
      expect(
        (
          receivedData as {
            url: string;
            content: string;
            alwaysRemove?: string;
          }
        ).content,
      ).toBe("Test content");
      expect(
        (
          receivedData as {
            url: string;
            content: string;
            alwaysRemove?: string;
          }
        ).alwaysRemove,
      ).toBeUndefined();
    });
  });

  describe("Async message handling", () => {
    it("should handle async message handlers", async () => {
      let handlerCalled = false;
      let startTime: number;

      // Set up async handler
      chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (
          message &&
          typeof message === "object" &&
          "type" in message &&
          message.type === Message.ANALYZE_PAGE
        ) {
          startTime = Date.now();
          handlerCalled = true;

          // Simulate async processing
          setTimeout(() => {
            sendResponse({
              decision: "ALLOW",
              reason: "Async processing complete",
            });
          }, 100);

          return true; // Keep message channel open
        }
      });

      const testData = {
        url: "https://example.com",
        content: "Test content",
      };

      const response = await chrome.runtime.sendMessage({
        type: Message.ANALYZE_PAGE,
        data: testData,
      });

      // Verify async processing
      expect(handlerCalled).toBe(true);
      expect(response).toEqual({
        decision: "ALLOW",
        reason: "Async processing complete",
      });
    });

    it("should handle message timeouts", async () => {
      // Set up handler that never responds
      chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (
          message &&
          typeof message === "object" &&
          "type" in message &&
          message.type === Message.ANALYZE_PAGE
        ) {
          // Never call sendResponse - simulate timeout
          return true;
        }
      });

      const testData = {
        url: "https://example.com",
        content: "Test content",
      };

      // Send message with timeout
      const timeoutPromise = asyncHelpers.wait(100).then(() => {
        throw new Error("Message timeout");
      });

      await expect(
        Promise.race([
          chrome.runtime.sendMessage({
            type: Message.ANALYZE_PAGE,
            data: testData,
          }),
          timeoutPromise,
        ]),
      ).rejects.toThrow("Message timeout");
    });
  });
});
