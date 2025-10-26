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

import { defineExtensionMessaging } from "@webext-core/messaging";
import { z } from "zod";

/**
 * Message type constants for extension communication.
 * Each constant represents a specific type of message that can be sent
 * between different parts of the extension.
 *
 * @constant
 */
export const Message = {
  /**
   * Request to analyze page content for distraction detection
   */
  ANALYZE_PAGE: "analyzePage",
  
  /**
   * Notification of page analysis result to content script
   */
  BLOCK_RESULT: "blockResult",
  
  /**
   * Send a chat message to AI for processing
   */
  SEND_CHAT_MESSAGE: "sendChatMessage",
  
  /**
   * Response from AI containing chat message and access decision
   */
  CHAT_RESPONSE: "chatResponse",
  
  /**
   * Invalidate cache when user task changes
   */
  INVALIDATE_CACHE_TASK: "invalidateCacheTask",
  
  /**
   * Invalidate cache when always-remove settings change
   */
  INVALIDATE_CACHE_ALWAYS_REMOVE: "invalidateCacheAlwaysRemove",
} as const;

/**
 * Union type of all possible message types
 */
export type Message = (typeof Message)[keyof typeof Message];

// Zod schemas for type safety

/**
 * Zod schema for page analysis results
 * Validates the structure of AI analysis responses
 */
export const AnalysisResultSchema = z.object({
  /**
   * The decision about what to do with the page
   */
  decision: z.enum(["BLOCK_ALL", "REMOVE_ELEMENTS", "ALLOW"]),
  
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
 * Zod schema for access grants
 * Validates temporary access grant information
 */
export const AccessGrantSchema = z.object({
  /**
   * URL that access was granted for
   */
  url: z.string(),
  
  /**
   * Unix timestamp when the grant expires
   */
  expiresAt: z.number(),
  
  /**
   * Unix timestamp when the grant was issued
   */
  grantedAt: z.number(),
  
  /**
   * Duration of the grant in minutes
   */
  durationMinutes: z.number(),
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
 * Zod schema for cache invalidation on always-remove change
 * Empty schema since no additional data is needed
 */
export const InvalidateCacheAlwaysRemoveSchema = z.object({});

// Type inference from Zod schemas

/**
 * Type representing a page analysis result
 */
export type AnalysisResult = z.infer<typeof AnalysisResultSchema>;

/**
 * Type representing a chat message
 */
export type ChatMessage = z.infer<typeof ChatMessageSchema>;

/**
 * Type representing a chat session
 */
export type ChatSession = z.infer<typeof ChatSessionSchema>;

/**
 * Type representing a chat message request
 */
export type SendChatMessage = z.infer<typeof SendChatMessageSchema>;

/**
 * Type representing a chat response
 */
export type ChatResponse = z.infer<typeof ChatResponseSchema>;

/**
 * Type representing an access grant
 */
export type AccessGrant = z.infer<typeof AccessGrantSchema>;

/**
 * Type representing cache invalidation task data
 */
export type InvalidateCacheTask = z.infer<typeof InvalidateCacheTaskSchema>;

/**
 * Type representing cache invalidation always-remove data
 */
export type InvalidateCacheAlwaysRemove = z.infer<
  typeof InvalidateCacheAlwaysRemoveSchema
>;

/**
 * Interface defining the message types and their data structures
 * for type-safe extension messaging
 */
interface Messages {
  /**
   * Analyze page content request
   * @param data - Page analysis request data
   * @returns Analysis result from AI
   */
  [Message.ANALYZE_PAGE]: (data: {
    url: string;
    content: string;
    alwaysRemove?: string | null;
  }) => AnalysisResult;
  
  /**
   * Block result notification
   * @param data - Analysis result to apply blocking
   */
  [Message.BLOCK_RESULT]: (data: AnalysisResult) => void;
  
  /**
   * Send chat message request
   * @param data - Chat message to process
   * @returns AI response with access decision
   */
  [Message.SEND_CHAT_MESSAGE]: (data: SendChatMessage) => ChatResponse;
  
  /**
   * Chat response notification
   * @param data - Chat response to display
   */
  [Message.CHAT_RESPONSE]: (data: ChatResponse) => void;
  
  /**
   * Invalidate cache on task change
   * @param data - Task change information
   */
  [Message.INVALIDATE_CACHE_TASK]: (data: InvalidateCacheTask) => void;
  
  /**
   * Invalidate cache on always-remove change
   * @param data - Empty object for always-remove change
   */
  [Message.INVALIDATE_CACHE_ALWAYS_REMOVE]: (
    data: InvalidateCacheAlwaysRemove,
  ) => void;
}

/**
 * Type-safe messaging functions for the extension.
 * Provides sendMessage and onMessage functions with full type safety
 * and runtime validation.
 *
 * @example
 * ```typescript
 * // Send a message
 * const result = await sendMessage(Message.ANALYZE_PAGE, {
 *   url: "https://example.com",
 *   content: "Page content here",
 *   alwaysRemove: ".ads"
 * });
 *
 * // Listen for messages
 * onMessage(Message.ANALYZE_PAGE, async (data) => {
 *   // Process the analysis request
 *   return { decision: "ALLOW", reason: "Relevant content" };
 * });
 * ```
 */
export const { sendMessage, onMessage } = defineExtensionMessaging<Messages>();
