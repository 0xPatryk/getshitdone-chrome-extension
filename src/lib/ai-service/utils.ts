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
/**
 * Removes unwanted elements from a DOM document
 * @param doc - The DOM document to clean
 */
const removeUnwantedElements = (doc: Document): void => {
  const unwantedSelectors = [
    "script",
    "style",
    "img",
    "svg",
    "video",
    "audio",
    "iframe",
    "embed",
    "object",
    "canvas",
    "picture",
    "source",
    "track",
    "map",
    "area",
    "link",
    "meta",
  ];

  const unwantedElements = doc.querySelectorAll(unwantedSelectors.join(","));
  for (const element of unwantedElements) {
    element.remove();
  }
};

/**
 * Removes styling attributes from all elements in a DOM document
 * @param doc - The DOM document to clean
 */
const removeStylingAttributes = (doc: Document): void => {
  const allElements = doc.querySelectorAll("*");
  for (const element of allElements) {
    if (element.hasAttribute("style")) {
      element.removeAttribute("style");
    }
  }
};

/**
 * Truncates content to fit within specified length limit
 * Tries to break at sentence boundaries or HTML tags to avoid breaking content
 * @param content - The content to truncate
 * @param maxLength - Maximum allowed length
 * @returns Truncated content with "..." indicator if needed
 */
const truncateContent = (content: string, maxLength: number): string => {
  if (content.length <= maxLength) {
    return content;
  }

  const truncated = content.substring(0, maxLength);
  const lastSentence = truncated.lastIndexOf(". ");
  const lastTag = Math.max(
    truncated.lastIndexOf(">"),
    truncated.lastIndexOf("<"),
  );

  if (lastSentence > maxLength * 0.9) {
    return truncated.substring(0, lastSentence + 1);
  }

  return `${truncated}...`;
};

/**
 * Utility function to extract main content from a page using DOMParser
 * Preserves HTML structure and CSS classes/IDs but removes styling elements
 * @param content - The raw HTML content
 * @param maxLength - Optional maximum character limit (default: 50000 for ~1M token context)
 * @returns Cleaned HTML content with scripts, styles, and non-content elements removed
 */
export const extractMainContent = (
  content: string,
  maxLength = 700000,
): string => {
  try {
    // 1. Parse HTML string into a DOM
    const parser = new DOMParser();
    const doc = parser.parseFromString(content, "text/html");

    // 2. Remove unwanted elements and styling
    removeUnwantedElements(doc);
    removeStylingAttributes(doc);

    // 3. Get cleaned content and apply length limit
    const cleanedHTML = doc.body.innerHTML.trim();
    return truncateContent(cleanedHTML, maxLength);
  } catch (error) {
    // 4. Fallback to simple regex-based extraction
    return content;
  }
};

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
