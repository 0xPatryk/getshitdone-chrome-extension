import { beforeAll, describe, expect, it, mock } from "bun:test";

// Mock OpenPanel class before importing services
const mockTrack = mock();
mock.module("@openpanel/web", () => {
  return {
    OpenPanel: class MockOpenPanel {
      options;
      constructor(options: unknown) {
        this.options = options;
      }
      track = mockTrack;
    },
  };
});

describe("Analytics Services", () => {
  let services: typeof import("~/lib/analytics/services");

  beforeAll(async () => {
    services = await import("~/lib/analytics/services");
  });

  describe("analytics instance", () => {
    it("should be instantiated with default options", () => {
      const { analytics } = services;
      expect(analytics).toBeDefined();
      expect(
        (analytics as unknown as { options: unknown }).options,
      ).toBeDefined();
      expect(
        (analytics as unknown as { options: { trackScreenViews: boolean } })
          .options.trackScreenViews,
      ).toBe(true);
    });
  });

  describe("initializeAnalytics", () => {
    it("should return the default instance if no options provided", () => {
      const { analytics, initializeAnalytics } = services;
      const instance = initializeAnalytics();
      expect(instance).toBe(analytics);
    });

    it("should create a new instance with custom options", () => {
      const { analytics, initializeAnalytics } = services;
      const customInstance = initializeAnalytics({
        trackScreenViews: false,
      });
      expect(customInstance).not.toBe(analytics);
      expect(
        (
          customInstance as unknown as {
            options: { trackScreenViews: boolean };
          }
        ).options.trackScreenViews,
      ).toBe(false);
    });
  });

  describe("trackEvent", () => {
    it("should call the underlying track method", () => {
      const { trackEvent } = services;
      const eventName = "test_event";
      const props = { foo: "bar" };
      trackEvent(eventName, props);
      expect(mockTrack).toHaveBeenCalledWith(eventName, props);
    });
  });
});
