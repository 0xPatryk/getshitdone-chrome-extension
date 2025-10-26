/**
 * Main Library Index
 *
 * This file serves as the main entry point for all library modules.
 * It re-exports everything from all domain modules for convenient access.
 *
 * @module lib
 */

// Export all domains
export * from "./ai-service";
export * from "./analytics";
export * from "./cache";
export * from "./grants";
export * from "./storage";

// Export chat domain (excluding conflicting types)
export { useChatSession } from "./chat";

// Export messaging domain
export {
  Message,
  type AnalysisResult,
  type ChatResponse,
  type SendChatMessage,
  type InvalidateCacheTask,
  type InvalidateCacheAlwaysRemove,
  sendMessage,
  onMessage,
} from "./messaging";

// Export utility functions
export * from "./utils";
