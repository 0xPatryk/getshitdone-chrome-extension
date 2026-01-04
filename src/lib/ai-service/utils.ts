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
let lastGoogleKey: string | null = null;

let openaiProvider: ReturnType<typeof createOpenAI> | null = null;
let lastOpenAIKey: string | null = null;

// Internal utility for testing
export const resetProviders = () => {
  googleProvider = null;
  lastGoogleKey = null;
  openaiProvider = null;
  lastOpenAIKey = null;
};

/**
 * Gets or creates a Google Generative AI provider instance.
 */
export const getGoogleProvider = (apiKey: string) => {
  if (!googleProvider || lastGoogleKey !== apiKey) {
    googleProvider = createGoogleGenerativeAI({ apiKey });
    lastGoogleKey = apiKey;
  }
  return googleProvider;
};

/**
 * Gets or creates an OpenAI provider instance.
 */
export const getOpenAIProvider = (apiKey: string) => {
  if (!openaiProvider || lastOpenAIKey !== apiKey) {
    openaiProvider = createOpenAI({ apiKey });
    lastOpenAIKey = apiKey;
  }
  return openaiProvider;
};

/**
 * Gets the appropriate AI model based on the specified provider.
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

/**
 * Extracts all text content from HTML using DOMParser.
 * Simple approach: parse HTML, remove scripts/styles, get body text.
 *
 * @param content - Raw HTML content
 * @returns Plain text content from the page body
 */
export const extractMainContent = (content: string): string => {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(content, "text/html");

    // Get text content from body only (excludes <head> automatically)
    const text = doc.body.textContent || "";

    // Normalize whitespace
    return text.replace(/\s+/g, " ").trim();
  } catch (error) {
    // Fallback to regex-based extraction
    return content
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gim, "")
      .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gim, "")
      .replace(/<[^>]*>/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }
};
