/**
 * Grants Services
 *
 * This module contains grant management functions.
 * It provides functions for managing access grants.
 *
 * @module grants/services
 */

import { storage } from "~/lib/storage/services";
import { StorageKey } from "~/lib/storage/types";
import type { AccessGrant } from "./types";

/**
 * Gets the active access grant for a specific URL
 *
 * @param url - The URL to check for access grants
 * @returns The active access grant or null if none exists
 */
export const getActiveAccessGrant = async (
  url: string,
): Promise<AccessGrant | null> => {
  const grants = (await storage[StorageKey.ACCESS_GRANTS].getValue()) as Record<
    string,
    AccessGrant
  >;
  const grant = grants[url];

  if (!grant) {
    return null;
  }

  // Check if grant has expired
  if (Date.now() >= grant.expiresAt) {
    // Remove expired grant
    await removeAccessGrant(url);
    return null;
  }

  return grant;
};

/**
 * Sets an access grant for a specific URL
 *
 * @param grant - The access grant to set
 */
export const setAccessGrant = async (grant: AccessGrant): Promise<void> => {
  const grantsStorage = storage[StorageKey.ACCESS_GRANTS];
  const grants = (await grantsStorage.getValue()) as Record<
    string,
    AccessGrant
  >;
  await grantsStorage.setValue({
    ...grants,
    [grant.url]: grant,
  });
};

/**
 * Removes an access grant for a specific URL
 *
 * @param url - The URL to remove the access grant for
 */
export const removeAccessGrant = async (url: string): Promise<void> => {
  const grantsStorage = storage[StorageKey.ACCESS_GRANTS];
  const grants = (await grantsStorage.getValue()) as Record<
    string,
    AccessGrant
  >;
  const { [url]: _, ...remainingGrants } = grants;
  await grantsStorage.setValue(remainingGrants);
};

/**
 * Cleans up all expired access grants
 */
export const cleanupExpiredGrants = async (): Promise<void> => {
  const grantsStorage = storage[StorageKey.ACCESS_GRANTS];
  const grants = (await grantsStorage.getValue()) as Record<
    string,
    AccessGrant
  >;
  const now = Date.now();

  const validGrants = Object.entries(grants).reduce(
    (acc, [url, grant]) => {
      if (now < grant.expiresAt) {
        acc[url] = grant;
      }
      return acc;
    },
    {} as Record<string, AccessGrant>,
  );

  await grantsStorage.setValue(validGrants);
};
