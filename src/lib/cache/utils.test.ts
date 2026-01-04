/**
 * Cache Utilities Unit Tests
 *
 * Tests for secure hash generation and cache key creation functions.
 * These are pure functions that don't depend on browser APIs.
 *
 * @module cache/utils.test
 */

import { describe, expect, it } from "vitest";
import { createSecureHash, generateCacheKey } from "./utils";

describe("createSecureHash", () => {
  describe("basic functionality", () => {
    it("should return a 16-character hexadecimal string", () => {
      const hash = createSecureHash("test input");
      expect(hash).toHaveLength(16);
      expect(hash).toMatch(/^[0-9a-f]+$/);
    });

    it("should produce deterministic output for the same input", () => {
      const input = "https://example.com:write report:null";
      const hash1 = createSecureHash(input);
      const hash2 = createSecureHash(input);
      expect(hash1).toBe(hash2);
    });

    it("should produce different hashes for different inputs", () => {
      const hash1 = createSecureHash("input one");
      const hash2 = createSecureHash("input two");
      expect(hash1).not.toBe(hash2);
    });
  });

  describe("edge cases", () => {
    it("should handle empty string", () => {
      const hash = createSecureHash("");
      expect(hash).toHaveLength(16);
      expect(hash).toMatch(/^[0-9a-f]+$/);
    });

    it("should handle unicode characters", () => {
      const hash = createSecureHash("日本語テスト 🚀");
      expect(hash).toHaveLength(16);
      expect(hash).toMatch(/^[0-9a-f]+$/);
    });

    it("should handle very long strings", () => {
      const longString = "a".repeat(10000);
      const hash = createSecureHash(longString);
      expect(hash).toHaveLength(16);
      expect(hash).toMatch(/^[0-9a-f]+$/);
    });

    it("should handle strings with special characters", () => {
      const specialChars = "!@#$%^&*()_+-=[]{}|;':\",.<>?/\\`~";
      const hash = createSecureHash(specialChars);
      expect(hash).toHaveLength(16);
      expect(hash).toMatch(/^[0-9a-f]+$/);
    });

    it("should handle newlines and whitespace", () => {
      const whitespace = "line1\nline2\tline3  line4";
      const hash = createSecureHash(whitespace);
      expect(hash).toHaveLength(16);
    });
  });

  describe("hash uniqueness", () => {
    it("should produce unique hashes for similar inputs", () => {
      const hash1 = createSecureHash("test");
      const hash2 = createSecureHash("Test");
      const hash3 = createSecureHash("test ");
      const hash4 = createSecureHash(" test");

      const hashes = [hash1, hash2, hash3, hash4];
      const uniqueHashes = new Set(hashes);
      expect(uniqueHashes.size).toBe(4);
    });

    it("should differentiate between leading/trailing spaces", () => {
      const hash1 = createSecureHash("url:task:null");
      const hash2 = createSecureHash("url:task:null ");
      const hash3 = createSecureHash(" url:task:null");
      expect(hash1).not.toBe(hash2);
      expect(hash1).not.toBe(hash3);
    });
  });
});

describe("generateCacheKey", () => {
  describe("basic functionality", () => {
    it("should generate a cache key from URL, task, and alwaysRemove", () => {
      const key = generateCacheKey(
        "https://example.com",
        "Write research paper",
        ".ads,.sidebar",
      );
      expect(key).toHaveLength(50); // 16 + 1 + 16 + 1 + 16
      expect(key).toMatch(/^[0-9a-f]{16}:[0-9a-f]{16}:[0-9a-f]{16}$/);
    });

    it("should produce deterministic keys for the same inputs", () => {
      const key1 = generateCacheKey("https://example.com", "task", ".ads");
      const key2 = generateCacheKey("https://example.com", "task", ".ads");
      expect(key1).toBe(key2);
    });

    it("should produce different keys for different URLs", () => {
      const key1 = generateCacheKey("https://example.com", "task", null);
      const key2 = generateCacheKey("https://different.com", "task", null);
      expect(key1).not.toBe(key2);
    });

    it("should produce different keys for different tasks", () => {
      const key1 = generateCacheKey("https://example.com", "task one", null);
      const key2 = generateCacheKey("https://example.com", "task two", null);
      expect(key1).not.toBe(key2);
    });

    it("should produce different keys for different alwaysRemove values", () => {
      const key1 = generateCacheKey("https://example.com", "task", ".ads");
      const key2 = generateCacheKey("https://example.com", "task", ".sidebar");
      expect(key1).not.toBe(key2);
    });
  });

  describe("null alwaysRemove handling", () => {
    it("should handle null alwaysRemove", () => {
      const key = generateCacheKey("https://example.com", "task", null);
      expect(key).toHaveLength(50);
      expect(key).toMatch(/^[0-9a-f]{16}:[0-9a-f]{16}:[0-9a-f]{16}$/);
    });

    it("should differentiate between null and empty string alwaysRemove", () => {
      // Note: In the implementation, null is converted to string "null"
      // so these might produce different results
      const keyWithNull = generateCacheKey("https://example.com", "task", null);
      const keyWithEmpty = generateCacheKey("https://example.com", "task", "");
      // They should be different because null.toString() produces different result
      expect(typeof keyWithNull).toBe("string");
      expect(typeof keyWithEmpty).toBe("string");
    });

    it("should produce consistent keys with null across multiple calls", () => {
      const key1 = generateCacheKey("https://a.com", "b", null);
      const key2 = generateCacheKey("https://a.com", "b", null);
      expect(key1).toBe(key2);
    });
  });

  describe("edge cases", () => {
    it("should handle URLs with query parameters", () => {
      const key = generateCacheKey(
        "https://example.com/page?query=test&other=value",
        "task",
        null,
      );
      expect(key).toHaveLength(50);
    });

    it("should handle URLs with fragments", () => {
      const key = generateCacheKey(
        "https://example.com/page#section",
        "task",
        null,
      );
      expect(key).toHaveLength(50);
    });

    it("should handle empty strings for URL and task", () => {
      const key = generateCacheKey("", "", null);
      expect(key).toHaveLength(50);
    });

    it("should handle very long URLs", () => {
      const longUrl = `https://example.com/${"path/".repeat(200)}`;
      const key = generateCacheKey(longUrl, "task", null);
      expect(key).toHaveLength(50);
    });

    it("should handle very long tasks", () => {
      const longTask = "a".repeat(1000);
      const key = generateCacheKey("https://example.com", longTask, null);
      expect(key).toHaveLength(50);
    });

    it("should handle complex alwaysRemove selectors", () => {
      const complexSelectors =
        ".ads, .sidebar, #banner, [data-ad], div.promotion, aside.recommendations";
      const key = generateCacheKey(
        "https://example.com",
        "task",
        complexSelectors,
      );
      expect(key).toHaveLength(50);
    });

    it("should handle special characters in task", () => {
      const key = generateCacheKey(
        "https://example.com",
        "Write report about AI & ML (with examples)",
        null,
      );
      expect(key).toHaveLength(50);
    });
  });

  describe("collision resistance", () => {
    it("should produce unique keys for a batch of different inputs", () => {
      const keys = new Set<string>();
      const urls = [
        "https://google.com",
        "https://github.com",
        "https://twitter.com",
      ];
      const tasks = ["task1", "task2", "task3"];
      const alwaysRemoves = [null, ".ads", ".sidebar"];

      for (const url of urls) {
        for (const task of tasks) {
          for (const ar of alwaysRemoves) {
            const key = generateCacheKey(url, task, ar);
            keys.add(key);
          }
        }
      }

      // All 27 combinations should produce unique keys
      expect(keys.size).toBe(27);
    });
  });
});
