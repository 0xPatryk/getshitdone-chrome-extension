/**
 * Messaging Services Tests
 *
 * This file contains unit tests for messaging service functions.
 * Tests cover message sending and receiving functionality.
 *
 * @module tests/messaging.services
 */

import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";
import { onMessage, sendMessage } from "~/lib/messaging/services";
import { Message } from "~/lib/messaging/types";

// Mock browser runtime API
const mockRuntime = {
  sendMessage: mock(() => Promise.resolve({})),
  onMessage: {
    addListener: mock(() => ({})),
  },
};

// Mock the browser runtime
global.chrome = {
  runtime: mockRuntime,
} as unknown;

describe("Messaging Services", () => {
  beforeEach(() => {
    // Reset all mocks before each test
    mockRuntime.sendMessage.mockClear();
    mockRuntime.onMessage.addListener.mockClear();
  });

  afterEach(() => {
    // Clean up any global state
    mock.restore();
  });

  describe("sendMessage", () => {
    it("should send message and return response", async () => {
      const messageData = { test: "data" };
      const expectedResponse = { result: "success" };

      mockRuntime.sendMessage.mockResolvedValue(expectedResponse);

      const response = await sendMessage(Message.ANALYZE_PAGE, messageData);

      expect(mockRuntime.sendMessage).toHaveBeenCalledWith(
        Message.ANALYZE_PAGE,
        messageData,
        expect.any(Function),
      );
      expect(response).toEqual(expectedResponse);
    });

    it("should handle send message errors", async () => {
      const messageData = { test: "data" };
      const errorMessage = "Send message failed";

      mockRuntime.sendMessage.mockRejectedValue(new Error(errorMessage));

      await expect(
        sendMessage(Message.ANALYZE_PAGE, messageData),
      ).rejects.toThrow(errorMessage);
    });
  });

  describe("onMessage", () => {
    it("should register message listener", () => {
      const handler = mock(() => ({}));

      onMessage(Message.ANALYZE_PAGE, handler);

      expect(mockRuntime.onMessage.addListener).toHaveBeenCalledWith(
        Message.ANALYZE_PAGE,
        handler,
      );
    });

    it("should call handler when message received", () => {
      const handler = mock(() => ({}));
      const messageData = { test: "data" };

      onMessage(Message.ANALYZE_PAGE, handler);

      // Get the registered listener
      const listener = mockRuntime.onMessage.addListener.mock.calls[0][1];

      // Simulate message reception
      listener(messageData);

      expect(handler).toHaveBeenCalledWith(messageData);
    });
  });
});
