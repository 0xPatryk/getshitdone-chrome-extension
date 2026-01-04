import { beforeEach, describe, expect, it } from "bun:test";
import { fakeBrowser } from "wxt/testing/fake-browser";
import { storage } from "./services";
import { StorageKey } from "./types";
import { getStorage, getStorageValue, setStorageValue } from "./utils";

describe("Storage Utils", () => {
  beforeEach(() => {
    fakeBrowser.reset();
  });
  describe("getStorage", () => {
    it("should return the correct storage item for a given key", () => {
      const item = getStorage(StorageKey.EXTENSION_ENABLED, storage);
      expect(item).toBeDefined();
      expect(item.key).toBe(StorageKey.EXTENSION_ENABLED);
    });
  });

  describe("getStorageValue", () => {
    it("should return the default value if storage is empty", async () => {
      // Setup: Ensure value is cleared
      await storage[StorageKey.ACTIVE_CHAT_SESSION].removeValue();

      const value = await getStorageValue(
        StorageKey.ACTIVE_CHAT_SESSION,
        storage,
      );
      expect(value).toBe(null); // Fallback is null
    });

    it("should return the stored value if set", async () => {
      await storage[StorageKey.ACTIVE_CHAT_SESSION].setValue("test-session");
      const value = await getStorageValue(
        StorageKey.ACTIVE_CHAT_SESSION,
        storage,
      );
      expect(value).toBe("test-session");
    });
  });

  describe("setStorageValue", () => {
    it("should update the value in storage", async () => {
      await setStorageValue(StorageKey.EXTENSION_ENABLED, true, storage);
      const value = await storage[StorageKey.EXTENSION_ENABLED].getValue();
      expect(value).toBe(true);

      await setStorageValue(StorageKey.EXTENSION_ENABLED, false, storage);
      const newValue = await storage[StorageKey.EXTENSION_ENABLED].getValue();
      expect(newValue).toBe(false);
    });
  });
});
