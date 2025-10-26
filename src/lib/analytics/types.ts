/**
 * Analytics Types Module
 *
 * This module contains type definitions for analytics tracking functionality.
 *
 * @module analytics/types
 */

/**
 * Interface for analytics event properties
 */
export interface AnalyticsEventProperties {
  [key: string]: string | number | boolean | undefined;
}

/**
 * Interface for user attributes
 */
export interface UserAttributes {
  [key: string]: string | number | boolean | undefined;
}

/**
 * Analytics tracking options
 */
export interface AnalyticsOptions {
  /**
   * Whether to track screen views automatically
   */
  trackScreenViews?: boolean;

  /**
   * Whether to track outgoing links automatically
   */
  trackOutgoingLinks?: boolean;

  /**
   * Whether to track user attributes
   */
  trackAttributes?: boolean;
}
