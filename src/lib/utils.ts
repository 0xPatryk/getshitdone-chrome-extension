/**
 * Utility Functions Module
 *
 * This module provides common utility functions used throughout the focus extension.
 * Currently includes a utility function for combining CSS class names using clsx and tailwind-merge.
 *
 * Key features:
 * - CSS class name merging
 * - Tailwind CSS conflict resolution
 * - Reusable utility patterns
 *
 * @module utils
 */

import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combines CSS class names intelligently, merging Tailwind CSS classes properly.
 * Uses clsx for conditional class handling and tailwind-merge to resolve conflicts.
 *
 * This utility is commonly used in React components to apply conditional styling
 * while ensuring Tailwind CSS classes don't conflict with each other.
 *
 * @param inputs - Class values to combine (can be strings, objects, arrays, or conditional expressions)
 * @returns A merged string of CSS classes with conflicts resolved
 *
 * @example
 * ```typescript
 * // Basic usage
 * cn("px-4", "py-2", "bg-blue-500") // "px-4 py-2 bg-blue-500"
 *
 * // Conditional classes
 * cn("base-class", isActive && "active-class", isError && "error-class")
 * // "base-class active-class" when isActive is true
 *
 * // Conflict resolution (later classes win)
 * cn("px-4", "px-8") // "px-8" (px-8 overrides px-4)
 *
 * // With Tailwind variants
 * cn(
 *   "base-padding",
 *   size === "sm" && "px-2 py-1",
 *   size === "md" && "px-4 py-2",
 *   size === "lg" && "px-6 py-3"
 * )
 * ```
 *
 * @see {@link https://github.com/lukeed/clsx} for clsx documentation
 * @see {@link https://github.com/dcastil/tailwind-merge} for tailwind-merge documentation
 */
export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));
