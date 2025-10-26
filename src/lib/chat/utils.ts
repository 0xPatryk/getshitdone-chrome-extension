/**
 * Chat Utils Module
 *
 * This module contains utility functions for the chat domain.
 * Includes helper functions for generating IDs, timestamps, and other chat-related utilities.
 *
 * @module chat/utils
 */

import type { ChatMessage } from "./types";

/**
 * Generates a unique session ID using timestamp
 * @returns A unique session ID string
 */
export const generateSessionId = (): string => {
  return `session_${Date.now()}`;
};

/**
 * Generates a unique message ID using timestamp and random string
 * @returns A unique message ID string
 */
export const generateMessageId = (): string => {
  return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Creates a new chat message object with generated ID and timestamp
 * @param message - The message content and role (without ID and timestamp)
 * @returns A complete ChatMessage object with generated ID and timestamp
 */
export const createChatMessage = (
  message: Omit<ChatMessage, "id" | "timestamp">,
): ChatMessage => {
  return {
    ...message,
    id: generateMessageId(),
    timestamp: Date.now(),
  };
};

/**
 * Gets the current Unix timestamp
 * @returns Current timestamp in milliseconds
 */
export const getCurrentTimestamp = (): number => {
  return Date.now();
};
