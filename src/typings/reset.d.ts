/**
 * TypeScript reset declarations for the focus application.
 *
 * This file imports the @total-typescript/ts-reset library, which provides
 * improved type definitions for built-in JavaScript types and standard
 * library functions. These resets help catch common bugs and provide more
 * accurate type inference throughout the application.
 *
 * IMPORTANT: This file should only contain the import statement below.
 * Do not add any other lines of code to this file as it may interfere
 * with the ts-reset functionality.
 *
 * The ts-reset library provides the following improvements:
 * - More accurate array method return types
 * - Better type inference for Object.keys, Object.values, and Object.entries
 * - Improved JSON.parse types
 * - More precise Promise types
 * - Enhanced type guards and utility types
 *
 * @example
 * ```typescript
 * // Without ts-reset, Object.keys returns string[]
 * const obj = { a: 1, b: 2 };
 * const keys = Object.keys(obj); // string[]
 *
 * // With ts-reset, Object.keys returns (keyof typeof obj)[]
 * const keys = Object.keys(obj); // ("a" | "b")[]
 * ```
 */

// Do not add any other lines of code to this file!
import "@total-typescript/ts-reset";