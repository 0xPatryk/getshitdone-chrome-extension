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

// Export types
export type {
  AnalyticsEventProperties,
  UserAttributes,
  AnalyticsOptions,
} from "./types";

// Export services
export { analytics, trackEvent, initializeAnalytics } from "./services";

// Re-export the track function for backward compatibility
export { trackEvent as track } from "./services";
