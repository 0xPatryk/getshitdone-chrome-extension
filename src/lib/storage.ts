/**
 * Storage Module
 *
 * This module provides a comprehensive storage abstraction layer for the focus extension.
 * It handles persistent storage of user preferences, cache data, chat sessions, and
 * access grants using WXT's storage system with type safety and React hooks.
 *
 * Key features:
 * - Type-safe storage keys and values
 * - React hooks for reactive storage
 * - Access grant management
 * - Environment variable initialization
 * - Storage utility functions
 *
 * @module storage
 */

// Re-export everything from the storage domain
export * from "./storage";

// Re-export everything from the grants domain
export * from "./grants";
