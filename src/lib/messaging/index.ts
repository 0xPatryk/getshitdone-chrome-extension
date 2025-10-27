/**
 * Messaging Module
 *
 * This module provides type-safe messaging between different parts of the browser extension.
 * It uses Zod schemas for runtime validation and @webext-core/messaging for type-safe
 * communication between background scripts, content scripts, and popup.
 *
 * Key features:
 * - Type-safe message passing
 * - Runtime validation with Zod schemas
 * - Support for different message types
 * - Bidirectional communication
 *
 * @module messaging
 */

// Re-export types
export {
  Message,
  type Messages,
  type AnalysisResult,
  type ChatMessage,
  type ChatSession,
  type SendChatMessage,
  type ChatResponse,
  type InvalidateCacheTask,
  type InvalidateCacheAlwaysRemove,
} from "./types";

// Re-export schemas
export {
  AnalysisResultSchema,
  ChatMessageSchema,
  ChatSessionSchema,
  SendChatMessageSchema,
  ChatResponseSchema,
  ChatProcessResultSchema,
  InvalidateCacheTaskSchema,
  InvalidateCacheAlwaysRemoveSchema,
} from "./schemas";

// Re-export services
export { sendMessage, onMessage } from "./services";

// Re-export utilities (empty for now but included for completeness)
export * from "./utils";
