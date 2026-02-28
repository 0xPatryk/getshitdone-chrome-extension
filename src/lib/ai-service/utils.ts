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
 * Tags to remove when cleaning HTML for AI analysis.
 * These elements don't contribute to understanding page structure.
 */
const TAGS_TO_REMOVE = [
  "script",
  "style",
  "noscript",
  "iframe",
  "embed",
  "object",
  "applet",
  "link",
  "meta",
  "base",
  "template",
  "svg",
  "math",
  "canvas",
  "video",
  "audio",
  "source",
  "track",
  "img",
  "picture",
  "figure",
  "figcaption",
  "map",
  "area",
];

/**
 * Attributes to remove from all elements when cleaning HTML.
 * These attributes don't help with structural understanding.
 */
const ATTRIBUTES_TO_REMOVE = [
  "style",
  "onclick",
  "ondblclick",
  "onmousedown",
  "onmouseup",
  "onmouseover",
  "onmousemove",
  "onmouseout",
  "onkeydown",
  "onkeypress",
  "onkeyup",
  "onfocus",
  "onblur",
  "onchange",
  "onsubmit",
  "onreset",
  "onselect",
  "onload",
  "onunload",
  "onerror",
  "data-*", // data attributes
  "aria-hidden",
  "tabindex",
  "contenteditable",
  "draggable",
  "dropzone",
  "contextmenu",
  "spellcheck",
  "translate",
  "loading", // for images
  "decoding", // for images
  "crossorigin",
  "referrerpolicy",
  "ping",
  "rel",
  "target",
  "download",
  "media",
  "type",
  "sizes",
  "srcset",
  "datetime",
];

/**
 * Extracts clean HTML by removing scripts, styles, images, and other non-essential elements
 * while preserving the document structure (tags, classes, IDs) for AI analysis.
 *
 * This is useful when the AI needs to understand the HTML structure to generate CSS selectors.
 *
 * @param html - Raw HTML content
 * @returns Clean HTML with structure preserved but scripts/images removed
 */
export const extractCleanHtml = (html: string): string => {
  if (!html || typeof html !== "string") {
    return "";
  }

  try {
    // Use DOMParser if available
    if (typeof DOMParser !== "undefined") {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");

      // Remove unwanted tags
      for (const tag of TAGS_TO_REMOVE) {
        const elements = doc.querySelectorAll(tag);
        for (const el of elements) {
          el.remove();
        }
      }

      // Remove comments
      const walker = doc.createTreeWalker(doc, NodeFilter.SHOW_COMMENT, null);
      const comments: Comment[] = [];
      let comment: Comment | null = walker.nextNode() as Comment | null;
      while (comment) {
        comments.push(comment);
        comment = walker.nextNode() as Comment | null;
      }
      for (const c of comments) {
        c.remove();
      }

      // Clean attributes from all elements
      const allElements = doc.querySelectorAll("*");
      for (const el of allElements) {
        const attributes = Array.from(el.attributes);
        for (const attr of attributes) {
          const attrName = attr.name.toLowerCase();

          // Remove event handlers (on*)
          if (attrName.startsWith("on")) {
            el.removeAttribute(attr.name);
            continue;
          }

          // Remove data-* attributes
          if (attrName.startsWith("data-")) {
            el.removeAttribute(attr.name);
            continue;
          }

          // Remove specific attributes
          if (ATTRIBUTES_TO_REMOVE.includes(attrName)) {
            el.removeAttribute(attr.name);
          }
        }

        // Remove empty class attributes
        if (el.classList.length === 0) {
          el.removeAttribute("class");
        }

        // Remove empty id attributes
        if (el.id === "") {
          el.removeAttribute("id");
        }
      }

      // Get body content, or entire document if no body
      let result = "";
      if (doc.body) {
        // Serialize body children
        const serializer = new XMLSerializer();
        // Get inner HTML of body, or just the body's content
        result = doc.body.innerHTML || "";
      } else {
        // Fallback: return documentElement's innerHTML
        result = doc.documentElement?.innerHTML || html;
      }

      // Normalize whitespace in the HTML string
      return result
        .replace(/>\s+</g, "><") // Remove whitespace between tags
        .replace(/\s{2,}/g, " ") // Collapse multiple spaces
        .trim();
    }

    // Fallback: Use regex-based cleaning if DOMParser not available
    return cleanHtmlWithRegex(html);
  } catch (error) {
    console.warn(
      "Error cleaning HTML, falling back to text extraction:",
      error,
    );
    return cleanHtmlWithRegex(html);
  }
};

/**
 * Fallback HTML cleaning using regex when DOMParser is not available.
 * Less precise but doesn't require browser APIs.
 */
const cleanHtmlWithRegex = (html: string): string => {
  let cleaned = html;

  // Remove script tags and their content
  cleaned = cleaned.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gim, "");

  // Remove style tags and their content
  cleaned = cleaned.replace(/<style\b[^>]*>[\s\S]*?<\/style>/gim, "");

  // Remove noscript tags
  cleaned = cleaned.replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gim, "");

  // Remove iframe tags
  cleaned = cleaned.replace(/<iframe\b[^>]*>[\s\S]*?<\/iframe>/gim, "");

  // Remove self-closing tags for images, svg, etc.
  cleaned = cleaned.replace(
    /<(img|svg|canvas|video|audio|source|track|embed|object|link|meta|base|input|br|hr|wbr)[^>]*>/gim,
    "",
  );

  // Remove event handler attributes
  cleaned = cleaned.replace(/\s*on\w+=["'][^"']*["']/gim, "");

  // Remove style attributes
  cleaned = cleaned.replace(/\s*style=["'][^"']*["']/gim, "");

  // Remove data attributes
  cleaned = cleaned.replace(/\s*data-[\w-]+=["'][^"']*["']/gim, "");

  // Remove HTML comments
  cleaned = cleaned.replace(/<!--[\s\S]*?-->/g, "");

  // Normalize whitespace
  cleaned = cleaned
    .replace(/>\s+</g, "><")
    .replace(/\s{2,}/g, " ")
    .trim();

  return cleaned;
};

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

/**
 * Options for extracting main content from HTML.
 */
export interface ExtractMainContentOptions {
  /** Maximum number of tokens to return (approximate) */
  limit?: number;
  /**
   * When true, preserves HTML structure (tags, classes, IDs) instead of extracting plain text.
   * Useful when the AI needs to generate CSS selectors. Scripts, styles, images, and other
   * non-essential elements are still removed for token efficiency.
   */
  preserveHtml?: boolean;
}

/**
 * Extracts main content from HTML, either as plain text or clean HTML structure.
 *
 * When preserveHtml is false (default): Returns plain text content from the page body.
 * When preserveHtml is true: Returns clean HTML with structure preserved but scripts/images removed.
 *
 * @param content - Raw HTML content
 * @param options - Extraction options (limit, preserveHtml)
 * @returns Plain text or clean HTML depending on options
 */
export const extractMainContent = (
  content: string,
  options: ExtractMainContentOptions = {},
): string => {
  const { limit, preserveHtml = false } = options;

  let result = "";

  if (preserveHtml) {
    // Return clean HTML structure
    result = extractCleanHtml(content);
  } else {
    // Extract plain text
    try {
      // Priority 1: Native DOMParser (Standard Browsers)
      if (typeof DOMParser !== "undefined") {
        const parser = new DOMParser();
        const doc = parser.parseFromString(content, "text/html");
        const bodyText = doc.body.textContent || "";
        result = bodyText.replace(/\s+/g, " ").trim();
      } else {
        // Priority 2: Throw error to trigger fallback if DOMParser missing
        throw new Error("DOMParser not available");
      }
    } catch (error) {
      try {
        // Fallback: Cheerio (for Dia Browser / Node / AI Service)
        const $ = cheerio.load(content);
        const docText = $("body").length ? $("body").text() : $.text();
        result = docText.replace(/\s+/g, " ").trim();
      } catch (cheerioError) {
        // Last Resort: Regex-based extraction
        result = content
          .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gim, "")
          .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gim, "")
          .replace(/<[^>]*>/g, "")
          .replace(/\s+/g, " ")
          .trim();
      }
    }
  }

  // Apply token limit if specified
  if (limit && limit > 0) {
    const charsPerToken = preserveHtml ? 3 : 4; // HTML has more chars per token
    const maxChars = limit * charsPerToken;
    if (result.length > maxChars) {
      result = `${result.slice(0, maxChars).trim()}...`;
    }
  }

  return result;
};
