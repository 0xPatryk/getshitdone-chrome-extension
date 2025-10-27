/**
 * AI Service Utilities
 *
 * This module contains utility functions for AI providers, including
 * provider instantiation and model selection logic.
 *
 * @module ai-service/utils
 */

import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";
import type { AIProvider } from "./types";

// Singleton instances for AI providers to avoid repeated initialization
let googleProvider: ReturnType<typeof createGoogleGenerativeAI> | null = null;
let openaiProvider: ReturnType<typeof createOpenAI> | null = null;

/**
 * Gets or creates a Google Generative AI provider instance.
 * Implements singleton pattern to avoid multiple provider instances.
 *
 * @param apiKey - The API key for Google Generative AI
 * @returns A Google Generative AI provider instance
 *
 * @example
 * ```typescript
 * const provider = getGoogleProvider("your-api-key");
 * const model = provider("gemini-2.5-flash-lite");
 * ```
 */
export const getGoogleProvider = (apiKey: string) => {
  if (!googleProvider) {
    googleProvider = createGoogleGenerativeAI({ apiKey });
  }
  return googleProvider;
};

/**
 * Gets or creates an OpenAI provider instance.
 * Implements singleton pattern to avoid multiple provider instances.
 *
 * @param apiKey - The API key for OpenAI
 * @returns An OpenAI provider instance
 *
 * @example
 * ```typescript
 * const provider = getOpenAIProvider("your-api-key");
 * const model = provider("gpt-4o-mini");
 * ```
 */
export const getOpenAIProvider = (apiKey: string) => {
  if (!openaiProvider) {
    openaiProvider = createOpenAI({ apiKey });
  }
  return openaiProvider;
};

/**
 * Gets the appropriate AI model based on the specified provider.
 *
 * @param provider - The AI provider to use ("gemini" or "openai")
 * @param apiKey - The API key for the specified provider
 * @returns An AI model instance for the specified provider
 * @throws {Error} When an unsupported provider is specified
 *
 * @example
 * ```typescript
 * const model = getModel("gemini", "your-api-key");
 * // Returns a Gemini 2.5 Flash Lite model
 * ```
 */
export const getModel = (provider: AIProvider, apiKey: string) => {
  switch (provider) {
    case "gemini":
      return getGoogleProvider(apiKey)("gemini-2.5-flash-lite");
    case "openai":
      return getOpenAIProvider(apiKey)("gpt-4.1-nano");
    default:
      throw new Error(`Unsupported provider: ${provider}`);
  }
};
