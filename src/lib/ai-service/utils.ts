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
import * as cheerio from "cheerio";
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
/**
 * Estimates the number of tokens in valid string content.
 * Simple heuristic: 4 chars/token for text, 3 chars/token for HTML.
 */
export const countTokens = (content: string | null | undefined): number => {
  if (!content) return 0;

  const isHtml = /<[^>]+>/g.test(content);
  const ratio = isHtml ? 3 : 4;

  return Math.ceil(content.length / ratio);
};

export const extractMainContent = (content: string, limit?: number): string => {
  let text = "";
  try {
    // Priority 1: Native DOMParser (Standard Browsers)
    if (typeof DOMParser !== "undefined") {
      const parser = new DOMParser();
      const doc = parser.parseFromString(content, "text/html");
      const bodyText = doc.body.textContent || "";
      text = bodyText.replace(/\s+/g, " ").trim();
    } else {
      // Priority 2: Throw error to trigger fallback if DOMParser missing
      throw new Error("DOMParser not available");
    }
  } catch (error) {
    try {
      // Fallback: Cheerio (for Dia Browser / Node / AI Service)
      const $ = cheerio.load(content);
      const docText = $("body").length ? $("body").text() : $.text();
      text = docText.replace(/\s+/g, " ").trim();
    } catch (cheerioError) {
      // Last Resort: Regex-based extraction
      text = content
        .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gim, "")
        .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gim, "")
        .replace(/<[^>]*>/g, "")
        .replace(/\s+/g, " ")
        .trim();
    }
  }

  // Apply token limit if specified
  if (limit && limit > 0) {
    const charsPerToken = 4;
    const maxChars = limit * charsPerToken;
    if (text.length > maxChars) {
      text = `${text.slice(0, maxChars).trim()}...`;
    }
  }

  return text;
};
