/**
 * AI Service Module
 *
 * This module provides AI-powered content analysis and chat functionality for the focus extension.
 * It integrates with Google Gemini and OpenAI providers to analyze web pages and manage user
 * requests for temporary access to blocked content.
 *
 * Key features:
 * - Page content analysis for distraction detection
 * - Chat-based access request processing
 * - Content extraction utilities
 * - Support for multiple AI providers
 *
 * @module ai-service
 */

// Export types
export type { AIProvider } from "./types";
export type { ExtractMainContentOptions } from "./utils";

// Export service functions
export {
  analyzePageContent,
  processChatMessage,
} from "./services";

// Export utility functions
export {
  getGoogleProvider,
  getOpenAIProvider,
  getModel,
  extractMainContent,
  extractCleanHtml,
} from "./utils";
