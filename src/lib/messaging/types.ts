/**
 * Messaging Types
 *
 * This module contains all type definitions for the messaging domain.
 * It includes message constants, type definitions, and interfaces
 * for type-safe communication between extension components.
 *
 * @module messaging/types
 */

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

/**
 * Type representing a page analysis result
 */
export type AnalysisResult = {
  /**
   * The decision about what to do with the page
   */
  decision: "BLOCK_ALL" | "ALLOW";

  /**
   * Explanation for the decision
   */
  reason: string;

  /**
   * CSS selectors for elements to remove (if applicable)
   */
  selectors?: string[];
};

/**
 * Type representing a chat message
 */
export type ChatMessage = {
  /**
   * Unique identifier for the message
   */
  id: string;

  /**
   * The text content of the message
   */
  content: string;

  /**
   * The role of the message sender
   */
  role: "user" | "assistant";

  /**
   * Unix timestamp when the message was created
   */
  timestamp: number;
};

/**
 * Type representing a chat session
 */
export type ChatSession = {
  /**
   * Unique identifier for the session
   */
  id: string;

  /**
   * Array of messages in the session
   */
  messages: ChatMessage[];

  /**
   * Unix timestamp when the session was created
   */
  createdAt: number;

  /**
   * Current status of the session
   */
  status: "active" | "completed";
};

/**
 * Type representing a chat message request
 */
export type SendChatMessage = {
  /**
   * ID of the session to send the message to
   */
  sessionId: string;

  /**
   * The message content to send
   */
  message: string;
};

/**
 * Type representing a chat response
 */
export type ChatResponse = {
  /**
   * ID of the session the response belongs to
   */
  sessionId: string;

  /**
   * The AI's response message
   */
  message: ChatMessage;

  /**
   * Whether access was granted (optional)
   */
  accessGranted?: boolean;

  /**
   * Duration of granted access in minutes (optional)
   */
  durationMinutes?: number;
};

/**
 * Type representing cache invalidation task data
 */
export type InvalidateCacheTask = {
  /**
   * The previous task value (optional)
   */
  oldValue?: string;

  /**
   * The new task value (optional)
   */
  newValue?: string;
};

/**
 * Type representing cache invalidation always-remove data
 */
export type InvalidateCacheAlwaysRemove = Record<string, never>;

/**
 * Interface defining the message types and their data structures
 * for type-safe extension messaging
 */
export interface Messages {
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
