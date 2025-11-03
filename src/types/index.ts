/**
 * Core type definitions for the focus application.
 *
 * This file contains fundamental type definitions used throughout the application,
 * including theme preferences and environment configurations. These types provide
 * type safety for application settings and ensure consistency across components.
 */

/**
 * Enumeration of available Node.js environment modes.
 *
 * This constant object defines the supported environment configurations
 * that the application can run in. These values are used to control
 * feature availability, logging levels, and other environment-specific
 * behaviors.
 */
export const NodeEnv = {
  /** Development environment with debugging features enabled */
  DEVELOPMENT: "development",
  /** Production environment with optimizations enabled */
  PRODUCTION: "production",
} as const;

/**
 * Union type representing all available environment modes.
 *
 * This type is derived from the NodeEnv constant object and represents
 * all possible environment values that the application can run in.
 * It provides type safety when working with environment-specific code.
 *
 * @example
 * ```typescript
 * function isProduction(env: NodeEnv): boolean {
 *   return env === NodeEnv.PRODUCTION;
 * }
 *
 * isProduction(NodeEnv.PRODUCTION); // Returns true
 * isProduction(NodeEnv.DEVELOPMENT); // Returns false
 * ```
 */
export type NodeEnv = (typeof NodeEnv)[keyof typeof NodeEnv];

/**
 * Union type representing all available environment modes.
 *
 * This type is derived from the NodeEnv constant object and represents
 * all possible environment values that the application can run in.
 * It provides type safety when working with environment-specific code.
 *
 * @example
 * ```typescript
 * function isProduction(env: NodeEnv): boolean {
 *   return env === NodeEnv.PRODUCTION;
 * }
 *
 * isProduction(NodeEnv.PRODUCTION); // Returns true
 * isProduction(NodeEnv.DEVELOPMENT); // Returns false
 * ```
 */
export type NodeEnv = (typeof NodeEnv)[keyof typeof NodeEnv];
