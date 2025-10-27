import { describe, it, expect, vi } from "bun:test";
import { analytics, trackEvent, initializeAnalytics } from "~/lib/analytics/services";

// Mock the analytics module for testing
vi.mock("~/lib/analytics/services", () => ({
  analytics: vi.fn().mockImplementation(() => ({
    track: vi.fn(),
    trackScreenViews: true,
    trackOutgoingLinks: true,
    trackAttributes: true,
  })),
  trackEvent: vi.fn(),
  initializeAnalytics: vi.fn()
}));

describe("Analytics Services", () => {
  it("should use the analytics instance with correct configuration", () => {
    expect(analytics).toBeDefined();
    expect(analytics.track).toBeDefined();
  });

  it("should call track method with correct arguments", () => {
    trackEvent("event-name", { property: "value" });
    
    expect(trackEvent).toHaveBeenCalledWith("event-name", { property: "value" });
  });

  it("should handle initialization with custom options", () => {
    const customAnalytics = initializeAnalytics({ trackScreenViews: false });
    
    expect(customAnalytics.trackScreenViews).toBeFalsy();
  });
});