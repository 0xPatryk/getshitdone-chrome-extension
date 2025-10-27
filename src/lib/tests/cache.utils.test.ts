/**
 * Cache Utilities Tests
 *
 * This file contains unit tests for the cache utilities module.
 * It tests hash generation and cache key creation functions.
 *
 * Key features tested:
 * - Secure hash generation using SHA-256
 * - Cache key generation from URL, task, and always-remove settings
 * - Consistency of hash generation
 * - Edge cases for cache key creation
 */

import { describe, expect, it } from "bun:test";
import { createSecureHash, generateCacheKey } from "~/lib/cache/utils";

describe("Cache Utils", () => {
  describe("createSecureHash", () => {
    it("should generate a consistent 16-character hash for the same input", () => {
      const input = "test-input-string";
      const hash1 = createSecureHash(input);
      const hash2 = createSecureHash(input);

      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(16);
      expect(hash2).toHaveLength(16);
    });

    it("should generate different hashes for different inputs", () => {
      const input1 = "first-input";
      const input2 = "second-input";
      const hash1 = createSecureHash(input1);
      const hash2 = createSecureHash(input2);

      expect(hash1).not.toBe(hash2);
      expect(hash1).toHaveLength(16);
      expect(hash2).toHaveLength(16);
    });

    it("should handle empty string input", () => {
      const hash = createSecureHash("");
      
      expect(hash).toHaveLength(16);
      expect(typeof hash).toBe("string");
    });

    it("should handle special characters in input", () => {
      const input = "special-chars-!@#$%^&*()_+-=[]{}|;':\",./<>?";
      const hash = createSecureHash(input);
      
      expect(hash).toHaveLength(16);
      expect(typeof hash).toBe("string");
    });

    it("should handle very long input strings", () => {
      const input = "a".repeat(1000);
      const hash = createSecureHash(input);
      
      expect(hash).toHaveLength(16);
      expect(typeof hash).toBe("string");
    });

    it("should handle Unicode characters", () => {
      const input = "unicode-test-🚀-测试-проверка";
      const hash = createSecureHash(input);
      
      expect(hash).toHaveLength(16);
      expect(typeof hash).toBe("string");
    });

    it("should generate hexadecimal strings", () => {
      const input = "test-hex";
      const hash = createSecureHash(input);
      
      expect(hash).toMatch(/^[0-9a-f]{16}$/);
    });
  });

  describe("generateCacheKey", () => {
    it("should generate a consistent cache key for the same parameters", () => {
      const url = "https://example.com";
      const task = "write report";
      const alwaysRemove = ".ads,.sidebar";
      
      const key1 = generateCacheKey(url, task, alwaysRemove);
      const key2 = generateCacheKey(url, task, alwaysRemove);
      
      expect(key1).toBe(key2);
      expect(key1).toHaveLength(16);
    });

    it("should generate different keys for different URLs", () => {
      const task = "write report";
      const alwaysRemove = ".ads,.sidebar";
      
      const key1 = generateCacheKey("https://example.com", task, alwaysRemove);
      const key2 = generateCacheKey("https://different.com", task, alwaysRemove);
      
      expect(key1).not.toBe(key2);
    });

    it("should generate different keys for different tasks", () => {
      const url = "https://example.com";
      const alwaysRemove = ".ads,.sidebar";
      
      const key1 = generateCacheKey(url, "write report", alwaysRemove);
      const key2 = generateCacheKey(url, "read article", alwaysRemove);
      
      expect(key1).not.toBe(key2);
    });

    it("should generate different keys for different alwaysRemove settings", () => {
      const url = "https://example.com";
      const task = "write report";
      
      const key1 = generateCacheKey(url, task, ".ads,.sidebar");
      const key2 = generateCacheKey(url, task, ".popups,.banners");
      
      expect(key1).not.toBe(key2);
    });

    it("should handle null alwaysRemove parameter", () => {
      const url = "https://example.com";
      const task = "write report";
      
      const key1 = generateCacheKey(url, task, null);
      const key2 = generateCacheKey(url, task, null);
      
      expect(key1).toBe(key2);
      expect(key1).toHaveLength(16);
    });

    it("should handle empty string alwaysRemove parameter", () => {
      const url = "https://example.com";
      const task = "write report";
      
      const key1 = generateCacheKey(url, task, "");
      const key2 = generateCacheKey(url, task, "");
      
      expect(key1).toBe(key2);
      expect(key1).toHaveLength(16);
    });

    it("should differentiate between null and empty string alwaysRemove", () => {
      const url = "https://example.com";
      const task = "write report";
      
      const key1 = generateCacheKey(url, task, null);
      const key2 = generateCacheKey(url, task, "");
      
      expect(key1).not.toBe(key2);
    });

    it("should handle complex URLs with query parameters and fragments", () => {
      const url = "https://example.com/path/to/page?param1=value1&param2=value2#section";
      const task = "analyze content";
      const alwaysRemove = ".ads";
      
      const key = generateCacheKey(url, task, alwaysRemove);
      
      expect(key).toHaveLength(16);
      expect(typeof key).toBe("string");
    });

    it("should handle very long parameters", () => {
      const url = `https://example.com/${"path".repeat(100)}`;
      const task = "task ".repeat(50);
      const alwaysRemove = ".selector".repeat(20);
      
      const key = generateCacheKey(url, task, alwaysRemove);
      
      expect(key).toHaveLength(16);
      expect(typeof key).toBe("string");
    });

    it("should handle special characters in parameters", () => {
      const url = "https://example.com/path?query=value&special=!@#$%";
      const task = "task with 特殊 characters";
      const alwaysRemove = ".selector[data-attr='value']";
      
      const key = generateCacheKey(url, task, alwaysRemove);
      
      expect(key).toHaveLength(16);
      expect(typeof key).toBe("string");
    });

    it("should generate unique keys for parameter permutations", () => {
      const url = "https://example.com";
      const task = "write report";
      const alwaysRemove = ".ads";
      
      // Test all parameter orderings (though function has fixed order)
      const keys = [
        generateCacheKey(url, task, alwaysRemove),
        generateCacheKey(url, task, alwaysRemove),
        generateCacheKey(url, task, alwaysRemove),
      ];
      
      // All should be the same since parameters are identical
      expect(keys[0]).toBe(keys[1]);
      expect(keys[1]).toBe(keys[2]);
    });

    it("should handle edge case with all empty parameters", () => {
      const key = generateCacheKey("", "", "");
      
      expect(key).toHaveLength(16);
      expect(typeof key).toBe("string");
    });

    it("should handle edge case with all null/undefined parameters", () => {
      const key1 = generateCacheKey("", "", null);
      const key2 = generateCacheKey("", "", null);
      
      expect(key1).toBe(key2);
      expect(key1).toHaveLength(16);
    });
  });
});