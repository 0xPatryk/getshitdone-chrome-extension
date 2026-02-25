import { describe, expect, it } from "bun:test";
import { cn } from "~/lib/utils";

describe("Utils", () => {
  describe("cn", () => {
    it("should merge class names", () => {
      expect(cn("foo", "bar")).toBe("foo bar");
    });

    it("should handle conditional classes", () => {
      expect(cn("foo", true && "bar", false && "baz")).toBe("foo bar");
    });

    it("should handle arrays of classes", () => {
      expect(cn("foo", ["bar", "baz"])).toBe("foo bar baz");
    });

    it("should resolve tailwind conflicts", () => {
      expect(cn("p-4", "p-8")).toBe("p-8");
      expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500");
    });

    it("should handle objects with boolean values", () => {
      expect(cn({ foo: true, bar: false, baz: true })).toBe("foo baz");
    });

    it("should handle mixed inputs", () => {
      expect(
        cn("p-4", { "text-center": true, hidden: false }, ["text-red-500"]),
      ).toBe("p-4 text-center text-red-500");
    });
  });
});
