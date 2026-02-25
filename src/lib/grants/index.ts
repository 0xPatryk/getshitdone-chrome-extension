/**
 * Grants Module
 *
 * This module provides access grant management for the focus extension.
 * It handles temporary access grants for specific URLs with expiration.
 *
 * Key features:
 * - Type-safe access grant management
 * - Grant expiration handling
 * - Grant cleanup utilities
 *
 * @module grants
 */

// Re-export types
export type { AccessGrant } from "./types";

// Re-export schemas
export { AccessGrantSchema } from "./schemas";

// Re-export utilities (empty for now but included for completeness)
export * from "./utils";

// Re-export services
export {
  getActiveAccessGrant,
  setAccessGrant,
  removeAccessGrant,
  cleanupExpiredGrants,
  getAllActiveAccessGrants,
  getChatContextForGrants,
} from "./services";
