/**
 * Grants Types
 *
 * This module contains type definitions for the grants domain.
 * It includes the AccessGrant interface and related types.
 *
 * @module grants/types
 */

/**
 * Interface representing a temporary access grant for a specific URL.
 * Stores information about when access was granted and when it expires.
 *
 * @interface AccessGrant
 */
export interface AccessGrant {
  /**
   * The URL that access was granted for
   */
  url: string;

  /**
   * Unix timestamp when the grant expires (in milliseconds)
   */
  expiresAt: number;

  /**
   * Unix timestamp when the grant was issued (in milliseconds)
   */
  grantedAt: number;

  /**
   * Duration of the grant in minutes
   */
  durationMinutes: number;

  /**
   * The reason for the access grant (e.g., chat response)
   */
  reason?: string;
}
