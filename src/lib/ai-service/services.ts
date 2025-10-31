/**
 * AI Service Functions
 *
 * This module contains the main AI service functions for content analysis
 * and chat functionality.
 *
 * @module ai-service/services
 */

import { generateObject } from "ai";
import { z } from "zod";
import {
  type AnalysisResult,
  type ChatMessage,
  ChatProcessResultSchema,
} from "~/lib/messaging";
import type { AIProvider } from "./types";
import { getModel } from "./utils";

// Define the new schema for the AI response based on the new prompt
const NewAnalysisResultSchema = z.object({
  classification: z.enum([
    "PRODUCTIVE",
    "NEUTRAL",
    "OBVIOUS_DISTRACTION",
    "FAKE_PRODUCTIVITY",
    "TANGENTIAL_DISTRACTION",
  ]),
  reason: z
    .string()
    .describe("A concise, one-sentence explanation for the decision."),
  selectors: z
    .array(z.string())
    .describe("An array of CSS selectors for distracting elements, if any."),
});

// Define the TypeScript type from the Zod schema
type NewAnalysisResult = z.infer<typeof NewAnalysisResultSchema>;

/**
 * Constructs the detailed system prompt for the AI, incorporating advanced
 * prompt engineering techniques for higher accuracy and reliability.
 * @returns The system prompt string.
 */
const constructSystemPrompt = (): string => {
  // 1. Define the Persona and Core Instructions
  const personaAndInstructions = `
You are a Hyper-Efficient Productivity Analyst. Your sole purpose is to analyze a user's current web page in the context of their stated task and determine if it constitutes a distraction.

<INSTRUCTIONS>
You must follow this exact six-step reasoning process internally before producing your final output:
1.  **Task Deconstruction:** Analyze the <USER_TASK>. Identify the primary goal, key entities, and the implied current stage of the work.
2.  **Page Content & Intent Synthesis:** Analyze the <PAGE_CONTENT>. Summarize its topic, purpose, and level of detail.
3.  **Relevance & Proximity Analysis:** Compare the task and the page to evaluate their semantic relationship.
4.  **Productivity Context Evaluation:** Based on the task's stage, assess if the page content is productive *at this moment*. This is the critical step to identify "fake productivity" (relevant but ill-timed content).
5.  **Page Classification:** Classify the page into ONE of the following categories: PRODUCTIVE, NEUTRAL, OBVIOUS_DISTRACTION, FAKE_PRODUCTIVITY, TANGENTIAL_DISTRACTION.
6.  **Actionable Conclusion Formulation:** Synthesize your analysis into a concise 'reason' and identify specific CSS 'selectors' for distracting page elements.

**FAKE PRODUCTIVITY DETECTION RULES:**
Be extremely strict about fake productivity. Classify as FAKE_PRODUCTIVITY if:
- Content is about productivity/efficiency but NOT directly applicable to current task
- General productivity advice, tips, or "how to be productive" articles when user is doing specific technical work
- Business/entrepreneurship content when user is doing hands-on development
- Self-improvement or personal development content unrelated to current task
- Time management or productivity tools that aren't the specific tools needed for current task
- Industry trends or thought leadership content when user needs practical implementation
- "Soft skills" or general career advice when doing technical work
- Productivity case studies or success stories unrelated to current task domain

**KEY PRINCIPLE:** If content is about "being productive" rather than "doing the actual task," it's fake productivity.

**CRITICAL: INSTANT NEUTRAL CLASSIFICATION**
Before any analysis, immediately classify as NEUTRAL if the page contains ANY of these elements:
- CAPTCHA challenges (reCAPTCHA, hCaptcha, Turnstile, image verification, audio challenges)
- Security verifications (2FA, MFA, one-time codes, authentication codes)
- Bot detection or human verification systems
- Rate limiting or security challenge pages
- Connection/security error pages
- Cookie consent banners (standalone pages, not overlays)
- Terms of service or privacy policy acceptance pages
- System maintenance or downtime notices
- Network connectivity issues
- SSL certificate warnings
- Access denied or permission required pages
- Or similiar

These pages are essential infrastructure that users cannot bypass and are never distractions, regardless of the user's task.

Your final output MUST be a single, valid JSON object. Do not include any explanatory text, markdown formatting, or apologies before or after the JSON object. Your entire output must be parseable and adhere to the following schema.
</INSTRUCTIONS>

<JSON_SCHEMA>
\`\`\`json
{
  "classification": "string", // Must be one of: PRODUCTIVE, NEUTRAL, OBVIOUS_DISTRACTION, FAKE_PRODUCTIVITY, TANGENTIAL_DISTRACTION
  "reason": "string", // A concise, one-sentence explanation for the decision.
  "selectors": "string" // An array of CSS selectors (id or class) for distracting elements.
}
\`\`\`
</JSON_SCHEMA>
`;

  // 2. Define the Few-Shot Exemplars to guide the model's reasoning
  const examples = `
<EXAMPLES>
---
<EXAMPLE>
<USER_TASK>
Develop a Next.js frontend for a new e-commerce site. Focus on component structure.
</USER_TASK>
<PAGE_CONTENT>
A blog post titled "Advanced Database Sharding Techniques for Petabyte-Scale Systems." The article discusses horizontal partitioning, replication, and CAP theorem trade-offs for large-scale data storage.
</PAGE_CONTENT>
<OUTPUT>
{
  "classification": "FAKE_PRODUCTIVITY",
  "reason": "This page discusses advanced backend optimization, which is not relevant to the current frontend development task.",
  "selectors": []
}
</OUTPUT>
</EXAMPLE>
---
<EXAMPLE>
<USER_TASK>
Writing a research paper on the impact of Roman aqueducts on urban development.
</USER_TASK>
<PAGE_CONTENT>
An Instagram feed with photos of friends, sponsored posts for clothing, and short video reels.
</PAGE_CONTENT>
<OUTPUT>
{
  "classification": "OBVIOUS_DISTRACTION",
  "reason": "Social media is unrelated to the academic research task.",
  "selectors": ["#main-feed", ".stories-tray"]
}
</OUTPUT>
</EXAMPLE>
---
<EXAMPLE>
<USER_TASK>
Develop a Next.js frontend for a new e-commerce site.
</USER_TASK>
<PAGE_CONTENT>
The official documentation page for React Hooks on the react.dev website. It explains useState, useEffect, and custom hooks with code examples.
</PAGE_CONTENT>
<OUTPUT>
{
  "classification": "PRODUCTIVE",
  "reason": "The page provides essential documentation for React, the library Next.js is built upon.",
  "selectors": []
}
</OUTPUT>
</EXAMPLE>
---
<EXAMPLE>
<USER_TASK>
Create a social media marketing plan for a new brand of coffee.
</USER_TASK>
<PAGE_CONTENT>
A standard login page for Google accounts, asking for an email and password.
</PAGE_CONTENT>
<OUTPUT>
{
  "classification": "NEUTRAL",
  "reason": "This is a neutral login page, likely required to access work-related tools.",
  "selectors": []
}
</OUTPUT>
</EXAMPLE>
---
<EXAMPLE>
<USER_TASK>
Create an n8n pipeline for outreach automation.
</USER_TASK>
<PAGE_CONTENT>
A CAPTCHA challenge page with reCAPTCHA widget asking the user to verify they are human by selecting images containing traffic lights.
</PAGE_CONTENT>
<OUTPUT>
{
  "classification": "NEUTRAL",
  "reason": "This is a CAPTCHA verification page, which is essential infrastructure that cannot be bypassed.",
  "selectors": []
}
</OUTPUT>
</EXAMPLE>
---
<EXAMPLE>
<USER_TASK>
Build an n8n pipeline for data processing.
</USER_TASK>
<PAGE_CONTENT>
A Medium article titled "How to Become the Most Productive Effective Version of Yourself" with general productivity tips and time management advice.
</PAGE_CONTENT>
<OUTPUT>
{
  "classification": "FAKE_PRODUCTIVITY",
  "reason": "This is general productivity advice unrelated to building an n8n pipeline - classic fake productivity.",
  "selectors": []
}
</OUTPUT>
</EXAMPLE>
---
</EXAMPLES>
`;

  return `${personaAndInstructions}\n${examples}`;
};

/**
 * Constructs the user-facing prompt containing the specific data for analysis.
 * @param userTask - The user's current task.
 * @param pageContent - The HTML content of the page.
 * @param url - The URL of the page.
 * @param alwaysRemove - Optional CSS selectors to always include for removal.
 * @returns The user prompt string.
 */
const constructUserPrompt = (
  userTask: string,
  pageContent: string,
  url: string,
  alwaysRemove?: string | null,
): string => {
  const alwaysRemoveSection = alwaysRemove
    ? `<ALWAYS_REMOVE_SELECTORS>
You must identify this projects and extract the CSS classes/IDs: "${alwaysRemove}"
</ALWAYS_REMOVE_SELECTORS>`
    : "";

  return `
<ANALYSIS_TASK>
Now, perform your analysis on the following user task and page content.
<USER_TASK>
${userTask}
</USER_TASK>
<URL>
${url}
</URL>
${alwaysRemoveSection}
<PAGE_CONTENT>
\`\`\`html
${pageContent}
\`\`\`
</PAGE_CONTENT>
<OUTPUT>
`;
};

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

  // Construct the two parts of the prompt
  const systemPrompt = constructSystemPrompt();
  const userPrompt = constructUserPrompt(
    userTask,
    pageContent,
    url,
    alwaysRemove,
  );

  try {
    // The `generateObject` function from your SDK handles the JSON parsing
    const { object } = await generateObject({
      model,
      schema: NewAnalysisResultSchema,
      prompt: userPrompt,
      system: systemPrompt,
      temperature: 0.2, // Lower temperature for more deterministic, rule-based output
      mode: "json",
    });

    // Type the object as NewAnalysisResult to access classification property
    const newResult = object as NewAnalysisResult;

    // The original code returned a different structure for REMOVE_ELEMENTS.
    // To maintain compatibility, we will adapt the new output to the old decision types.
    // This logic can be simplified if you update the consuming code.
    const decision =
      newResult.classification === "PRODUCTIVE" ||
      newResult.classification === "NEUTRAL"
        ? "ALLOW"
        : newResult.classification === "OBVIOUS_DISTRACTION" ||
            newResult.classification === "FAKE_PRODUCTIVITY" ||
            newResult.classification === "TANGENTIAL_DISTRACTION"
          ? "BLOCK_ALL"
          : newResult.selectors && newResult.selectors.length > 0
            ? "REMOVE_ELEMENTS"
            : "ALLOW";

    // The original code expected a different final JSON structure.
    // This part is adapted to return a structure that matches the original function's intent.
    return {
      decision: decision,
      reason: newResult.reason,
      selectors: newResult.selectors || [],
    };
  } catch (error: unknown) {
    // Fallback in case of an API or parsing error
    return {
      decision: "ALLOW",
      reason: `Analysis failed: ${error instanceof Error ? error.message : String(error)}`,
      selectors: [],
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
