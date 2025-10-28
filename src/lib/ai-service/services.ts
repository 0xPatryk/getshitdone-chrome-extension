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
    ? `\n\n## ALWAYS REMOVE ELEMENTS\nThe user specified these elements to ALWAYS remove: "${alwaysRemove}"\nInclude these selectors in your response if they exist on the page.`
    : "";

  const systemPrompt = `You are a Focus Assistant AI. Your task is to analyze web pages and determine if they help users complete their specific task or represent fake productivity.

## TASK
Produce a JSON analysis of whether a web page is relevant to the user's specific task or a distraction.

## INPUT
- User task: The specific work the user should be doing
- Page URL: The website address being analyzed
- Page content: HTML content of the page
- Always remove selectors: CSS elements to always remove if present

## ANALYSIS FRAMEWORK

### Step 1: Critical Pages Check
ALLOW immediately for:
- Login/authentication pages
- CAPTCHA or verification pages
- Account/billing management
- Terms of service or consent pages

**IMPORTANT**: If you identify a CAPTCHA, verification, or login page, you MUST return ALLOW immediately without further analysis. These pages are essential for accessing any website.

### Step 2: Task Clarity and Context Check
- If user task is vague (e.g., "work", "research", "coding") without specific details, analyze the page content more strictly

### Step 3: General Relevance Analysis
For non-coding tasks, compare page content to the SPECIFIC user task:

**Directly Relevant:** Content that directly helps complete the stated task
**Productivity Tools:** Tools needed for the task (IDEs, docs, repositories)
**Fake Productivity:** Work-related content UNRELATED to current task
**Distractions:** Entertainment, social media, news, gaming, etc.

### Step 4: Decision Logic
- BLOCK_ALL for fake productivity or clear distractions
- ALLOW for directly relevant content with no distractions
- REMOVE_ELEMENTS for relevant content with distractions

## OUTPUT FORMAT
Return exactly this JSON structure:
\`\`\`json
{
  "decision": "ALLOW" | "BLOCK_ALL" | "REMOVE_ELEMENTS",
  "reason": "Brief explanation of decision",
  "selectors": ["css.selector.one", "css.selector.two"]
}
\`\`\`

## EXAMPLES

**Example 1 - Gaming Site with Coding Task:**
Task: "Write React components" | Page: Rust game website
Decision: BLOCK_ALL
Reason: "Gaming website is a distraction for coding tasks - entertainment content unrelated to programming"

**Example 2 - Fake Productivity:**
Task: "Build React frontend" | Page: Database optimization tutorial
Decision: BLOCK_ALL
Reason: "Fake productivity - database optimization unrelated to frontend development"

**Example 3 - Relevant with Distractions:**
Task: "Research machine learning" | Page: ML article with ads and sidebar
Decision: REMOVE_ELEMENTS
Reason: "Relevant content with distracting elements"
Selectors: [".ads", "#sidebar"]

**Example 4 - Critical CAPTCHA Page:**
Task: "Write code" | Page: "I'm not a robot" CAPTCHA verification
Decision: ALLOW
Reason: "Critical CAPTCHA verification page - must allow access"

**Example 5 - Critical Login Page:**
Task: "Write code" | Page: GitHub login
Decision: ALLOW
Reason: "Critical authentication page - must allow access"

**Example 6 - Coding Task with Tech Content:**
Task: "Debug Python code" | Page: Stack Overflow Python question
Decision: ALLOW
Reason: "Programming documentation directly relevant to coding task"

## EVALUATION CRITERIA
Before responding, confirm you will:
1. Analyze only the provided inputs
2. Focus on detecting fake productivity and entertainment distractions
3. Return valid JSON matching the schema
4. Apply the decision logic consistently - if content is identified as a distraction or fake productivity, use BLOCK_ALL regardless of uncertainty
5. Only default to ALLOW when the content genuinely doesn't fit any distraction category and you cannot make a clear determination`;

  const prompt = `${alwaysRemoveSection}

## User Task
${userTask}

## Page URL
${url}

## Page Content (HTML)
${pageContent}`;

  try {
    const { object } = await generateObject({
      model,
      schema: AnalysisResultSchema,
      prompt,
      system: systemPrompt,
      temperature: 0.1,
      mode: "json",
    });

    return object;
  } catch (error: unknown) {
    // Handle specific error types
    if (error instanceof Error) {
      // Check for authentication errors
      if (error.message.includes("401") || error.message.includes("unauthorized") || error.message.includes("API key")) {
        return {
          decision: "ALLOW",
          reason: "Authentication failed. Please check your API key in extension settings.",
        };
      }
      
      // Check for rate limiting
      if (error.message.includes("429") || error.message.includes("rate limit")) {
        return {
          decision: "ALLOW",
          reason: "Rate limit exceeded. Please wait a moment and try again.",
        };
      }
      
      // Check for network errors
      if (error.message.includes("fetch") || error.message.includes("network") || error.message.includes("ENOTFOUND")) {
        return {
          decision: "ALLOW",
          reason: "Network error. Please check your internet connection and try again.",
        };
      }
      
      // Check for quota exceeded
      if (error.message.includes("quota") || error.message.includes("exceeded")) {
        return {
          decision: "ALLOW",
          reason: "API quota exceeded. Please check your billing and try again later.",
        };
      }
    }
    
    // Generic fallback
    return {
      decision: "ALLOW",
      reason: `AI analysis failed. Page allowed as fallback. Reason: ${error instanceof Error ? error.message : String(error)}`,
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

  const systemPrompt = `You are a Focus Assistant AI. Your task is to help users stay productive while negotiating reasonable access to content.

## TASK
Produce a JSON response that either grants or denies user requests with clear reasoning and negotiation.

## INPUT
- User task: The specific work user should be doing
- User request: What user wants to access or do
- Conversation history: Previous messages for context

## ANALYSIS FRAMEWORK

### Step 1: Context Assessment
- Review the user's current task
- Understand the specific request
- Consider conversation history

### Step 2: Request Classification
**Task-Relevant:** Directly helps complete the current task
**Productivity Support:** Indirectly supports task completion
**Well-being:** Supports mental/physical health
**Distraction:** Unrelated entertainment or time-wasting
**Negotiable:** Could be reasonable with limits

### Step 3: Decision Logic
**GRANT** for:
- Task-relevant content (15-60 minutes)
- Productivity support with justification (10-30 minutes)
- Well-being needs (5-20 minutes)
- Short reasonable breaks (5-15 minutes)

**NEGOTIATE** for:
- Partially relevant requests with time limits
- Longer breaks with task completion conditions
- Mixed content with selective access

**DENY** for:
- Clear distractions without justification
- Excessive time requests
- Harmful or inappropriate content

### Step 4: Response Strategy
- Acknowledge the user's request
- Explain your reasoning clearly
- Offer alternatives when denying
- Set reasonable time limits
- Maintain supportive, collaborative tone

## OUTPUT FORMAT
Return exactly this JSON structure:
\`\`\`json
{
  "response": "Your conversational response to the user",
  "decision": "GRANT" | "DENY",
  "durationMinutes": number (only include if decision is GRANT)
}
\`\`\`

## EXAMPLES

**Example 1 - Task-Relevant Grant:**
Task: "Write React documentation" | Request: "Check React docs for 25 minutes"
Response: "Access granted to React documentation. This directly supports your documentation writing task."
Decision: GRANT | Duration: 25

**Example 2 - Negotiation:**
Task: "Complete project proposal" | Request: "Browse social media for 30 minutes"
Response: "I understand you need a break, but 30 minutes on social media might disrupt your focus. How about a 15-minute break to stretch and grab a coffee, then we can tackle that proposal with fresh energy?"
Decision: DENY

**Example 3 - Well-being Grant:**
Task: "Debug code issue" | Request: "Take a 10-minute walk to clear my head"
Response: "Taking a walk is a great way to solve coding problems! Fresh air often helps with debugging. Enjoy your 10-minute break."
Decision: GRANT | Duration: 10

## EVALUATION CRITERIA
Before responding, confirm you will:
1. Provide helpful, conversational responses
2. Negotiate reasonable alternatives when denying
3. Set appropriate time limits based on request type
4. Maintain supportive, collaborative tone
5. Focus on long-term productivity over short-term satisfaction`;

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
    
    // Handle specific error types
    let errorMessage = "I'm having trouble processing your request right now. Please try again.";
    
    if (error instanceof Error) {
      // Check for authentication errors
      if (error.message.includes("401") || error.message.includes("unauthorized") || error.message.includes("API key")) {
        errorMessage = "Authentication failed. Please check your API key in the extension settings.";
      }
      // Check for rate limiting
      else if (error.message.includes("429") || error.message.includes("rate limit")) {
        errorMessage = "Rate limit exceeded. Please wait a moment and try again.";
      }
      // Check for network errors
      else if (error.message.includes("fetch") || error.message.includes("network") || error.message.includes("ENOTFOUND")) {
        errorMessage = "Network error. Please check your internet connection and try again.";
      }
      // Check for quota exceeded
      else if (error.message.includes("quota") || error.message.includes("exceeded")) {
        errorMessage = "API quota exceeded. Please check your billing and try again later.";
      }
    }
    
    // Fallback response
    return {
      message: {
        id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        content: errorMessage,
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
