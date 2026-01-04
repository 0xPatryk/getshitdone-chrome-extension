import { beforeEach, describe, expect, it } from "bun:test";
import { fakeBrowser } from "wxt/testing/fake-browser";
import {
  cleanupExpiredGrants,
  getActiveAccessGrant,
  getAllActiveAccessGrants,
  removeAccessGrant,
  setAccessGrant,
} from "~/lib/grants/services";
import type { AccessGrant } from "~/lib/grants/types";
import { storage } from "~/lib/storage/services";
import { StorageKey } from "~/lib/storage/types";

const mockGrant: AccessGrant = {
  url: "https://example.com/blocked",
  expiresAt: Date.now() + 60000, // Expires in 60s
  grantedAt: Date.now(),
  durationMinutes: 1,
  reason: "Testing access grant",
};

describe("Grants Services", () => {
  beforeEach(async () => {
    fakeBrowser.reset();
    // Clear grants before each test
    await storage[StorageKey.ACCESS_GRANTS].removeValue();
  });

  describe("setAccessGrant", () => {
    it("should store a grant in storage", async () => {
      await setAccessGrant(mockGrant);
      const stored = (await storage[
        StorageKey.ACCESS_GRANTS
      ].getValue()) as Record<string, AccessGrant>;
      expect(stored[mockGrant.url]).toEqual(mockGrant);
    });
  });

  describe("getActiveAccessGrant", () => {
    it("should return null if no grant exists", async () => {
      const grant = await getActiveAccessGrant("https://example.com/other");
      expect(grant).toBeNull();
    });

    it("should return the grant if it is valid", async () => {
      await setAccessGrant(mockGrant);
      const grant = await getActiveAccessGrant(mockGrant.url);
      expect(grant).toEqual(mockGrant);
    });

    it("should return null and remove grant if expired", async () => {
      const expiredGrant: AccessGrant = {
        ...mockGrant,
        expiresAt: Date.now() - 1000, // Expired 1s ago
      };
      await setAccessGrant(expiredGrant);

      const grant = await getActiveAccessGrant(expiredGrant.url);
      expect(grant).toBeNull();

      // Check if removed from storage
      const stored = (await storage[
        StorageKey.ACCESS_GRANTS
      ].getValue()) as Record<string, AccessGrant>;
      expect(stored[expiredGrant.url]).toBeUndefined();
    });
  });

  describe("removeAccessGrant", () => {
    it("should remove the grant for a specific URL", async () => {
      await setAccessGrant(mockGrant);
      await removeAccessGrant(mockGrant.url);

      const stored = (await storage[
        StorageKey.ACCESS_GRANTS
      ].getValue()) as Record<string, AccessGrant>;
      expect(stored[mockGrant.url]).toBeUndefined();
    });
  });

  describe("cleanupExpiredGrants", () => {
    it("should remove only expired grants", async () => {
      const validGrant: AccessGrant = {
        url: "https://valid.com",
        expiresAt: Date.now() + 10000,
        grantedAt: Date.now(),
        durationMinutes: 1,
      };
      const expiredGrant: AccessGrant = {
        url: "https://expired.com",
        expiresAt: Date.now() - 1000,
        grantedAt: Date.now(),
        durationMinutes: 1,
      };

      await setAccessGrant(validGrant);
      await setAccessGrant(expiredGrant);

      await cleanupExpiredGrants();

      const stored = (await storage[
        StorageKey.ACCESS_GRANTS
      ].getValue()) as Record<string, AccessGrant>;
      expect(stored[validGrant.url]).toEqual(validGrant);
      expect(stored[expiredGrant.url]).toBeUndefined();
    });
  });

  describe("getAllActiveAccessGrants", () => {
    it("should return only active grants", async () => {
      const validGrant: AccessGrant = {
        url: "https://valid.com",
        expiresAt: Date.now() + 10000,
        grantedAt: Date.now(),
        durationMinutes: 1,
      };
      const expiredGrant: AccessGrant = {
        url: "https://expired.com",
        expiresAt: Date.now() - 1000,
        grantedAt: Date.now(),
        durationMinutes: 1,
      };

      await setAccessGrant(validGrant);
      await setAccessGrant(expiredGrant);

      const activeGrants = await getAllActiveAccessGrants();

      expect(activeGrants[validGrant.url]).toEqual(validGrant);
      expect(activeGrants[expiredGrant.url]).toBeUndefined();
    });
  });
});
