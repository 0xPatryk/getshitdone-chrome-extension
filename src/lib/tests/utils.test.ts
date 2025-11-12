/**
 * Unit Tests for Utility Functions
 *
 * This file contains comprehensive unit tests for the utility functions
 * in the utils module, focusing on the `cn` function for CSS class name merging.
 *
 * @file utils.test.ts
 */

import { beforeEach, describe, expect, it } from "bun:test";
import { cn } from "~/lib/utils";

describe("Utils - cn function", () => {
  beforeEach(() => {
    // Reset any global state before each test
  });

  describe("Basic functionality", () => {
    it("should merge simple class names", () => {
      // Arrange
      const classes = ["px-4", "py-2", "bg-blue-500"];

      // Act
      const result = cn(...classes);

      // Assert
      expect(result).toBe("px-4 py-2 bg-blue-500");
    });

    it("should handle empty input", () => {
      // Act
      const result = cn();

      // Assert
      expect(result).toBe("");
    });

    it("should handle empty strings", () => {
      // Arrange
      const classes = ["px-4", "", "py-2"];

      // Act
      const result = cn(...classes);

      // Assert
      expect(result).toBe("px-4 py-2");
    });

    it("should handle single class name", () => {
      // Arrange
      const singleClass = "bg-red-500";

      // Act
      const result = cn(singleClass);

      // Assert
      expect(result).toBe("bg-red-500");
    });
  });

  describe("Conditional classes", () => {
    it("should include classes when condition is true", () => {
      // Arrange
      const isActive = true;
      const isError = false;

      // Act
      const result = cn(
        "base-class",
        isActive && "active-class",
        isError && "error-class",
      );

      // Assert
      expect(result).toBe("base-class active-class");
    });

    it("should exclude classes when condition is false", () => {
      // Arrange
      const isActive = false;
      const isError = false;

      // Act
      const result = cn(
        "base-class",
        isActive && "active-class",
        isError && "error-class",
      );

      // Assert
      expect(result).toBe("base-class");
    });

    it("should handle mixed truthy/falsy values", () => {
      // Arrange
      const zeroValue = 0;
      const emptyString = "";
      const nullValue: null = null;
      const undefinedValue: undefined = undefined;
      const truthyString = "truthy-string";

      const values = [
        "always-present",
        zeroValue && "zero-value", // falsy
        emptyString && "empty-string", // falsy
        nullValue && "null-value", // falsy
        undefinedValue && "undefined-value", // falsy
        truthyString && "conditional-class", // truthy
      ];

      // Act
      const result = cn(...values);

      // Assert
      expect(result).toBe("always-present conditional-class");
    });

    it("should handle number values (0 should be falsy)", () => {
      // Arrange
      const count = 0;

      // Act
      const result = cn("base", count && "has-count");

      // Assert
      expect(result).toBe("base");
    });
  });

  describe("Object-based classes", () => {
    it("should handle object with conditional classes", () => {
      // Arrange
      const classObj = {
        "bg-blue-500": true,
        "text-white": true,
        hidden: false,
        rounded: true,
      };

      // Act
      const result = cn(classObj);

      // Assert
      expect(result).toBe("bg-blue-500 text-white rounded");
    });

    it("should handle mixed input types", () => {
      // Arrange
      const isActive = true;

      // Act
      const result = cn(
        "base-class",
        {
          active: isActive,
          inactive: !isActive,
        },
        isActive && "extra-class",
      );

      // Assert
      expect(result).toBe("base-class active extra-class");
    });
  });

  describe("Array-based classes", () => {
    it("should handle nested arrays", () => {
      // Arrange
      const classArrays = [
        ["px-4", "py-2"],
        ["bg-blue-500", "text-white"],
      ];

      // Act
      const result = cn(...classArrays);

      // Assert
      expect(result).toBe("px-4 py-2 bg-blue-500 text-white");
    });

    it("should handle arrays with conditional elements", () => {
      // Arrange
      const isActive = true;
      const classArray = [
        "base",
        isActive && "active",
        !isActive && "inactive",
      ];

      // Act
      const result = cn(...classArray);

      // Assert
      expect(result).toBe("base active");
    });
  });

  describe("Tailwind CSS conflict resolution", () => {
    it("should resolve padding conflicts (later class wins)", () => {
      // Arrange
      const classes = ["px-4", "px-8"];

      // Act
      const result = cn(...classes);

      // Assert
      expect(result).toBe("px-8");
    });

    it("should resolve margin conflicts", () => {
      // Arrange
      const classes = ["m-4", "m-8"];

      // Act
      const result = cn(...classes);

      // Assert
      expect(result).toBe("m-8");
    });

    it("should resolve color conflicts", () => {
      // Arrange
      const classes = ["bg-red-500", "bg-blue-500"];

      // Act
      const result = cn(...classes);

      // Assert
      expect(result).toBe("bg-blue-500");
    });

    it("should resolve text size conflicts", () => {
      // Arrange
      const classes = ["text-sm", "text-lg"];

      // Act
      const result = cn(...classes);

      // Assert
      expect(result).toBe("text-lg");
    });

    it("should resolve display conflicts", () => {
      // Arrange
      const classes = ["block", "flex"];

      // Act
      const result = cn(...classes);

      // Assert
      expect(result).toBe("flex");
    });

    it("should handle multiple conflicts", () => {
      // Arrange
      const classes = [
        "px-4 py-2 bg-red-500 text-sm block",
        "px-8 py-4 bg-blue-500 text-lg flex",
      ];

      // Act
      const result = cn(...classes);

      // Assert
      expect(result).toBe("px-8 py-4 bg-blue-500 text-lg flex");
    });

    it("should preserve non-conflicting classes", () => {
      // Arrange
      const classes = [
        "px-4 py-2 bg-red-500 rounded shadow",
        "text-lg font-bold",
      ];

      // Act
      const result = cn(...classes);

      // Assert
      expect(result).toBe(
        "px-4 py-2 bg-red-500 rounded shadow text-lg font-bold",
      );
    });

    it("should handle responsive variants", () => {
      // Arrange
      const classes = ["px-4 md:px-8", "px-2 md:px-6"];

      // Act
      const result = cn(...classes);

      // Assert
      expect(result).toBe("px-2 md:px-6");
    });

    it("should handle state variants", () => {
      // Arrange
      const classes = [
        "bg-blue-500 hover:bg-blue-600",
        "bg-red-500 hover:bg-red-600",
      ];

      // Act
      const result = cn(...classes);

      // Assert
      expect(result).toBe("bg-red-500 hover:bg-red-600");
    });
  });

  describe("Edge cases", () => {
    it("should handle null and undefined values", () => {
      // Arrange
      const classes = ["px-4", null, undefined, "py-2"];

      // Act
      const result = cn(...classes);

      // Assert
      expect(result).toBe("px-4 py-2");
    });

    it("should handle duplicate classes", () => {
      // Arrange
      const classes = ["px-4", "px-4", "py-2"];

      // Act
      const result = cn(...classes);

      // Assert
      expect(result).toBe("px-4 py-2");
    });

    it("should handle classes with special characters", () => {
      // Arrange
      const classes = [
        "w-1/2",
        "bg-gradient-to-r",
        "from-blue-400",
        "to-purple-600",
      ];

      // Act
      const result = cn(...classes);

      // Assert
      expect(result).toBe("w-1/2 bg-gradient-to-r from-blue-400 to-purple-600");
    });

    it("should handle arbitrary values", () => {
      // Arrange
      const classes = ["w-[32rem]", "h-[calc(100vh-4rem)]"];

      // Act
      const result = cn(...classes);

      // Assert
      expect(result).toBe("w-[32rem] h-[calc(100vh-4rem)]");
    });

    it("should handle large number of classes", () => {
      // Arrange
      const manyClasses = Array.from({ length: 100 }, (_, i) => `class-${i}`);

      // Act
      const result = cn(...manyClasses);

      // Assert
      expect(result).toBe(manyClasses.join(" "));
    });

    it("should handle deeply nested structures", () => {
      // Arrange
      const nestedStructure = [
        "base",
        {
          "nested-1": true,
          "nested-2": {
            "deep-1": true,
            "deep-2": false,
          },
        },
        [["array-1", "array-2"], "string"],
      ];

      // Act
      const result = cn(...nestedStructure);

      // Assert
      expect(result).toBe("base nested-1 nested-2 array-1 array-2 string");
    });
  });

  describe("Performance considerations", () => {
    it("should handle large class lists efficiently", () => {
      // Arrange
      const largeClassList = Array.from(
        { length: 1000 },
        (_, i) => `class-${i}`,
      );

      // Act & Assert
      expect(() => {
        cn(...largeClassList);
      }).not.toThrow();
    });

    it("should handle complex conditional structures", () => {
      // Arrange
      const complexStructure = Array.from({ length: 100 }, (_, i) => ({
        [`class-${i}`]: i % 2 === 0,
        [`other-${i}`]: i % 3 === 0,
      }));

      // Act & Assert
      expect(() => {
        cn(...complexStructure);
      }).not.toThrow();
    });
  });

  describe("Integration with Tailwind CSS patterns", () => {
    it("should handle component variants pattern", () => {
      // Arrange
      const size = "md";
      const variant = "primary";

      // Act
      const result = cn(
        "base-component",
        size === "sm" ? "px-2 py-1 text-sm" : undefined,
        size === "md" ? "px-4 py-2 text-md" : undefined,
        size === "lg" ? "px-6 py-3 text-lg" : undefined,
        variant === "primary" ? "bg-blue-500 text-white" : undefined,
        variant === "secondary" ? "bg-gray-200 text-gray-800" : undefined,
      );

      // Assert
      expect(result).toBe(
        "base-component px-4 py-2 text-md bg-blue-500 text-white",
      );
    });

    it("should handle state-based styling", () => {
      // Arrange
      const isDisabled = false;
      const isLoading = true;
      const hasError = false;

      // Act
      const result = cn(
        "button-base",
        isDisabled && "opacity-50 cursor-not-allowed",
        isLoading && "animate-pulse",
        hasError && "border-red-500 bg-red-50",
      );

      // Assert
      expect(result).toBe("button-base animate-pulse");
    });

    it("should handle responsive design patterns", () => {
      // Arrange
      const isMobile = false;
      const isTablet = true;

      // Act
      const result = cn(
        "container",
        "mx-auto px-4",
        isMobile && "w-full",
        isTablet && "md:w-3/4 lg:w-2/3",
        !isMobile && !isTablet && "w-1/2",
      );

      // Assert
      expect(result).toBe("container mx-auto px-4 md:w-3/4 lg:w-2/3");
    });
  });

  describe("Error handling", () => {
    it("should handle invalid input gracefully", () => {
      // Arrange
      const invalidInputs = [123, {}, [], Symbol("test"), () => {}];

      // Act & Assert
      for (const input of invalidInputs) {
        expect(() => {
          cn(input);
        }).not.toThrow();
      }
    });

    it("should handle mixed valid and invalid inputs", () => {
      // Arrange
      const mixedInputs = [
        "valid-class",
        123,
        null,
        undefined,
        "another-valid-class",
        {},
        [],
      ];

      // Act
      const result = cn(...mixedInputs);

      // Assert
      expect(result).toBe("valid-class 123 another-valid-class");
    });
  });
});
