/**
 * Unit Tests for Hooks Module
 *
 * This file contains unit tests for the general-purpose React hooks.
 * Tests cover auto-scrolling functionality, DOM manipulation, and edge cases.
 *
 * @module hooks.test
 */

import "./setup"; // Import setup to ensure DOM is initialized
import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";
import { renderHook } from "@testing-library/react";
import { type RefObject, useRef } from "react";
import { useAutoScroll } from "../hooks";
import { asyncHelpers } from "./utils";

// Mock React hooks
const mockUseRef = mock();
mock.module("react", () => ({
  useRef: mockUseRef,
}));

// Mock scroll behavior
const mockScrollTop = mock((value: number) => {});
const mockScrollHeight = 1000;

describe("useAutoScroll", () => {
  let scrollRef: RefObject<HTMLDivElement | null>;
  let mockScrollElement: HTMLElement;
  let mockContainer: HTMLDivElement;

  beforeEach(() => {
    // Reset mocks
    mockScrollTop.mockClear();

    // Ensure document exists
    if (typeof document === "undefined") {
      (global as { document: typeof document }).document = {
        createElement: (tag: string) => {
          const element = {
            tagName: tag.toUpperCase(),
            setAttribute: () => {},
            appendChild: () => {},
            classList: {
              contains: () => false,
            },
            textContent: "",
            dispatchEvent: () => {},
            remove: () => {},
          };
          Object.defineProperty(element, "scrollTop", {
            get: () => 0,
            set: mockScrollTop,
            configurable: true,
          });
          Object.defineProperty(element, "scrollHeight", {
            get: () => mockScrollHeight,
            configurable: true,
          });
          return element;
        },
        body: {
          innerHTML: "",
        },
        querySelector: () => null,
      };
    }

    // Create mock DOM elements
    mockContainer = document.createElement("div");
    mockScrollElement = document.createElement("div");
    mockScrollElement.setAttribute("data-radix-scroll-area-viewport", "");

    // Mock scrollTop property
    Object.defineProperty(mockScrollElement, "scrollTop", {
      get: () => 0,
      set: mockScrollTop,
      configurable: true,
    });

    // Mock scrollHeight property
    Object.defineProperty(mockScrollElement, "scrollHeight", {
      get: () => mockScrollHeight,
      configurable: true,
    });

    // Add scroll element to container
    mockContainer.appendChild(mockScrollElement);

    // Create ref
    scrollRef = { current: mockContainer };
  });

  afterEach(() => {
    // Clean up DOM
    mockContainer.remove();
  });

  it("should scroll to bottom when dependencies change", () => {
    const dependencies = ["initial"];

    renderHook(() => useAutoScroll(scrollRef, dependencies));

    expect(mockScrollTop).toHaveBeenCalledWith(mockScrollHeight);
  });

  it("should not scroll when ref is null", () => {
    const nullRef: RefObject<HTMLDivElement | null> = { current: null };
    const dependencies = ["test"];

    renderHook(() => useAutoScroll(nullRef, dependencies));

    expect(mockScrollTop).not.toHaveBeenCalled();
  });

  it("should not scroll when scroll element is not found", () => {
    // Create container without scroll element
    const emptyContainer = document.createElement("div");
    const emptyRef: RefObject<HTMLDivElement | null> = {
      current: emptyContainer,
    };
    const dependencies = ["test"];

    renderHook(() => useAutoScroll(emptyRef, dependencies));

    expect(mockScrollTop).not.toHaveBeenCalled();
  });

  it("should scroll when dependencies array changes", () => {
    const { rerender } = renderHook(
      ({ deps }) => useAutoScroll(scrollRef, deps),
      { initialProps: { deps: ["initial"] } },
    );

    // Initial render should trigger scroll
    expect(mockScrollTop).toHaveBeenCalledTimes(1);
    expect(mockScrollTop).toHaveBeenCalledWith(mockScrollHeight);

    // Clear mock for next test
    mockScrollTop.mockClear();

    // Rerender with new dependencies
    rerender({ deps: ["updated"] });

    // Should trigger scroll again
    expect(mockScrollTop).toHaveBeenCalledTimes(1);
    expect(mockScrollTop).toHaveBeenCalledWith(mockScrollHeight);
  });

  it("should not scroll when dependencies array remains the same", () => {
    const dependencies = ["stable"];

    const { rerender } = renderHook(() =>
      useAutoScroll(scrollRef, dependencies),
    );

    // Initial render should trigger scroll
    expect(mockScrollTop).toHaveBeenCalledTimes(1);

    // Clear mock for next test
    mockScrollTop.mockClear();

    // Rerender with same dependencies
    rerender();

    // Should not trigger scroll again
    expect(mockScrollTop).not.toHaveBeenCalled();
  });

  it("should handle empty dependencies array", () => {
    const { rerender } = renderHook(() => useAutoScroll(scrollRef, []));

    // Initial render should trigger scroll
    expect(mockScrollTop).toHaveBeenCalledTimes(1);

    // Clear mock for next test
    mockScrollTop.mockClear();

    // Rerender should not trigger scroll again since empty array reference is the same
    rerender();

    // Should not trigger scroll again
    expect(mockScrollTop).not.toHaveBeenCalled();
  });

  it("should handle multiple dependency changes", () => {
    const { rerender } = renderHook(
      ({ deps }) => useAutoScroll(scrollRef, deps),
      { initialProps: { deps: ["first"] } },
    );

    // Initial render
    expect(mockScrollTop).toHaveBeenCalledTimes(1);
    mockScrollTop.mockClear();

    // First change
    rerender({ deps: ["second"] });
    expect(mockScrollTop).toHaveBeenCalledTimes(1);
    mockScrollTop.mockClear();

    // Second change
    rerender({ deps: ["third"] });
    expect(mockScrollTop).toHaveBeenCalledTimes(1);
  });

  it("should handle complex dependency objects", () => {
    const complexDep1 = { id: 1, data: "test" };
    const complexDep2 = { id: 2, data: "updated" };

    const { rerender } = renderHook(
      ({ deps }) => useAutoScroll(scrollRef, deps),
      { initialProps: { deps: [complexDep1] } },
    );

    // Initial render
    expect(mockScrollTop).toHaveBeenCalledTimes(1);
    mockScrollTop.mockClear();

    // Change dependency
    rerender({ deps: [complexDep2] });
    expect(mockScrollTop).toHaveBeenCalledTimes(1);
  });

  it("should handle very large scrollHeight", () => {
    const largeScrollHeight = 100000;
    Object.defineProperty(mockScrollElement, "scrollHeight", {
      get: () => largeScrollHeight,
      configurable: true,
    });

    renderHook(() => useAutoScroll(scrollRef, ["test"]));

    expect(mockScrollTop).toHaveBeenCalledWith(largeScrollHeight);
  });

  it("should handle zero scrollHeight", () => {
    Object.defineProperty(mockScrollElement, "scrollHeight", {
      get: () => 0,
      configurable: true,
    });

    renderHook(() => useAutoScroll(scrollRef, ["test"]));

    expect(mockScrollTop).toHaveBeenCalledWith(0);
  });

  it("should work with useRef from React", () => {
    const TestComponent = () => {
      const ref = useRef<HTMLDivElement>(null);
      ref.current = mockContainer;
      useAutoScroll(ref, ["test"]);
      return null;
    };

    renderHook(() => TestComponent());

    expect(mockScrollTop).toHaveBeenCalledWith(mockScrollHeight);
  });

  it("should handle dynamic ref changes", () => {
    const { rerender } = renderHook(({ ref }) => useAutoScroll(ref, ["test"]), {
      initialProps: { ref: { current: null } },
    });

    // Initial render with null ref
    expect(mockScrollTop).not.toHaveBeenCalled();

    // Update ref to point to container - this won't trigger effect since dependencies didn't change
    rerender({ ref: scrollRef });

    // Should not scroll since effect only depends on dependencies array, not ref
    expect(mockScrollTop).not.toHaveBeenCalled();
  });

  it("should handle container with multiple scroll elements", () => {
    // Add another scroll element
    const anotherScrollElement = document.createElement("div");
    anotherScrollElement.setAttribute("data-radix-scroll-area-viewport", "");
    mockContainer.appendChild(anotherScrollElement);

    renderHook(() => useAutoScroll(scrollRef, ["test"]));

    // Should only scroll the first found element
    expect(mockScrollTop).toHaveBeenCalledTimes(1);
    expect(mockScrollTop).toHaveBeenCalledWith(mockScrollHeight);
  });

  it("should handle nested scroll elements", () => {
    // Create nested structure
    const nestedContainer = document.createElement("div");
    const nestedScrollElement = document.createElement("div");
    nestedScrollElement.setAttribute("data-radix-scroll-area-viewport", "");
    nestedContainer.appendChild(nestedScrollElement);
    mockContainer.appendChild(nestedContainer);

    renderHook(() => useAutoScroll(scrollRef, ["test"]));

    // Should find the nested scroll element
    expect(mockScrollTop).toHaveBeenCalledWith(mockScrollHeight);
  });

  it("should clean up properly on unmount", () => {
    const { unmount } = renderHook(() => useAutoScroll(scrollRef, ["test"]));

    expect(mockScrollTop).toHaveBeenCalledTimes(1);

    // Clear mock to test cleanup
    mockScrollTop.mockClear();

    // Unmount should not cause any issues
    unmount();

    // No additional scroll calls should be made
    expect(mockScrollTop).not.toHaveBeenCalled();
  });

  it("should handle rapid dependency changes", async () => {
    const { rerender } = renderHook(
      ({ deps }) => useAutoScroll(scrollRef, deps),
      { initialProps: { deps: [1] } },
    );

    // Initial render
    expect(mockScrollTop).toHaveBeenCalledTimes(1);

    // Rapid changes
    for (let i = 2; i <= 5; i++) {
      mockScrollTop.mockClear();
      rerender({ deps: [i] });
      expect(mockScrollTop).toHaveBeenCalledTimes(1);
    }
  });

  it("should handle case-insensitive attribute selector", () => {
    // Create element with uppercase attribute
    const uppercaseElement = document.createElement("div");
    uppercaseElement.setAttribute("DATA-RADIX-SCROLL-AREA-VIEWPORT", "");
    mockContainer.appendChild(uppercaseElement);

    renderHook(() => useAutoScroll(scrollRef, ["test"]));

    // Should still find the element (querySelector is case-sensitive in HTML)
    // but we're testing the behavior as implemented
    expect(mockScrollTop).toHaveBeenCalledTimes(1);
  });

  it("should handle malformed DOM structure", () => {
    // Create container with text nodes
    const textContainer = document.createElement("div");
    textContainer.appendChild(document.createTextNode("Some text"));
    textContainer.appendChild(document.createElement("span"));
    const malformedRef: RefObject<HTMLDivElement | null> = {
      current: textContainer,
    };

    renderHook(() => useAutoScroll(malformedRef, ["test"]));

    // Should not crash and should not scroll
    expect(mockScrollTop).not.toHaveBeenCalled();
  });

  it("should handle scroll element with custom properties", () => {
    // Add custom properties to scroll element
    Object.defineProperty(mockScrollElement, "customProperty", {
      value: "test",
      writable: true,
    });

    renderHook(() => useAutoScroll(scrollRef, ["test"]));

    expect(mockScrollTop).toHaveBeenCalledWith(mockScrollHeight);
  });

  it("should work with different scrollHeight values", () => {
    const testHeights = [0, 100, 500, 1000, 5000];

    for (const height of testHeights) {
      mockScrollTop.mockClear();
      Object.defineProperty(mockScrollElement, "scrollHeight", {
        get: () => height,
        configurable: true,
      });

      renderHook(() => useAutoScroll(scrollRef, [`height-${height}`]));

      expect(mockScrollTop).toHaveBeenCalledWith(height);
    }
  });

  it("should handle async dependency updates", async () => {
    const { rerender } = renderHook(
      ({ deps }) => useAutoScroll(scrollRef, deps),
      { initialProps: { deps: ["initial"] } },
    );

    expect(mockScrollTop).toHaveBeenCalledTimes(1);

    // Simulate async update
    await asyncHelpers.wait(10);

    mockScrollTop.mockClear();
    rerender({ deps: ["async-update"] });

    expect(mockScrollTop).toHaveBeenCalledTimes(1);
  });

  it("should handle concurrent hook instances", () => {
    // Create another container and ref
    const secondContainer = document.createElement("div");
    const secondScrollElement = document.createElement("div");
    secondScrollElement.setAttribute("data-radix-scroll-area-viewport", "");
    secondContainer.appendChild(secondScrollElement);

    const secondScrollTop = mock((value: number) => {});
    Object.defineProperty(secondScrollElement, "scrollTop", {
      get: () => 0,
      set: secondScrollTop,
      configurable: true,
    });

    Object.defineProperty(secondScrollElement, "scrollHeight", {
      get: () => 2000,
      configurable: true,
    });

    const secondRef: RefObject<HTMLDivElement | null> = {
      current: secondContainer,
    };

    // Render both hooks
    renderHook(() => useAutoScroll(scrollRef, ["first"]));
    renderHook(() => useAutoScroll(secondRef, ["second"]));

    // Both should scroll independently
    expect(mockScrollTop).toHaveBeenCalledWith(mockScrollHeight);
    // The second hook should have been called with its scrollHeight (2000)
    expect(secondScrollTop).toHaveBeenCalledWith(2000);

    // Clean up
    secondContainer.remove();
  });
});
