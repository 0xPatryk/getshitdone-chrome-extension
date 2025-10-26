/**
 * Storage Utilities
 *
 * This module contains utility functions for storage operations.
 * It provides low-level storage access functions.
 *
 * @module storage/utils
 */

import type { WxtStorageItem } from "#imports";
import type { StorageKeyType } from "./types";

/**
 * Gets a storage item by key
 *
 * @param key - The storage key to retrieve
 * @returns The storage item
 */
export const getStorage = <K extends StorageKeyType>(
  key: K,
  storageConfig: Record<
    StorageKeyType,
    WxtStorageItem<unknown, Record<string, unknown>>
  >,
) => {
  return storageConfig[key];
};

/**
 * Gets the value of a storage item
 *
 * @param key - The storage key to retrieve
 * @param storageConfig - The storage configuration
 * @returns The storage value
 */
export const getStorageValue = async <K extends StorageKeyType>(
  key: K,
  storageConfig: Record<
    StorageKeyType,
    WxtStorageItem<unknown, Record<string, unknown>>
  >,
): Promise<unknown> => {
  const storageItem = storageConfig[key];
  if (!storageItem) {
    return undefined;
  }
  return await storageItem.getValue();
};

/**
 * Sets the value of a storage item
 *
 * @param key - The storage key to set
 * @param value - The value to set
 * @param storageConfig - The storage configuration
 */
export const setStorageValue = async <K extends StorageKeyType>(
  key: K,
  value: unknown,
  storageConfig: Record<
    StorageKeyType,
    WxtStorageItem<unknown, Record<string, unknown>>
  >,
): Promise<void> => {
  const storageItem = storageConfig[key] as WxtStorageItem<
    unknown,
    Record<string, unknown>
  >;
  await storageItem.setValue(value);
};
