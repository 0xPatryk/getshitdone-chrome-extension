/**
 * Messaging Services
 *
 * This module contains the main messaging functionality for the extension.
 * It provides type-safe messaging functions using @webext-core/messaging.
 *
 * @module messaging/services
 */

import { defineExtensionMessaging } from "@webext-core/messaging";
import type { Messages } from "./types";

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
