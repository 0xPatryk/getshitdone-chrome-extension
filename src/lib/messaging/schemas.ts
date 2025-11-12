/**
 * Messaging Schemas
 *
 * This module contains all Zod schemas for runtime validation
 * of messaging data structures in the extension.
 *
 * @module messaging/schemas
 */

import { z } from "zod";

/**
 * Zod schema for page analysis results
 * Validates the structure of AI analysis responses
 */
export const AnalysisResultSchema = z.object({
  /**
   * The decision about what to do with the page
   */
  decision: z.enum(["BLOCK_ALL", "ALLOW"]),

  /**
   * Explanation for the decision
   */
  reason: z.string(),

  /**
   * CSS selectors for elements to remove (if applicable)
   */
  selectors: z.array(z.string()).optional(),
});

/**
 * Zod schema for individual chat messages
 * Validates message structure and content
 */
export const ChatMessageSchema = z.object({
  /**
   * Unique identifier for the message
   */
  id: z.string(),

  /**
   * The text content of the message
   */
  content: z.string(),

  /**
   * The role of the message sender
   */
  role: z.enum(["user", "assistant"]),

  /**
   * Unix timestamp when the message was created
   */
  timestamp: z.number(),
});

/**
 * Zod schema for chat sessions
 * Validates session structure and message history
 */
export const ChatSessionSchema = z.object({
  /**
   * Unique identifier for the session
   */
  id: z.string(),

  /**
   * Array of messages in the session
   */
  messages: z.array(ChatMessageSchema),

  /**
   * Unix timestamp when the session was created
   */
  createdAt: z.number(),

  /**
   * Current status of the session
   */
  status: z.enum(["active", "completed"]),
});

/**
 * Zod schema for sending chat messages
 * Validates the data structure for chat message requests
 */
export const SendChatMessageSchema = z.object({
  /**
   * ID of the session to send the message to
   */
  sessionId: z.string(),

  /**
   * The message content to send
   */
  message: z.string(),
});

/**
 * Zod schema for chat responses from AI
 * Validates the structure of AI responses
 */
export const ChatResponseSchema = z.object({
  /**
   * ID of the session the response belongs to
   */
  sessionId: z.string(),

  /**
   * The AI's response message
   */
  message: ChatMessageSchema,

  /**
   * Whether access was granted (optional)
   */
  accessGranted: z.boolean().optional(),

  /**
   * Duration of granted access in minutes (optional)
   */
  durationMinutes: z.number().optional(),
});

/**
 * Zod schema for cache invalidation on task change
 * Validates task change data for cache invalidation
 */
export const InvalidateCacheTaskSchema = z.object({
  /**
   * The previous task value (optional)
   */
  oldValue: z.string().optional(),

  /**
   * The new task value (optional)
   */
  newValue: z.string().optional(),
});

/**
 * Zod schema for AI chat response processing
 * Validates the structure of AI responses for chat messages
 */
export const ChatProcessResultSchema = z.object({
  /**
   * The AI's response message to the user
   */
  response: z.string(),

  /**
   * Whether access should be granted based on the request
   */
  decision: z.enum(["GRANT", "DENY"]),

  /**
   * Duration in minutes if access is granted (optional)
   */
  durationMinutes: z.number().optional(),
});

/**
 * Zod schema for cache invalidation on always-remove change
 * Empty schema since no additional data is needed
 */
export const InvalidateCacheAlwaysRemoveSchema = z.object({});
