/**
 * Unit Tests for Chat Utils Module
 *
 * This file contains unit tests for the chat utility functions.
 * Tests cover ID generation, message creation, and timestamp utilities.
 *
 * @module chat/utils.test
 */

import { describe, expect, it } from "bun:test";
import type { ChatMessage } from "~/lib/messaging";
import {
  createChatMessage,
  generateMessageId,
  generateSessionId,
  getCurrentTimestamp,
} from "~/lib/chat/utils";

describe("Chat Utils", () => {
  describe("generateSessionId", () => {
    it("should generate a session ID with the correct prefix", () => {
      const sessionId = generateSessionId();
      expect(sessionId).toStartWith("session_");
    });

    it("should generate unique session IDs", async () => {
      const sessionId1 = generateSessionId();
      // Add a small delay to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 1));
      const sessionId2 = generateSessionId();
      expect(sessionId1).not.toEqual(sessionId2);
    });

    it("should generate a numeric timestamp after the prefix", () => {
      const sessionId = generateSessionId();
      const timestampPart = sessionId.replace("session_", "");
      expect(timestampPart).toMatch(/^\d+$/);
    });

    it("should generate a timestamp close to the current time", () => {
      const beforeTime = Date.now();
      const sessionId = generateSessionId();
      const afterTime = Date.now();
      
      const timestampPart = Number.parseInt(sessionId.replace("session_", ""), 10);
      expect(timestampPart).toBeGreaterThanOrEqual(beforeTime);
      expect(timestampPart).toBeLessThanOrEqual(afterTime);
    });
  });

  describe("generateMessageId", () => {
    it("should generate a message ID with the correct prefix", () => {
      const messageId = generateMessageId();
      expect(messageId).toStartWith("msg_");
    });

    it("should generate unique message IDs", () => {
      const messageId1 = generateMessageId();
      const messageId2 = generateMessageId();
      expect(messageId1).not.toEqual(messageId2);
    });

    it("should contain a timestamp and random string", () => {
      const messageId = generateMessageId();
      const parts = messageId.replace("msg_", "").split("_");
      expect(parts).toHaveLength(2);
      
      // First part should be a timestamp
      expect(parts[0]).toMatch(/^\d+$/);
      
      // Second part should be a random string
      expect(parts[1]).toMatch(/^[a-z0-9]+$/);
    });

    it("should generate a timestamp close to the current time", () => {
      const beforeTime = Date.now();
      const messageId = generateMessageId();
      const afterTime = Date.now();
      
      const timestampPart = Number.parseInt(messageId.replace("msg_", "").split("_")[0], 10);
      expect(timestampPart).toBeGreaterThanOrEqual(beforeTime);
      expect(timestampPart).toBeLessThanOrEqual(afterTime);
    });

    it("should generate a random string of the expected length", () => {
      const messageId = generateMessageId();
      const randomPart = messageId.replace("msg_", "").split("_")[1];
      expect(randomPart).toHaveLength(9);
    });
  });

  describe("createChatMessage", () => {
    it("should create a complete chat message with generated ID and timestamp", () => {
      const messageInput = {
        content: "Test message content",
        role: "user" as const,
      };

      const message = createChatMessage(messageInput);

      expect(message).toEqual({
        id: expect.stringMatching(/^msg_\d+_[a-z0-9]{9}$/),
        content: "Test message content",
        role: "user",
        timestamp: expect.any(Number),
      });
    });

    it("should create a message with assistant role", () => {
      const messageInput = {
        content: "Assistant response",
        role: "assistant" as const,
      };

      const message = createChatMessage(messageInput);

      expect(message.role).toBe("assistant");
      expect(message.content).toBe("Assistant response");
    });

    it("should generate a unique ID for each message", () => {
      const messageInput = {
        content: "Test message",
        role: "user" as const,
      };

      const message1 = createChatMessage(messageInput);
      const message2 = createChatMessage(messageInput);

      expect(message1.id).not.toEqual(message2.id);
    });

    it("should generate a timestamp close to the current time", () => {
      const beforeTime = Date.now();
      const message = createChatMessage({
        content: "Test message",
        role: "user",
      });
      const afterTime = Date.now();

      expect(message.timestamp).toBeGreaterThanOrEqual(beforeTime);
      expect(message.timestamp).toBeLessThanOrEqual(afterTime);
    });

    it("should preserve all input properties", () => {
      const messageInput = {
        content: "Complex message content",
        role: "user" as const,
      };

      const message = createChatMessage(messageInput);

      expect(message.content).toBe(messageInput.content);
      expect(message.role).toBe(messageInput.role);
    });

    it("should return a valid ChatMessage type", () => {
      const message = createChatMessage({
        content: "Type check",
        role: "assistant",
      });

      // TypeScript type check would be done at compile time,
      // but we can verify the structure at runtime
      const isChatMessage = (
        msg: unknown
      ): msg is ChatMessage =>
        typeof msg === "object" &&
        msg !== null &&
        "id" in msg &&
        "content" in msg &&
        "role" in msg &&
        "timestamp" in msg &&
        typeof (msg as ChatMessage).id === "string" &&
        typeof (msg as ChatMessage).content === "string" &&
        (msg as ChatMessage).role === "user" ||
        (msg as ChatMessage).role === "assistant" &&
        typeof (msg as ChatMessage).timestamp === "number";

      expect(isChatMessage(message)).toBe(true);
    });
  });

  describe("getCurrentTimestamp", () => {
    it("should return a number", () => {
      const timestamp = getCurrentTimestamp();
      expect(typeof timestamp).toBe("number");
    });

    it("should return a timestamp close to Date.now()", () => {
      const beforeTime = Date.now();
      const timestamp = getCurrentTimestamp();
      const afterTime = Date.now();

      expect(timestamp).toBeGreaterThanOrEqual(beforeTime);
      expect(timestamp).toBeLessThanOrEqual(afterTime);
    });

    it("should return a Unix timestamp in milliseconds", () => {
      const timestamp = getCurrentTimestamp();
      const dateFromTimestamp = new Date(timestamp);
      expect(dateFromTimestamp.getTime()).toBe(timestamp);
    });

    it("should return different values on subsequent calls", () => {
      const timestamp1 = getCurrentTimestamp();
      // Add a small delay to ensure different timestamps
      setTimeout(() => {
        const timestamp2 = getCurrentTimestamp();
        expect(timestamp2).toBeGreaterThan(timestamp1);
      }, 1);
    });
  });

  describe("Integration tests", () => {
    it("should work together to create a complete chat flow", () => {
      // Generate session ID
      const sessionId = generateSessionId();
      expect(sessionId).toStartWith("session_");

      // Create user message
      const userMessage = createChatMessage({
        content: "I need help with focus",
        role: "user",
      });
      expect(userMessage.role).toBe("user");

      // Create assistant message
      const assistantMessage = createChatMessage({
        content: "I'll help you stay focused!",
        role: "assistant",
      });
      expect(assistantMessage.role).toBe("assistant");

      // Verify all IDs are unique
      expect(userMessage.id).not.toEqual(assistantMessage.id);
      expect(sessionId).not.toContain(userMessage.id);
      expect(sessionId).not.toContain(assistantMessage.id);

      // Verify timestamps are reasonable
      expect(userMessage.timestamp).toBeLessThanOrEqual(assistantMessage.timestamp);
    });
  });
});