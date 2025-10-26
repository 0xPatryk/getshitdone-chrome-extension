/**
 * Analytics Module
 *
 * This module provides analytics tracking functionality using OpenPanel.
 * It automatically tracks user interactions, screen views, and other events
 * to help understand how users interact with the focus extension.
 *
 * Key features:
 * - Automatic screen view tracking
 * - Outgoing link monitoring
 * - Custom event tracking
 * - User attribute collection
 *
 * @module analytics
 */

import { OpenPanel } from "@openpanel/web";
import env from "../../env.config";

/**
 * OpenPanel analytics instance configured for the focus extension.
 *
 * This instance is configured to automatically track:
 * - Screen views when users navigate between different parts of the extension
 * - Outgoing links when users click external links
 * - User attributes for better segmentation
 *
 * The client ID is loaded from environment variables for security.
 *
 * @example
 * ```typescript
 * // Track a custom event
 * track("user_blocked_page", {
 *   url: "https://example.com",
 *   reason: "Social media distraction"
 * });
 * ```
 */
export const { track } = new OpenPanel({
  clientId: env.VITE_OPEN_PANEL_KEY,
  trackScreenViews: true,
  trackOutgoingLinks: true,
  trackAttributes: true,
});
