import { describe, expect, it } from "bun:test";
import { renderHook } from "@testing-library/react";
import { createRef } from "react";
import { useAutoScroll } from "./hooks";

describe("Hooks", () => {
  describe("useAutoScroll", () => {
    it("should scroll to bottom when dependencies change", () => {
      // Create mock DOM structure
      const container = document.createElement("div");
      const viewport = document.createElement("div");
      viewport.setAttribute("data-radix-scroll-area-viewport", "");

      // Mock scroll properties
      Object.defineProperty(viewport, "scrollHeight", {
        value: 1000,
        configurable: true,
      });
      Object.defineProperty(viewport, "scrollTop", {
        value: 0,
        writable: true,
      });

      container.appendChild(viewport);

      const scrollRef = createRef<HTMLDivElement>();
      // @ts-ignore - manually setting current for test
      scrollRef.current = container;

      // Initial render
      const { rerender } = renderHook(
        ({ deps }) => useAutoScroll(scrollRef, deps),
        { initialProps: { deps: [1] } },
      );

      // Verify scroll happened on mount/first effect
      expect(viewport.scrollTop).toBe(1000);

      // Reset scroll
      viewport.scrollTop = 0;

      // Update deps
      rerender({ deps: [2] });

      // Verify scrolled again
      expect(viewport.scrollTop).toBe(1000);
    });

    it("should do nothing if ref is null", () => {
      const scrollRef = createRef<HTMLDivElement>();

      renderHook(({ deps }) => useAutoScroll(scrollRef, deps), {
        initialProps: { deps: [1] },
      });

      // Should not throw
    });

    it("should do nothing if viewport element is missing", () => {
      const container = document.createElement("div");
      // No viewport child

      const scrollRef = createRef<HTMLDivElement>();
      // @ts-ignore
      scrollRef.current = container;

      renderHook(({ deps }) => useAutoScroll(scrollRef, deps), {
        initialProps: { deps: [1] },
      });

      // Should not throw
    });
  });
});
