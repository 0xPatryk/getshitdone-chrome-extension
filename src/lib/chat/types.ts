/**
 * Chat Types Module
 *
 * This module contains type definitions for the chat domain.
 * Since ChatMessage and ChatSession are already defined in messaging.ts,
 * this file primarily re-exports those types for convenience.
 *
 * @module chat/types
 */

// Re-export chat-related types from messaging
export type { ChatMessage, ChatSession } from "~/lib/messaging";
