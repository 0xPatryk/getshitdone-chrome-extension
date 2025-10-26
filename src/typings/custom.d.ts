/**
 * Custom TypeScript declarations for the focus application.
 *
 * This file contains custom type declarations and module references that extend
 * TypeScript's understanding of external libraries and provide type safety for
 * specific functionality used throughout the application.
 */

/**
 * Reference to the vite-plugin-svgr client type definitions.
 *
 * This directive imports type definitions for the vite-plugin-svgr plugin,
 * which allows SVG files to be imported as React components. This enables
 * TypeScript to properly type-check SVG imports and provide IntelliSense
 * when using SVG files as React components.
 *
 * @example
 * ```typescript
 * import Logo from './assets/logo.svg?react';
 * // Logo is now properly typed as a React component
 *
 * function Header() {
 *   return <Logo width={100} height={50} />;
 * }
 * ```
 */
/// <reference types="vite-plugin-svgr/client" />