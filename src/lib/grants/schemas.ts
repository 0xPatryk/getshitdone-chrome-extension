/**
 * Grants Schemas
 *
 * This module contains Zod schemas for grants validation.
 * It includes the AccessGrantSchema for runtime validation.
 *
 * @module grants/schemas
 */

import { z } from "zod";

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
