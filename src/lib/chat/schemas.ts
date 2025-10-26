/**
 * Chat Schemas Module
 *
 * This module contains Zod schemas for the chat domain.
 * Since ChatMessageSchema and ChatSessionSchema are already defined in messaging.ts,
 * this file primarily re-exports those schemas for convenience.
 *
 * @module chat/schemas
 */

// Re-export chat-related schemas from messaging
export {
  ChatMessageSchema,
  ChatSessionSchema,
  SendChatMessageSchema,
  ChatResponseSchema,
} from "~/lib/messaging";
