/**
 * AI Service Functions
 *
 * This module contains the main AI service functions for content analysis
 * and chat functionality.
 *
 * @module ai-service/services
 */

import { generateObject } from "ai";
import {
  type AnalysisResult,
  AnalysisResultSchema,
  type ChatMessage,
  ChatProcessResultSchema,
} from "~/lib/messaging";
import type { AIProvider } from "./types";
import { getModel } from "./utils";
/**
 * Analyzes if a web page is relevant to the user's current task or a distraction.
 * Blocks fake productivity (work-adjacent but irrelevant content) and entertainment.
 *
 * @param apiKey - AI provider API key
 * @param userTask - User's current specific task
 * @param pageContent - Web page HTML content
 * @param url - Page URL
 * @param provider - AI provider (default: "gemini")
 * @param alwaysRemove - CSS selectors to always remove
 * @returns Decision: BLOCK_ALL, REMOVE_ELEMENTS, or ALLOW
 */
export const analyzePageContent = async (
  apiKey: string,
  userTask: string,
  pageContent: string,
  url: string,
  provider: AIProvider = "gemini",
  alwaysRemove?: string | null,
): Promise<AnalysisResult> => {
  const model = getModel(provider, apiKey);

  const alwaysRemoveNote = alwaysRemove
    ? `\nALWAYS REMOVE: "${alwaysRemove}" (include in selectors if present)`
    : "";

  const systemPrompt = `You are a strict Focus Assistant. Determine if a page is DIRECTLY relevant to the user's specific task or netural pages.

INSTANT ALLOW (skip analysis on this kind of pages):
- Login/auth/CAPTCHA/verification pages or important pages that are netural
- Billing/account/security/consent pages

DECISION RULES:
1. ALLOW: Page directly helps complete the exact stated task
  Other examples: Login/auth/CAPTCHA/verification pages
  Other examples: Billing/account/security/consent pages
2. BLOCK_ALL: Everything else, including:
   - Fake productivity: Work content unrelated to current task
   - Adjacent topics not needed for this task
   - Entertainment, social media, news, forums (unless task-specific)
   - General learning not applicable to current task
   
DEFAULT: When uncertain → BLOCK_ALL

FAKE PRODUCTIVITY EXAMPLES:
- Task: "Build React form" | Page: "Database scaling patterns" → BLOCK_ALL
- Task: "Fix CSS bug" | Page: "Advanced TypeScript types" → BLOCK_ALL
- Task: "Research Product X pricing" | Page: "General startup advice" → BLOCK_ALL

ALLOW EXAMPLES:
- Task: "Debug React hook error" | Page: "React hooks documentation" → ALLOW
- Task: "Research Product X" | Page: "Product X pricing page" → ALLOW

If page has relevant content + distractions → REMOVE_ELEMENTS with specific selectors.

Return JSON:
{
  "decision": "ALLOW" | "BLOCK_ALL" | "REMOVE_ELEMENTS",
  "reason": "One sentence explanation",
  "selectors": ["css.selector", "#someId"] // only for REMOVE_ELEMENTS
}

Be strict. If reasoning indicates distraction/irrelevance → MUST return BLOCK_ALL.`;

  const prompt = `${alwaysRemoveNote}

Task: ${userTask}
URL: ${url}
Content:
\`\`\`html
${pageContent}
\`\`\``;

  try {
    const { object } = await generateObject({
      model,
      schema: AnalysisResultSchema,
      prompt,
      system: systemPrompt,
      temperature: 0.3,
      mode: "json",
    });

    return object;
  } catch (error: unknown) {
    return {
      decision: "ALLOW",
      reason: `Analysis failed: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
};

/**
 * Processes user requests to access blocked content. AI evaluates if the request
 * aligns with the current task and grants/denies access with time limits.
 *
 * @param apiKey - AI provider API key
 * @param userTask - User's current specific task
 * @param message - User's access request message
 * @param chatHistory - Previous chat messages for context
 * @param provider - AI provider (default: "gemini")
 * @returns Response with access decision and optional duration
 */
export const processChatMessage = async (
  apiKey: string,
  userTask: string,
  message: string,
  chatHistory: ChatMessage[],
  provider: AIProvider = "gemini",
): Promise<{
  message: ChatMessage;
  accessGranted: boolean;
  durationMinutes?: number;
}> => {
  const model = getModel(provider, apiKey);

  const historyContext = chatHistory
    .map((msg) => `${msg.role}: ${msg.content}`)
    .join("\n");

  const systemPrompt = `You're a Focus Assistant that critically evaluates access requests to blocked content.

CORE PRINCIPLE: Deny fake productivity and distractions. Only grant access with strong task alignment.

GRANT CONDITIONS (with strict time limits):
- Direct task relevance: Directly needed for current task (15-45min max)
- Essential tools: Authentication, critical APIs, blocked tools (10-30min)
- Health breaks: Physical/mental health needs (5-15min max)

DENY CONDITIONS:
- Fake productivity: Work-related but irrelevant to current task
- Distractions: Entertainment, social media, news, gaming
- Vague justifications: "Might help", "just in case", "research" without specifics
- Excessive durations: Requests over 60 minutes
- Repeated denials: Same request denied before

CRITICAL EVALUATION:
- Challenge vague requests: Require specific task connection
- Question timing: Why needed NOW for THIS task?
- Detect rationalization: Users justifying distractions as "research"
- Be skeptical: Default to DENY unless clear necessity

Return JSON:
{
  "response": "Your conversational response (supportive but firm)",
  "decision": "GRANT" | "DENY",
  "durationMinutes": number (only if GRANT, max 60)
}

EXAMPLES:
Task: "Build React app" | Request: "Check Reddit for inspiration" → DENY (distraction disguised as research)
Task: "Debug Python" | Request: "Stack Overflow 20min" → GRANT 20min (directly relevant)
Task: "Write report" | Request: "YouTube tutorial on productivity" → DENY (fake productivity)
Task: "Code frontend" | Request: "5min walk" → GRANT 5min (health break)`;

  const prompt = `User Task: ${userTask}

Previous Conversation:
${historyContext}

User's Request:
${message}

Critically evaluate if this request is necessary for the SPECIFIC task or a rationalized distraction.`;

  try {
    const { object } = await generateObject({
      model,
      schema: ChatProcessResultSchema,
      prompt,
      temperature: 0.7,
      mode: "json",
      system: systemPrompt,
    });

    const accessGranted = object.decision === "GRANT";

    return {
      message: {
        id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        content: object.response,
        role: "assistant",
        timestamp: Date.now(),
      },
      accessGranted,
      durationMinutes: object.durationMinutes,
    };
  } catch (error: unknown) {
    return {
      message: {
        id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        content: "Unable to process request. Please try again.",
        role: "assistant",
        timestamp: Date.now(),
      },
      accessGranted: false,
    };
  }
};

/**
 * Utility function to extract main text content from a page
 * @param content - The raw HTML content
 * @returns Cleaned text content with scripts, styles, and tags removed
 */
export const extractMainContent = (content: string): string => {
  return (
    content
      // Remove head section (contains meta tags, title, styles, scripts, etc.)
      .replace(/<head\b[^>]*>[\s\S]*?<\/head>/gi, "")
      // Handle malformed head tags - remove any remaining head content up to body tag
      .replace(/<head\b[^>]*>[\s\S]*?(?=<body)/gi, "")
      // Remove script tags and their content
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
      // Remove style tags and their content
      .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "")
      // Remove comments
      .replace(/<!--[\s\S]*?-->/g, "")
      // Remove CDATA sections
      .replace(/<!\[CDATA\[[\s\S]*?\]\]>/g, "")
      // Remove inline style attributes
      .replace(/\s+style\s*=\s*(['"])[\s\S]*?\1/gi, "")
      // Remove common non-content elements (nav, header, footer, aside, etc.)
      .replace(
        /<(?:nav|header|footer|aside|svg|iframe|embed|object|video|audio|canvas|picture|source|track|map|area)\b[^>]*>[\s\S]*?<\/(?:nav|header|footer|aside|svg|iframe|embed|object|video|audio|canvas|picture|source|track|map|area)>/gi,
        "",
      )
      // Remove self-closing non-content elements
      .replace(
        /<(?:img|br|hr|input|meta|link|base|col|command|embed|keygen|param|source|track|wbr)\b[^>]*>/gi,
        " ",
      )
      // Remove all remaining HTML tags, preserving the text content
      .replace(/<[^>]+>/g, " ")
      // Normalize whitespace (replace multiple spaces, tabs, and newlines with a single space)
      .replace(/\s+/g, " ")
      // Trim leading and trailing whitespace
      .trim()
  );
};
