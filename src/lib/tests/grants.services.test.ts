/**
 * Tests for Grants Services
 *
 * This file contains unit tests for the grants module services.
 * It tests access grant management functions including creation,
 * validation, expiration, and cleanup.
 */

import { beforeEach, describe, expect, it, mock } from "bun:test";
import type { AccessGrant } from "~/lib/grants/types";
import { StorageKey } from "~/lib/storage/types";
import { storageHelpers } from "./utils";

// Mock the storage module
const mockGetValue = mock();
const mockSetValue = mock();

// Mock WXT storage
const mockBrowserStorage = {
  defineItem: (key: string, options: Record<string, unknown>) => ({
    getValue: mockGetValue,
    setValue: mockSetValue,
    watch: () => () => {}, // Return unwatch function
    removeValue: async () => {},
    fallback: options.fallback,
  }),
};

// Setup mocks for storage
beforeEach(() => {
  // Clear all mocks
  mock.restore();

  // Reset storage
  storageHelpers.clearStorage();

  // Mock storage operations
  mockGetValue.mockImplementation(async () => ({}));
  mockSetValue.mockImplementation(async () => {});

  // Mock the WXT imports
  mock.module("#imports", () => ({
    storage: mockBrowserStorage,
  }));

  // Mock the storage service
  const mockStorageService = {
    [StorageKey.ACCESS_GRANTS]: {
      getValue: mockGetValue,
      setValue: mockSetValue,
    },
    [StorageKey.CHAT_SESSIONS]: {
      getValue: mockGetValue,
      setValue: mockSetValue,
    },
  };

  // Mock the storage import
  mock.module("~/lib/storage/services", () => ({
    storage: mockStorageService,
  }));
});

describe("getActiveAccessGrant", () => {
  it("should return null when no grant exists for the URL", async () => {
    // Arrange
    mockGetValue.mockResolvedValue({});

    // Act
    const { getActiveAccessGrant } = await import("~/lib/grants/services");
    const result = await getActiveAccessGrant("https://example.com");

    // Assert
    expect(result).toBeNull();
    expect(mockGetValue).toHaveBeenCalled();
  });

  it("should return the active grant when it exists and is not expired", async () => {
    // Arrange
    const now = Date.now();
    const futureTime = now + 60 * 60 * 1000; // 1 hour from now
    const testGrant: AccessGrant = {
      url: "https://example.com",
      expiresAt: futureTime,
      grantedAt: now,
      durationMinutes: 60,
    };

    mockGetValue.mockResolvedValue({
      "https://example.com": testGrant,
    });

    // Act
    const { getActiveAccessGrant } = await import("~/lib/grants/services");
    const result = await getActiveAccessGrant("https://example.com");

    // Assert
    expect(result).toEqual(testGrant);
    expect(mockGetValue).toHaveBeenCalled();
  });

  it("should return null and remove expired grant", async () => {
    // Arrange
    const now = Date.now();
    const pastTime = now - 60 * 60 * 1000; // 1 hour ago
    const testGrant: AccessGrant = {
      url: "https://example.com",
      expiresAt: pastTime,
      grantedAt: now - 2 * 60 * 60 * 1000, // 2 hours ago
      durationMinutes: 60,
    };

    mockGetValue.mockResolvedValue({
      "https://example.com": testGrant,
    });

    // Act
    const { getActiveAccessGrant } = await import("~/lib/grants/services");
    const result = await getActiveAccessGrant("https://example.com");

    // Assert
    expect(result).toBeNull();
    expect(mockGetValue).toHaveBeenCalled();
    // Verify that setValue was called with the grants object without the expired grant
    expect(mockSetValue).toHaveBeenCalledWith({});
  });

  it("should handle storage errors gracefully", async () => {
    // Arrange
    const errorMessage = "Storage access failed";
    mockGetValue.mockRejectedValue(new Error(errorMessage));

    // Act
    const { getActiveAccessGrant } = await import("~/lib/grants/services");

    // Assert
    await expect(getActiveAccessGrant("https://example.com")).rejects.toThrow(
      errorMessage,
    );
  });
});

describe("setAccessGrant", () => {
  it("should set a new access grant in storage", async () => {
    // Arrange
    const now = Date.now();
    const futureTime = now + 60 * 60 * 1000; // 1 hour from now
    const testGrant: AccessGrant = {
      url: "https://example.com",
      expiresAt: futureTime,
      grantedAt: now,
      durationMinutes: 60,
    };

    const existingGrants = {
      "https://existing.com": {
        url: "https://existing.com",
        expiresAt: now + 30 * 60 * 1000,
        grantedAt: now - 10 * 60 * 1000,
        durationMinutes: 30,
      },
    };

    mockGetValue.mockResolvedValue(existingGrants);

    // Act
    const { setAccessGrant } = await import("~/lib/grants/services");
    await setAccessGrant(testGrant);

    // Assert
    expect(mockGetValue).toHaveBeenCalled();
    expect(mockSetValue).toHaveBeenCalledWith({
      ...existingGrants,
      "https://example.com": testGrant,
    });
  });

  it("should overwrite existing grant for the same URL", async () => {
    // Arrange
    const now = Date.now();
    const futureTime = now + 60 * 60 * 1000; // 1 hour from now
    const testGrant: AccessGrant = {
      url: "https://example.com",
      expiresAt: futureTime,
      grantedAt: now,
      durationMinutes: 60,
    };

    const existingGrants = {
      "https://example.com": {
        url: "https://example.com",
        expiresAt: now + 30 * 60 * 1000, // Earlier expiration
        grantedAt: now - 10 * 60 * 1000,
        durationMinutes: 30,
      },
    };

    mockGetValue.mockResolvedValue(existingGrants);

    // Act
    const { setAccessGrant } = await import("~/lib/grants/services");
    await setAccessGrant(testGrant);

    // Assert
    expect(mockGetValue).toHaveBeenCalled();
    expect(mockSetValue).toHaveBeenCalledWith({
      "https://example.com": testGrant,
    });
  });

  it("should handle empty storage gracefully", async () => {
    // Arrange
    const now = Date.now();
    const futureTime = now + 60 * 60 * 1000; // 1 hour from now
    const testGrant: AccessGrant = {
      url: "https://example.com",
      expiresAt: futureTime,
      grantedAt: now,
      durationMinutes: 60,
    };

    mockGetValue.mockResolvedValue({});

    // Act
    const { setAccessGrant } = await import("~/lib/grants/services");
    await setAccessGrant(testGrant);

    // Assert
    expect(mockGetValue).toHaveBeenCalled();
    expect(mockSetValue).toHaveBeenCalledWith({
      "https://example.com": testGrant,
    });
  });

  it("should handle storage errors gracefully", async () => {
    // Arrange
    const now = Date.now();
    const testGrant: AccessGrant = {
      url: "https://example.com",
      expiresAt: now + 60 * 60 * 1000,
      grantedAt: now,
      durationMinutes: 60,
    };

    const errorMessage = "Storage write failed";
    mockGetValue.mockRejectedValue(new Error(errorMessage));

    // Act
    const { setAccessGrant } = await import("~/lib/grants/services");

    // Assert
    await expect(setAccessGrant(testGrant)).rejects.toThrow(errorMessage);
  });
});

describe("removeAccessGrant", () => {
  it("should remove an existing access grant", async () => {
    // Arrange
    const now = Date.now();
    const existingGrants = {
      "https://example.com": {
        url: "https://example.com",
        expiresAt: now + 60 * 60 * 1000,
        grantedAt: now - 10 * 60 * 1000,
        durationMinutes: 60,
      },
      "https://another.com": {
        url: "https://another.com",
        expiresAt: now + 30 * 60 * 1000,
        grantedAt: now - 5 * 60 * 1000,
        durationMinutes: 30,
      },
    };

    mockGetValue.mockResolvedValue(existingGrants);

    // Act
    const { removeAccessGrant } = await import("~/lib/grants/services");
    await removeAccessGrant("https://example.com");

    // Assert
    expect(mockGetValue).toHaveBeenCalled();
    expect(mockSetValue).toHaveBeenCalledWith({
      "https://another.com": existingGrants["https://another.com"],
    });
  });

  it("should handle removal of non-existent grant gracefully", async () => {
    // Arrange
    const now = Date.now();
    const existingGrants = {
      "https://another.com": {
        url: "https://another.com",
        expiresAt: now + 30 * 60 * 1000,
        grantedAt: now - 5 * 60 * 1000,
        durationMinutes: 30,
      },
    };

    mockGetValue.mockResolvedValue(existingGrants);

    // Act
    const { removeAccessGrant } = await import("~/lib/grants/services");
    await removeAccessGrant("https://nonexistent.com");

    // Assert
    expect(mockGetValue).toHaveBeenCalled();
    expect(mockSetValue).toHaveBeenCalledWith(existingGrants);
  });

  it("should handle empty storage gracefully", async () => {
    // Arrange
    mockGetValue.mockResolvedValue({});

    // Act
    const { removeAccessGrant } = await import("~/lib/grants/services");
    await removeAccessGrant("https://example.com");

    // Assert
    expect(mockGetValue).toHaveBeenCalled();
    expect(mockSetValue).toHaveBeenCalledWith({});
  });

  it("should handle storage errors gracefully", async () => {
    // Arrange
    const errorMessage = "Storage access failed";
    mockGetValue.mockRejectedValue(new Error(errorMessage));

    // Act
    const { removeAccessGrant } = await import("~/lib/grants/services");

    // Assert
    await expect(removeAccessGrant("https://example.com")).rejects.toThrow(
      errorMessage,
    );
  });
});

describe("cleanupExpiredGrants", () => {
  it("should remove all expired grants and keep valid ones", async () => {
    // Arrange
    const now = Date.now();
    const pastTime = now - 60 * 60 * 1000; // 1 hour ago
    const futureTime = now + 60 * 60 * 1000; // 1 hour from now

    const grants = {
      "https://expired1.com": {
        url: "https://expired1.com",
        expiresAt: pastTime,
        grantedAt: now - 2 * 60 * 60 * 1000,
        durationMinutes: 60,
      },
      "https://valid.com": {
        url: "https://valid.com",
        expiresAt: futureTime,
        grantedAt: now - 10 * 60 * 1000,
        durationMinutes: 70,
      },
      "https://expired2.com": {
        url: "https://expired2.com",
        expiresAt: pastTime + 30 * 60 * 1000, // Still expired
        grantedAt: now - 90 * 60 * 1000,
        durationMinutes: 30,
      },
    };

    mockGetValue.mockResolvedValue(grants);

    // Act
    const { cleanupExpiredGrants } = await import("~/lib/grants/services");
    await cleanupExpiredGrants();

    // Assert
    expect(mockGetValue).toHaveBeenCalled();
    expect(mockSetValue).toHaveBeenCalledWith({
      "https://valid.com": grants["https://valid.com"],
    });
  });

  it("should handle empty storage gracefully", async () => {
    // Arrange
    mockGetValue.mockResolvedValue({});

    // Act
    const { cleanupExpiredGrants } = await import("~/lib/grants/services");
    await cleanupExpiredGrants();

    // Assert
    expect(mockGetValue).toHaveBeenCalled();
    expect(mockSetValue).toHaveBeenCalledWith({});
  });

  it("should handle all grants expired", async () => {
    // Arrange
    const now = Date.now();
    const pastTime = now - 60 * 60 * 1000; // 1 hour ago

    const grants = {
      "https://expired1.com": {
        url: "https://expired1.com",
        expiresAt: pastTime,
        grantedAt: now - 2 * 60 * 60 * 1000,
        durationMinutes: 60,
      },
      "https://expired2.com": {
        url: "https://expired2.com",
        expiresAt: pastTime + 30 * 60 * 1000,
        grantedAt: now - 90 * 60 * 1000,
        durationMinutes: 30,
      },
    };

    mockGetValue.mockResolvedValue(grants);

    // Act
    const { cleanupExpiredGrants } = await import("~/lib/grants/services");
    await cleanupExpiredGrants();

    // Assert
    expect(mockGetValue).toHaveBeenCalled();
    expect(mockSetValue).toHaveBeenCalledWith({});
  });

  it("should handle all grants valid", async () => {
    // Arrange
    const now = Date.now();
    const futureTime = now + 60 * 60 * 1000; // 1 hour from now

    const grants = {
      "https://valid1.com": {
        url: "https://valid1.com",
        expiresAt: futureTime,
        grantedAt: now - 10 * 60 * 1000,
        durationMinutes: 70,
      },
      "https://valid2.com": {
        url: "https://valid2.com",
        expiresAt: futureTime + 30 * 60 * 1000,
        grantedAt: now - 20 * 60 * 1000,
        durationMinutes: 90,
      },
    };

    mockGetValue.mockResolvedValue(grants);

    // Act
    const { cleanupExpiredGrants } = await import("~/lib/grants/services");
    await cleanupExpiredGrants();

    // Assert
    expect(mockGetValue).toHaveBeenCalled();
    expect(mockSetValue).toHaveBeenCalledWith(grants);
  });

  it("should handle storage errors gracefully", async () => {
    // Arrange
    const errorMessage = "Storage access failed";
    mockGetValue.mockRejectedValue(new Error(errorMessage));

    // Act
    const { cleanupExpiredGrants } = await import("~/lib/grants/services");

    // Assert
    await expect(cleanupExpiredGrants()).rejects.toThrow(errorMessage);
  });
});

describe("Edge Cases", () => {
  it("should handle grants with expiration time exactly equal to current time", async () => {
    // Arrange
    const now = Date.now();
    const testGrant: AccessGrant = {
      url: "https://example.com",
      expiresAt: now, // Expires exactly now
      grantedAt: now - 10 * 60 * 1000,
      durationMinutes: 10,
    };

    mockGetValue.mockResolvedValue({
      "https://example.com": testGrant,
    });

    // Act
    const { getActiveAccessGrant } = await import("~/lib/grants/services");
    const result = await getActiveAccessGrant("https://example.com");

    // Assert
    expect(result).toBeNull();
    // Verify that setValue was called with the grants object without the expired grant
    expect(mockSetValue).toHaveBeenCalledWith({});
  });

  it("should handle very large expiration times", async () => {
    // Arrange
    const now = Date.now();
    const veryFutureTime = now + 365 * 24 * 60 * 60 * 1000; // 1 year from now
    const testGrant: AccessGrant = {
      url: "https://example.com",
      expiresAt: veryFutureTime,
      grantedAt: now,
      durationMinutes: 525600, // 365 days in minutes
    };

    mockGetValue.mockResolvedValue({
      "https://example.com": testGrant,
    });

    // Act
    const { getActiveAccessGrant } = await import("~/lib/grants/services");
    const result = await getActiveAccessGrant("https://example.com");

    // Assert
    expect(result).toEqual(testGrant);
  });

  it("should handle negative expiration times", async () => {
    // Arrange
    const negativeTime = -1;
    const testGrant: AccessGrant = {
      url: "https://example.com",
      expiresAt: negativeTime,
      grantedAt: Date.now() - 10 * 60 * 1000,
      durationMinutes: 10,
    };

    mockGetValue.mockResolvedValue({
      "https://example.com": testGrant,
    });

    // Act
    const { getActiveAccessGrant } = await import("~/lib/grants/services");
    const result = await getActiveAccessGrant("https://example.com");

    // Assert
    expect(result).toBeNull();
    // Verify that setValue was called with the grants object without the expired grant
    expect(mockSetValue).toHaveBeenCalledWith({});
  });
});

describe("getAllActiveAccessGrants", () => {
  it("should return all active grants and filter out expired ones", async () => {
    // Arrange
    const now = Date.now();
    const pastTime = now - 60 * 60 * 1000; // 1 hour ago
    const futureTime = now + 60 * 60 * 1000; // 1 hour from now

    const grants = {
      "https://expired.com": {
        url: "https://expired.com",
        expiresAt: pastTime,
        grantedAt: now - 2 * 60 * 60 * 1000,
        durationMinutes: 60,
      },
      "https://active1.com": {
        url: "https://active1.com",
        expiresAt: futureTime,
        grantedAt: now - 30 * 60 * 1000,
        durationMinutes: 90,
      },
      "https://active2.com": {
        url: "https://active2.com",
        expiresAt: futureTime + 30 * 60 * 1000,
        grantedAt: now - 15 * 60 * 1000,
        durationMinutes: 120,
      },
    };

    mockGetValue.mockResolvedValue(grants);

    // Act
    const { getAllActiveAccessGrants } = await import("~/lib/grants/services");
    const result = await getAllActiveAccessGrants();

    // Assert
    expect(result).toEqual({
      "https://active1.com": grants["https://active1.com"],
      "https://active2.com": grants["https://active2.com"],
    });
    expect(mockGetValue).toHaveBeenCalled();
  });

  it("should return empty object when no grants exist", async () => {
    // Arrange
    mockGetValue.mockResolvedValue({});

    // Act
    const { getAllActiveAccessGrants } = await import("~/lib/grants/services");
    const result = await getAllActiveAccessGrants();

    // Assert
    expect(result).toEqual({});
    expect(mockGetValue).toHaveBeenCalled();
  });

  it("should handle storage errors gracefully", async () => {
    // Arrange
    const errorMessage = "Storage access failed";
    mockGetValue.mockRejectedValue(new Error(errorMessage));

    // Act
    const { getAllActiveAccessGrants } = await import("~/lib/grants/services");

    // Assert
    await expect(getAllActiveAccessGrants()).rejects.toThrow(errorMessage);
  });
});

describe("getChatContextForGrants", () => {
  it("should return chat sessions for grant URLs", async () => {
    // Arrange
    const grantUrls = ["https://example.com", "https://test.com"];
    const chatSessions = {
      "https://example.com": {
        id: "https://example.com",
        messages: [
          {
            id: "msg-1",
            content: "I need access to Angular docs for my frontend task",
            role: "user",
            timestamp: Date.now() - 10 * 60 * 1000,
          },
          {
            id: "msg-2",
            content: "Access granted for 30 minutes",
            role: "assistant",
            timestamp: Date.now() - 9 * 60 * 1000,
          },
        ],
        createdAt: Date.now() - 15 * 60 * 1000,
        status: "completed" as const,
      },
      "https://test.com": {
        id: "https://test.com",
        messages: [
          {
            id: "msg-3",
            content: "Need React documentation",
            role: "user",
            timestamp: Date.now() - 5 * 60 * 1000,
          },
        ],
        createdAt: Date.now() - 6 * 60 * 1000,
        status: "active" as const,
      },
      "https://other.com": {
        id: "https://other.com",
        messages: [],
        createdAt: Date.now() - 20 * 60 * 1000,
        status: "active" as const,
      },
    };

    mockGetValue.mockResolvedValue(chatSessions);

    // Act
    const { getChatContextForGrants } = await import("~/lib/grants/services");
    const result = await getChatContextForGrants(grantUrls);

    // Assert
    expect(result).toEqual({
      "https://example.com": chatSessions["https://example.com"],
      "https://test.com": chatSessions["https://test.com"],
    });
    expect(mockGetValue).toHaveBeenCalled();
  });

  it("should return empty object when no matching chat sessions", async () => {
    // Arrange
    const grantUrls = ["https://example.com"];
    const chatSessions = {
      "https://other.com": {
        id: "https://other.com",
        messages: [],
        createdAt: Date.now() - 20 * 60 * 1000,
        status: "active" as const,
      },
    };

    mockGetValue.mockResolvedValue(chatSessions);

    // Act
    const { getChatContextForGrants } = await import("~/lib/grants/services");
    const result = await getChatContextForGrants(grantUrls);

    // Assert
    expect(result).toEqual({});
    expect(mockGetValue).toHaveBeenCalled();
  });

  it("should handle empty grant URLs array", async () => {
    // Arrange
    const grantUrls: string[] = [];
    const chatSessions = {
      "https://example.com": {
        id: "https://example.com",
        messages: [],
        createdAt: Date.now() - 20 * 60 * 1000,
        status: "active" as const,
      },
    };

    mockGetValue.mockResolvedValue(chatSessions);

    // Act
    const { getChatContextForGrants } = await import("~/lib/grants/services");
    const result = await getChatContextForGrants(grantUrls);

    // Assert
    expect(result).toEqual({});
    expect(mockGetValue).toHaveBeenCalled();
  });

  it("should handle storage errors gracefully", async () => {
    // Arrange
    const grantUrls = ["https://example.com"];
    const errorMessage = "Storage access failed";
    mockGetValue.mockRejectedValue(new Error(errorMessage));

    // Act
    const { getChatContextForGrants } = await import("~/lib/grants/services");

    // Assert
    await expect(getChatContextForGrants(grantUrls)).rejects.toThrow(errorMessage);
  });
});
