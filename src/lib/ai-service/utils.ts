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
 * Estimates token count from text or HTML content
 * Uses a conservative ratio of ~3.5 characters per token for HTML content
 * @param content - The content to estimate tokens for
 * @returns Estimated token count
 */
export const countTokens = (content: string): number => {
  if (!content) return 0;

  // For HTML content, use a more conservative ratio due to tags
  // Average token is ~4 characters for plain text, ~3 characters for HTML
  const hasHTMLTags = /<[^>]*>/g.test(content);
  const ratio = hasHTMLTags ? 3 : 4;

  return Math.ceil(content.length / ratio);
};

/**
 * Truncates content to fit within specified token limit
 * Tries to break at sentence boundaries or HTML tags to avoid breaking content
 * @param content - The content to truncate
 * @param maxTokens - Maximum allowed tokens
 * @returns Truncated content with "..." indicator if needed
 */
const truncateContent = (content: string, maxTokens: number): string => {
  const contentTokens = countTokens(content);

  if (contentTokens <= maxTokens) {
    return content;
  }

  // Calculate approximate character limit based on token ratio
  const hasHTMLTags = /<[^>]*>/g.test(content);
  const ratio = hasHTMLTags ? 3 : 4;
  const maxChars = maxTokens * ratio;

  const truncated = content.substring(0, maxChars);
  const lastSentence = truncated.lastIndexOf(". ");
  const lastTag = Math.max(
    truncated.lastIndexOf(">"),
    truncated.lastIndexOf("<"),
  );

  if (lastSentence > maxChars * 0.9) {
    const finalContent = truncated.substring(0, lastSentence + 1);
    console.log(
      `[AI Service] Content truncated from ${contentTokens} to ${countTokens(
        finalContent,
      )} tokens (at sentence boundary)`,
    );
    return finalContent;
  }

  console.log(
    `[AI Service] Content truncated from ${contentTokens} to ${countTokens(
      truncated,
    )} tokens (at character boundary)`,
  );
  return `${truncated}...`;
};

/**
 * Converts HTML content to plain text to reduce token count
 * @param htmlContent - The HTML content to convert
 * @returns Plain text representation of the content
 */
const convertToPlainText = (htmlContent: string): string => {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, "text/html");
    return doc.body.textContent || "";
  } catch (error) {
    // Fallback to basic HTML tag removal
    return htmlContent
      .replace(/<[^>]*>/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }
};

/**
 * Utility function to extract main content from a page using DOMParser
 * Preserves HTML structure and CSS classes/IDs but removes styling elements
 * Uses token counting to ensure content stays within AI provider limits
 * @param content - The raw HTML content
 * @param maxTokens - Optional maximum token limit (default: 800,000 tokens)
 * @returns Cleaned HTML content with scripts, styles, and non-content elements removed
 */
export const extractMainContent = (
  content: string,
  maxTokens = 800000,
): string => {
  try {
    // 1. Parse HTML string into a DOM
    const parser = new DOMParser();
    const doc = parser.parseFromString(content, "text/html");

    // 2. Remove unwanted elements and styling
    removeUnwantedElements(doc);
    removeStylingAttributes(doc);

    // 3. Get cleaned content and check token count
    const cleanedHTML = doc.body.innerHTML.trim();
    const initialTokenCount = countTokens(cleanedHTML);

    console.log(
      `[AI Service] Initial content token count: ${initialTokenCount}`,
    );

    // 4. If content is within token limit, return as-is
    if (initialTokenCount <= maxTokens) {
      console.log(
        `[AI Service] Content within token limit (${initialTokenCount}/${maxTokens})`,
      );
      return cleanedHTML;
    }

    // 5. For very large content (>1.5x limit), convert to plain text first
    if (initialTokenCount > maxTokens * 1.5) {
      console.log(
        `[AI Service] Content very large (${initialTokenCount} tokens), converting to plain text`,
      );
      const plainText = convertToPlainText(cleanedHTML);
      const plainTextTokens = countTokens(plainText);

      if (plainTextTokens <= maxTokens) {
        console.log(
          `[AI Service] Plain text within token limit (${plainTextTokens}/${maxTokens})`,
        );
        return plainText;
      }

      // Truncate plain text if still too large
      return truncateContent(plainText, maxTokens);
    }

    // 6. For moderately large content, truncate HTML directly
    console.log(
      `[AI Service] Content moderately large (${initialTokenCount} tokens), truncating HTML`,
    );
    return truncateContent(cleanedHTML, maxTokens);
  } catch (error) {
    // 7. Fallback to simple regex-based extraction with token counting
    console.log(
      `[AI Service] Error processing HTML, using fallback extraction: ${error}`,
    );
    const fallbackTokens = countTokens(content);

    if (fallbackTokens > maxTokens) {
      console.log(
        `[AI Service] Fallback content too large (${fallbackTokens} tokens), converting to plain text`,
      );
      const plainText = convertToPlainText(content);
      return truncateContent(plainText, maxTokens);
    }

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
