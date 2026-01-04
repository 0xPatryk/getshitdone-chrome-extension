/**
 * Chat Utilities Unit Tests
 *
 * Tests for session ID generation, message ID generation, and chat message creation.
 * Uses bun's setSystemTime for time mocking.
 *
 * @module chat/utils.test
 */

import { afterEach, describe, expect, it, setSystemTime } from "bun:test";
import {
  createChatMessage,
  generateMessageId,
  generateSessionId,
  getCurrentTimestamp,
} from "~/lib/chat/utils";

describe("generateSessionId", () => {
  afterEach(() => {
    // Reset to real time
    setSystemTime();
  });

  it("should return a string starting with 'session_'", () => {
    const id = generateSessionId();
    expect(id).toMatch(/^session_/);
  });

  it("should include a timestamp in the ID", () => {
    const mockTime = new Date(1704067200000); // 2024-01-01 00:00:00 UTC
    setSystemTime(mockTime);

    const id = generateSessionId();
    expect(id).toBe(`session_${mockTime.getTime()}`);
  });

  it("should produce unique IDs for different timestamps", () => {
    setSystemTime(new Date(1000));
    const id1 = generateSessionId();

    setSystemTime(new Date(2000));
    const id2 = generateSessionId();

    expect(id1).not.toBe(id2);
  });

  it("should produce the same ID if called at the same timestamp", () => {
    setSystemTime(new Date(1704067200000));
    const id1 = generateSessionId();
    const id2 = generateSessionId();

    // Note: This tests the deterministic nature of the function
    expect(id1).toBe(id2);
  });
});

describe("generateMessageId", () => {
  afterEach(() => {
    setSystemTime();
  });

  it("should return a string starting with 'msg_'", () => {
    const id = generateMessageId();
    expect(id).toMatch(/^msg_/);
  });

  it("should include a timestamp in the ID", () => {
    const mockTime = new Date(1704067200000);
    setSystemTime(mockTime);

    const id = generateMessageId();
    expect(id).toMatch(new RegExp(`^msg_${mockTime.getTime()}_`));
  });

  it("should include a random suffix", () => {
    setSystemTime(new Date(1704067200000));

    const id = generateMessageId();
    const parts = id.split("_");

    expect(parts.length).toBe(3);
    expect(parts[0]).toBe("msg");
    expect(parts[2]).toMatch(/^[a-z0-9]+$/);
  });

  it("should produce IDs with random suffix for uniqueness", () => {
    setSystemTime(new Date(1704067200000));

    // Generate multiple IDs - they might or might not be unique
    // depending on Math.random(), but the format should be consistent
    const ids = Array.from({ length: 5 }, () => generateMessageId());

    for (const id of ids) {
      expect(id).toMatch(/^msg_\d+_[a-z0-9]+$/);
    }
  });

  // Note: Using timestamp 1 instead of 0 because bun's setSystemTime
  // has issues with Date(0) sometimes not applying the mock correctly
  it("should handle very small timestamps", () => {
    setSystemTime(new Date(1));
    const id = generateMessageId();
    expect(id).toMatch(/^msg_1_[a-z0-9]+$/);
  });
});

describe("createChatMessage", () => {
  afterEach(() => {
    setSystemTime();
  });

  describe("user messages", () => {
    it("should create a user message with generated ID and timestamp", () => {
      const mockTime = new Date(1704067200000);
      setSystemTime(mockTime);

      const message = createChatMessage({
        content: "Hello, I need help",
        role: "user",
      });

      expect(message.content).toBe("Hello, I need help");
      expect(message.role).toBe("user");
      expect(message.timestamp).toBe(mockTime.getTime());
      expect(message.id).toMatch(/^msg_/);
    });

    it("should preserve the exact content provided", () => {
      setSystemTime(new Date(1000));

      const content = "This is a message with special chars: @#$%^&*()";
      const message = createChatMessage({
        content,
        role: "user",
      });

      expect(message.content).toBe(content);
    });

    it("should handle empty content", () => {
      setSystemTime(new Date(1000));

      const message = createChatMessage({
        content: "",
        role: "user",
      });

      expect(message.content).toBe("");
    });

    it("should handle multiline content", () => {
      setSystemTime(new Date(1000));

      const content = "Line 1\nLine 2\nLine 3";
      const message = createChatMessage({
        content,
        role: "user",
      });

      expect(message.content).toBe(content);
    });
  });

  describe("assistant messages", () => {
    it("should create an assistant message with generated ID and timestamp", () => {
      const mockTime = new Date(1704067200000);
      setSystemTime(mockTime);

      const message = createChatMessage({
        content: "I can help you with that",
        role: "assistant",
      });

      expect(message.content).toBe("I can help you with that");
      expect(message.role).toBe("assistant");
      expect(message.timestamp).toBe(mockTime.getTime());
      expect(message.id).toMatch(/^msg_/);
    });
  });

  describe("message structure", () => {
    it("should return an object with exactly four properties", () => {
      setSystemTime(new Date(1000));

      const message = createChatMessage({
        content: "test",
        role: "user",
      });

      const keys = Object.keys(message);
      expect(keys.sort()).toEqual(["content", "id", "role", "timestamp"]);
    });

    it("should preserve original properties while adding id and timestamp", () => {
      setSystemTime(new Date(5000));

      const input = {
        content: "original content",
        role: "user" as const,
      };

      const message = createChatMessage(input);

      expect(message.content).toBe(input.content);
      expect(message.role).toBe(input.role);
      expect(message.id).toBeDefined();
      expect(message.timestamp).toBe(5000);
    });
  });

  describe("unique IDs", () => {
    it("should generate unique IDs for different messages at different times", () => {
      setSystemTime(new Date(1000));
      const msg1 = createChatMessage({ content: "1", role: "user" });

      setSystemTime(new Date(2000));
      const msg2 = createChatMessage({ content: "2", role: "user" });

      expect(msg1.id).not.toBe(msg2.id);
    });
  });
});

describe("getCurrentTimestamp", () => {
  afterEach(() => {
    setSystemTime();
  });

  it("should return the current timestamp", () => {
    const mockTime = new Date(1704067200000);
    setSystemTime(mockTime);

    expect(getCurrentTimestamp()).toBe(mockTime.getTime());
  });

  it("should return different values as time advances", () => {
    setSystemTime(new Date(1000));
    const t1 = getCurrentTimestamp();

    setSystemTime(new Date(2000));
    const t2 = getCurrentTimestamp();

    expect(t1).toBe(1000);
    expect(t2).toBe(2000);
  });

  // Note: Using timestamp 1 instead of 0 because bun's setSystemTime
  // has issues with Date(0) sometimes not applying the mock correctly
  it("should handle very small timestamps", () => {
    setSystemTime(new Date(1));
    expect(getCurrentTimestamp()).toBe(1);
  });

  it("should handle large timestamps", () => {
    const farFuture = 32503680000000; // Year 3000
    setSystemTime(new Date(farFuture));
    expect(getCurrentTimestamp()).toBe(farFuture);
  });
});
