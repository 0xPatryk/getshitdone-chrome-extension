/**
 * Cache Utilities Module
 *
 * This module provides utility functions for the caching system, including
 * secure hash generation and cache key creation.
 *
 * Key features:
 * - Secure hash-based cache key generation
 * - Consistent cache key formatting
 * - Cryptographic security for cache keys
 *
 * @module cache.utils
 */

import { sha256 } from "@noble/hashes/sha2.js";
import { bytesToHex } from "@noble/hashes/utils.js";

/**
 * Creates a secure hash for cache keys using SHA-256.
 * Uses the first 16 characters of the hex-encoded hash for compactness.
 *
 * @param str - The input string to hash
 * @returns A 16-character hexadecimal hash
 *
 * @example
 * ```typescript
 * const hash = createSecureHash("https://example.com:write report:null");
 * console.log(hash); // "a1b2c3d4e5f6g7h8"
 * ```
 */
export const createSecureHash = (str: string): string => {
  const hash = sha256(new TextEncoder().encode(str));
  return bytesToHex(hash).substring(0, 16);
};

/**
 * Generates a unique cache key based on URL, task, and always-remove settings.
 * Combines the parameters and creates a secure hash for consistent lookup.
 *
 * @param url - The URL of the page being cached
 * @param task - The current user task
 * @param alwaysRemove - The always-remove CSS selector configuration
 * @returns A unique cache key for the combination of parameters
 *
 * @example
 * ```typescript
 * const key = generateCacheKey(
 *   "https://example.com",
 *   "Write research paper",
 *   ".ads,.sidebar"
 * );
 * ```
 */
export const generateCacheKey = (
  url: string,
  task: string,
  alwaysRemove: string | null,
): string => {
  const urlHash = createSecureHash(url);
  const taskHash = createSecureHash(task);
  const arHash = createSecureHash(String(alwaysRemove));

  return `${urlHash}:${taskHash}:${arHash}`;
};
