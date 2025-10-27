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
 * Analyzes web page content to determine if it's relevant to the user's task or a potential distraction.
 * Uses AI to make decisions about blocking the entire page, removing specific elements, or allowing access.
 *
 * @param apiKey - The API key for the specified AI provider
 * @param userTask - The current task the user is working on
 * @param pageContent - The text content of the web page to analyze
 * @param url - The URL of the page being analyzed
 * @param provider - The AI provider to use for analysis (default: "gemini")
 * @param alwaysRemove - Optional CSS selectors for elements that should always be removed
 * @returns A promise that resolves to an AnalysisResult containing the decision and reasoning
 *
 * @example
 * ```typescript
 * const result = await analyzePageContent(
 *   "api-key",
 *   "Write a research paper on climate change",
 *   "<html>Page content here</html>",
 *   "https://example.com",
 *   "gemini",
 *   ".ads,.sidebar"
 * );
 * console.log(result.decision); // "BLOCK_ALL" | "REMOVE_ELEMENTS" | "ALLOW"
 * ```
 *
 * @see {@link AnalysisResult} for the structure of the returned object
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

  const alwaysRemoveSection = alwaysRemove
    ? `\n\nALWAYS REMOVE ELEMENTS:\nThe user has specified these elements that should ALWAYS be removed regardless of task relevance:\n"${alwaysRemove}"\n\nYou MUST include CSS selectors for these always remove elements in your response if they exist on the page, even if the page is otherwise relevant to the task.`
    : "";

  const systemPrompt = `You are a 'Focus Guardian' AI. Your sole purpose is to analyze web page content and determine if it is relevant to the user's *specific, active task* or if it is a distraction.

Your analysis must be critical and distinguish between:
1.  **Directly Relevant:** Content that directly helps complete the \`userTask\`.
2.  **Productivity Tool:** Tools needed for the task (e.g., Google Docs, IDE, code repositories).
3.  **Unrelated Productivity (Fake Productivity):** Content that is work-related but *not* for the *current \`userTask\`*. (e.g., Task is 'Write Next.js frontend', content is 'Postgres database optimization').
4.  **Distraction:** Content clearly unrelated to work (e.g., social media, news, entertainment, gaming, gambling, streaming videos, sports betting, online casinos).
5.  **Critical Bypass:** Pages necessary for *access*, regardless of task (e.g., login, CAPTCHA).

---

## ANALYSIS RULES

Follow this logic step-by-step:

**Step 1: Check for Critical Bypass**
You MUST \`ALLOW\` any page that appears to be for:
* **Authentication:** Login, sign-up, password reset, 2FA, OTP.
* **Verification:** CAPTCHA ("I'm not a robot"), email/phone verification.
* **Access Gateways:** Cookie consent, terms of service, age gates, "click to continue".
* **Account Management:** Billing, profile settings, subscriptions.
If a page matches this rule, stop and return \`ALLOW\` with the reason "Critical page (e.g., login, CAPTCHA) detected."

**Step 2: Check for Unclear Task**
If the \`userTask\` is too vague or generic (e.g., "work", "research", "coding"), you cannot be critical.
If so, stop and return \`ALLOW\` with the reason "The user task is not specific enough to analyze relevance."

**Step 3: Analyze Relevance**
Compare the \`pageContent\` and \`pageURL\` to the *specific* \`userTask\`.
* **Is it Directly Relevant or a Productivity Tool?**
    * If YES: Proceed to Step 4.
* **Is it Unrelated Productivity (Fake Productivity)?**
    * If YES: Stop and return \`BLOCK_ALL\` with a reason explaining the mismatch (e.g., "Page is unrelated productivity. Task is 'X', but content is 'Y'.").
* **Is it a clear Distraction?**
    * Look for gaming, gambling, betting, streaming, entertainment, social media, news, or other non-work content.
    * Check if the URL contains gaming-related keywords (e.g., "game", "casino", "bet", "poker", "slots", "gambling").
    * Check if the content mentions gaming, gambling, betting, or entertainment.
    * If YES: Stop and return \`BLOCK_ALL\` with the reason "Page is a distraction (e.g., gaming, gambling, entertainment, social media)."

**Step 4: Analyze Relevant Content for Distractions**
The page is relevant, but check for distracting elements.
* Check if \`alwaysRemoveSelectors\` were provided.
* Check the \`pageContent\` for other common distractions (e.g., ads, unrelated recommendations, social media feeds, sidebars).
* **If no distractions are found AND no \`alwaysRemoveSelectors\` are provided:**
    * Return \`ALLOW\` with the reason "Page is relevant to the task."
* **If distractions ARE found OR \`alwaysRemoveSelectors\` are provided:**
    * Return \`REMOVE_ELEMENTS\`.
    * The \`selectors\` array MUST include *all* selectors from \`alwaysRemoveSelectors\` AND *any* other distracting CSS selectors you identify (e.g., \`.ad-banner\`, \`#recommendations\`).

**Step 5: Fallback Rule**
If you are uncertain after all checks, **default to \`ALLOW\`**. It is better to permit a distraction than to block a necessary page.

---

## OUTPUT FORMAT

Your response MUST be a single, valid JSON object. Do not add any text or markdown before or after the JSON.

**JSON Schema:**
\`\`\`json
{
  "decision": "ALLOW" | "BLOCK_ALL" | "REMOVE_ELEMENTS",
  "reason": "A brief, critical explanation for your decision.",
  "selectors": ["css.selector.one", "css.selector.two"]
}
\`\`\`
* \`selectors\` MUST be an empty array \`[]\` unless the decision is \`REMOVE_ELEMENTS\`.

---

## EXAMPLES

**Example 1: "Fake Productivity"**
* **Input:**
    * \`userTask\`: "Debug the Next.js frontend build error."
    * \`pageURL\`: "https://www.db-tutorials.com/postgres-optimization-guide"
    * \`alwaysRemoveSelectors\`: "None"
    * \`pageContent\`: "<html><title>Postgres Optimization</title><body><h1>Advanced SQL Indexing</h1>...</body></html>"
* **Output:**
    \`\`\`json
    {
      "decision": "BLOCK_ALL",
      "reason": "Page is unrelated productivity (fake productivity). The task is Next.js frontend, not Postgres optimization.",
      "selectors": []
    }
    \`\`\`

**Example 2: Relevant with Distractions & alwaysRemove**
* **Input:**
    * \`userTask\`: "Research deep learning techniques."
    * \`pageURL\`: "https://www.tech-blog.com/deep-learning-intro"
    * \`alwaysRemoveSelectors\`: ".popup-banner"
    * \`pageContent\`: "<html><title>Intro to Deep Learning</title><body><article>...main content...</article><aside id='recommendations'>...other articles...</aside><div class='popup-banner'>...</div></body></html>"
* **Output:**
    \`\`\`json
    {
      "decision": "REMOVE_ELEMENTS",
      "reason": "Page is relevant, but contains distracting elements.",
      "selectors": [".popup-banner", "#recommendations"]
    }
    \`\`\`

**Example 3: Critical Bypass (Login)**
* **Input:**
    * \`userTask\`: "Debug the Next.js frontend build error."
    * \`pageURL\`: "https://github.com/login"
    * \`alwaysRemoveSelectors\`: ".ads"
    * \`pageContent\`: "<html><title>Sign in to GitHub</title><body><form>...<input type='password'>...</form></body></html>"
* **Output:**
    \`\`\`json
    {
      "decision": "ALLOW",
      "reason": "Critical page (e.g., login, CAPTCHA) detected.",
      "selectors": []
    }
    \`\`\`

**Example 4: Gaming Distraction**
* **Input:**
    * \`userTask\`: "Complete the quarterly financial report"
    * \`pageURL\`: "https://gamingnation.true.th/en"
    * \`alwaysRemoveSelectors\`: "None"
    * \`pageContent\`: "<html><title>Gaming Nation</title><body><h1>Latest Gaming Promotions</h1><div>Play the best games and win big!</div></body></html>"
* **Output:**
    \`\`\`json
    {
      "decision": "BLOCK_ALL",
      "reason": "Page is a distraction (gaming, entertainment). The task is financial reporting, not gaming.",
      "selectors": []
    }
    \`\`\`

**Example 5: Unclear Task**
* **Input:**
    * \`userTask\`: "Work"
    * \`pageURL\`: "https://www.google.com"
    * \`alwaysRemoveSelectors\`: "None"
    * \`pageContent\`: "<html><title>Google</title><body><form>...<input type='search'>...</form></body></html>"
* **Output:**
    \`\`\`json
    {
      "decision": "ALLOW",
      "reason": "The user task is not specific enough to analyze relevance.",
      "selectors": []
    }
    \`\`\`
`;

  const prompt = `Analyze the following web page based on the system rules.

## User Task
${userTask}

## Page URL
${url}

## Always Remove Selectors
${alwaysRemove || "None"}

## Page Content (HTML)
${pageContent}
`;

  try {
    const { object } = await generateObject({
      model,
      schema: AnalysisResultSchema,
      prompt,
      temperature: 0.1,
      mode: "json",
    });

    return object;
  } catch (error: unknown) {
    return {
      decision: "ALLOW",
      reason: `AI analysis failed. Page allowed as fallback. Reason: ${error}`,
    };
  }
};

/**
 * Processes a chat message from the user and determines if access should be granted.
 * The AI evaluates whether the user's request aligns with their current task and provides
 * a response with either granted access (with duration) or a denial with reason.
 *
 * @param apiKey - The API key for the specified AI provider
 * @param userTask - The current task the user is working on
 * @param message - The user's chat message requesting access
 * @param chatHistory - Previous messages in the chat session for context
 * @param provider - The AI provider to use for processing (default: "gemini")
 * @returns A promise that resolves to an object containing the AI response, access decision, and duration
 *
 * @example
 * ```typescript
 * const response = await processChatMessage(
 *   "api-key",
 *   "Write a research paper",
 *   "I need to check social media for 5 minutes",
 *   [{ id: "1", content: "Hello", role: "user", timestamp: Date.now() }],
 *   "gemini"
 * );
 * console.log(response.accessGranted); // boolean
 * console.log(response.durationMinutes); // number if granted
 * ```
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

  // Build conversation history for context
  const historyContext = chatHistory
    .map((msg) => `${msg.role}: ${msg.content}`)
    .join("\n");

  const systemPrompt = `You are a 'Focus Guardian' AI assistant. Your purpose is to help users stay focused on their current task while maintaining productivity and well-being.

## ANALYSIS RULES

Follow this logic step-by-step:

**Step 1: Understand the Context**
- Review the user's current task: "${userTask}"
- Consider the conversation history for context
- Understand what the user is requesting

**Step 2: Evaluate Task Alignment**
- **Directly Relevant:** The request clearly helps complete the current task
- **Indirectly Relevant:** The request supports task completion (e.g., short break, research)
- **Unrelated:** The request has no connection to the current task
- **Well-being:** The request supports mental health or physical needs

**Step 3: Make Decision**
- **GRANT** if the request is:
  * Directly relevant to the task
  * Indirectly relevant with good justification
  * A reasonable short break (5-15 minutes)
  * Related to well-being needs
- **DENY** if the request is:
  * Clearly unrelated to the task
  * A potential distraction without justification
  * Excessive in duration or frequency

**Step 4: Determine Duration**
- For task-relevant requests: 15-60 minutes based on complexity
- For short breaks: 5-15 minutes
- For well-being: 10-30 minutes
- Be reasonable and specific

---

## OUTPUT FORMAT

Your response MUST be a single, valid JSON object. Do not add any text or markdown before or after the JSON.

**JSON Schema:**
\`\`\`json
{
  "response": "Your professional response to the user",
  "decision": "GRANT" | "DENY",
  "durationMinutes": number (only include if decision is GRANT)
}
\`\`\`

---

## EXAMPLES

**Example 1: Task-Relevant Request**
* **Input:**
    * \`userTask\`: "Write a research paper on climate change"
    * \`message\`: "I need to check some scientific journals for 30 minutes"
* **Output:**
    \`\`\`json
    {
      "response": "Access granted to research scientific journals. This is directly relevant to your research paper on climate change.",
      "decision": "GRANT",
      "durationMinutes": 30
    }
    \`\`\`

**Example 2: Short Break Request**
* **Input:**
    * \`userTask\`: "Debug the Next.js frontend build error"
    * \`message\`: "I need a quick 10-minute break to clear my head"
* **Output:**
    \`\`\`json
    {
      "response": "A short break is important for maintaining focus and productivity. Take 10 minutes to refresh.",
      "decision": "GRANT",
      "durationMinutes": 10
    }
    \`\`\`

**Example 3: Unrelated Distraction**
* **Input:**
    * \`userTask\`: "Complete the quarterly financial report"
    * \`message\`: "I want to watch cat videos for an hour"
* **Output:**
    \`\`\`json
    {
      "response": "Watching cat videos is not related to completing your quarterly financial report. Let's focus on your task first, and you can enjoy videos during your break time.",
      "decision": "DENY"
    }
    \`\`\`

**Example 4: Well-being Request**
* **Input:**
    * \`userTask\`: "Study for the certification exam"
    * \`message\`: "I need to stretch and move around for 15 minutes"
* **Output:**
    \`\`\`json
    {
      "response": "Physical movement is important during long study sessions. Take 15 minutes to stretch and recharge.",
      "decision": "GRANT",
      "durationMinutes": 15
    }
    \`\`\`
`;

  const prompt = `Analyze the following user request based on the system rules.

## User Task
${userTask}

## Previous Conversation
${historyContext}

## User's Request
${message}
`;

  try {
    const { object } = await generateObject({
      model,
      schema: ChatProcessResultSchema,
      prompt,
      temperature: 0.1,
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
    console.error("Chat message processing failed:", {
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString(),
      context: "AI service chat processing",
    });
    // Fallback response
    return {
      message: {
        id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        content:
          "I'm having trouble processing your request right now. Please try again.",
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
