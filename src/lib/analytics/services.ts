/**
 * Analytics Services Module
 *
 * This module contains the main analytics tracking functionality using OpenPanel.
 * It automatically tracks user interactions, screen views, and other events
 * to help understand how users interact with the focus extension.
 *
 * @module analytics/services
 */

import { OpenPanel } from "@openpanel/web";
import env from "../../../env.config";
import type { AnalyticsOptions } from "./types";

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
export const analytics = new OpenPanel({
  clientId: env.VITE_OPEN_PANEL_KEY,
  trackScreenViews: true,
  trackOutgoingLinks: true,
  trackAttributes: true,
});

/**
 * Track a custom analytics event
 *
 * @param eventName - The name of the event to track
 * @param properties - Additional properties to include with the event
 *
 * @example
 * ```typescript
 * // Track a page block event
 * trackEvent("user_blocked_page", {
 *   url: "https://example.com",
 *   reason: "Social media distraction"
 * });
 *
 * // Track a timer completion event
 * trackEvent("focus_timer_completed", {
 *   duration: 25,
 *   task: "Complete project proposal"
 * });
 * ```
 */
export const trackEvent = analytics.track;

/**
 * Initialize analytics with custom options
 *
 * @param options - Analytics configuration options
 *
 * @example
 * ```typescript
 * // Initialize analytics with custom settings
 * initializeAnalytics({
 *   trackScreenViews: false,
 *   trackOutgoingLinks: true,
 *   trackAttributes: true
 * });
 * ```
 */
export const initializeAnalytics = (options: AnalyticsOptions = {}) => {
  // Create a new instance with custom options if needed
  if (Object.keys(options).length > 0) {
    return new OpenPanel({
      clientId: env.VITE_OPEN_PANEL_KEY,
      trackScreenViews: options.trackScreenViews ?? true,
      trackOutgoingLinks: options.trackOutgoingLinks ?? true,
      trackAttributes: options.trackAttributes ?? true,
    });
  }

  return analytics;
};
