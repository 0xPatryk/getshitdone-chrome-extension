import { describe, expect, it, mock } from "bun:test";

// Mock the AI SDK
const mockGenerateObject = mock();
mock.module("ai", () => ({
  generateObject: mockGenerateObject,
}));

import { analyzePageContent, processChatMessage } from "./services";

describe("AI Services", () => {
  describe("analyzePageContent", () => {
    it("should return ALLOW decision when appropriate", async () => {
      mockGenerateObject.mockResolvedValueOnce({
        object: {
          decision: "ALLOW",
          reason: "Relevant content",
          selectors: [],
        },
      });

      const result = await analyzePageContent(
        "api-key",
        "coding task",
        "<html>relevant content</html>",
        "https://example.com",
      );

      expect(result.decision).toBe("ALLOW");
      expect(result.reason).toBe("Relevant content");
      expect(result.selectors).toEqual([]);
      expect(mockGenerateObject).toHaveBeenCalled();
    });

    it("should return BLOCK_ALL decision with selectors", async () => {
      mockGenerateObject.mockResolvedValueOnce({
        object: {
          decision: "BLOCK_ALL",
          reason: "Distracting content",
          selectors: [".ad-banner"],
        },
      });

      const result = await analyzePageContent(
        "api-key",
        "coding task",
        "<html>distracting content</html>",
        "https://example.com",
      );

      expect(result.decision).toBe("BLOCK_ALL");
      expect(result.selectors).toContain(".ad-banner");
    });

    it("should handle errors gracefully", async () => {
      mockGenerateObject.mockRejectedValueOnce(new Error("API Error"));

      const result = await analyzePageContent(
        "api-key",
        "task",
        "content",
        "url",
      );

      expect(result.decision).toBe("ALLOW"); // Fail open
      expect(result.reason).toContain("Analysis failed");
    });
  });

  describe("processChatMessage", () => {
    it("should return formatted response and access decision", async () => {
      mockGenerateObject.mockResolvedValueOnce({
        object: {
          response: "Sure, go ahead.",
          decision: "GRANT",
          durationMinutes: 15,
        },
      });

      const result = await processChatMessage(
        "api-key",
        "task",
        "Can I check reddit?",
        [],
      );

      expect(result.message.content).toBe("Sure, go ahead.");
      expect(result.accessGranted).toBe(true);
      expect(result.durationMinutes).toBe(15);
      expect(result.message.role).toBe("assistant");
    });

    it("should return deny decision properly", async () => {
      mockGenerateObject.mockResolvedValueOnce({
        object: {
          response: "No, stay focused.",
          decision: "DENY",
        },
      });

      const result = await processChatMessage(
        "api-key",
        "task",
        "Can I check reddit?",
        [],
      );

      expect(result.accessGranted).toBe(false);
      expect(result.durationMinutes).toBeUndefined();
    });

    it("should handle errors gracefully", async () => {
      mockGenerateObject.mockRejectedValueOnce(new Error("API Error"));

      const result = await processChatMessage("api-key", "task", "message", []);

      expect(result.accessGranted).toBe(false);
      expect(result.message.content).toContain("Sorry, something went wrong");
    });
  });
});
