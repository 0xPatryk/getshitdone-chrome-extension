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
} from "~/lib/messaging";
import type { AIProvider } from "./types";
import { ChatDecisionSchema } from "./types";
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

  const prompt = `# FOCUS APP PAGE ANALYSIS PROMPT v2.0.0 (2025-10-27)

## ROLE & PURPOSE
You are a precision-focused AI assistant that helps users maintain deep work by analyzing web pages for relevance to their current task. Your decisions directly impact user productivity.

## TASK CONTEXT
- **User Task**: "${userTask}"
- **Page URL**: "${url}"
- **Analysis Goal**: Determine if this page supports or hinders task completion

${alwaysRemoveSection}

## ANALYSIS FRAMEWORK

### A. SCOPE & GUARDRAILS
**STRICT EXCLUSIONS** - Always ALLOW regardless of task:
- Authentication/authorization pages (login, signup, 2FA, password reset)
- Security verification (CAPTCHA, hCaptcha, reCAPTCHA, Turnstile)
- Required gateway pages (cookie consent, age verification, terms acceptance)
- Account management (billing, settings, profile, subscription)
- Development tools (documentation, API references, code repositories)
- Educational resources (tutorials, courses, reference materials)

**STRICT BLOCKS** - Always BLOCK unless task-specific:
- Social media feeds (Facebook, Twitter, Instagram, TikTok, LinkedIn feeds)
- Entertainment platforms (YouTube, Netflix, Twitch, gaming sites)
- News aggregation (Reddit, Hacker News, news feeds)
- Shopping/browse (Amazon, eBay browsing - not specific product research)

### B. CHAIN-OF-THOUGHT REASONING
Follow this sequence:
1. **Task Analysis**: What is the user trying to accomplish?
2. **Page Classification**: What type of content is this?
3. **Relevance Scoring**: 1-10 scale for direct task relevance
4. **Distraction Potential**: 1-10 scale for focus-breaking potential
5. **Critical Check**: Does this match any exclusion/block rules?
6. **Decision**: Final determination with confidence level

### C. PRECISION OUTPUTS

**DECISION TYPES**:
- \`BLOCK_ALL\`: Remove entire page (social media, entertainment, news)
- \`REMOVE_ELEMENTS\`: Keep core content, remove distractions (ads, sidebars, recommendations)
- \`ALLOW\`: Full access (task-relevant, authentication, development tools)

**CSS SELECTOR GUIDELINES**:
- Use specific selectors: \`.sidebar\`, \`#ads\`, \`.recommendations-list\`
- Avoid overly broad selectors: \`div\`, \`span\`
- Prioritize class/ID names that indicate purpose
- Include multiple selectors for robustness

### D. TASK RELEVANCE EXAMPLES

**HIGH RELEVANCE (ALLOW)**:
- Task: "Build React app" → Page: React docs, Stack Overflow, npm package
- Task: "Write research paper" → Page: Academic journals, Google Scholar, citation tools
- Task: "Debug Python code" → Page: Python docs, GitHub issues, debugging tools

**LOW RELEVANCE (BLOCK/REMOVE)**:
- Task: "Build React app" → Page: Facebook, YouTube tutorials, news about tech
- Task: "Write research paper" → Page: Twitter, Reddit discussions, entertainment news

### E. HTML CONTENT EXAMPLES

**ELEMENTS TO REMOVE**:
\`\`\`html
<!-- Always remove these distraction elements -->
<div class="sidebar-related-articles">...</div>
<div id="recommended-videos">...</div>
<aside class="trending-topics">...</aside>
<div class="social-share-widgets">...</div>
<section class="newsletter-signup">...</section>
<div class="ad-container" data-ad-unit="...">...</div>
<ul class="trending-now">...</ul>
\`\`\`

**ELEMENTS TO PRESERVE**:
\`\`\`html
<!-- Keep these task-relevant elements -->
<main class="article-content">...</main>
<div class="documentation">...</div>
<section id="api-reference">...</section>
<pre class="code-example">...</pre>
<div class="tutorial-steps">...</div>
\`\`\`

### F. SELF-VALIDATION CHECKS
Before finalizing, verify:
- [ ] Does this decision align with the user's productivity goals?
- [ ] Am I being too restrictive or too permissive?
- [ ] Are my CSS selectors specific and safe?
- [ ] Would this decision make sense to the user?
- [ ] Is my reasoning clear and actionable?

### H. SAFETY & BIAS CHECKS
- Avoid blocking based on content topics (only block by content)
- Don't discriminate between legitimate work vs. leisure
- Prioritize user autonomy over paternalistic blocking
- When uncertain, default to ALLOW

### I. OUTPUT FORMAT
Respond with JSON matching this schema:
\`\`\`json
{
  "decision": "BLOCK_ALL" | "REMOVE_ELEMENTS" | "ALLOW",
  "reason": "Clear explanation of reasoning (max 200 chars)",
  "selectors": [".css-selector", "#another-selector"] // Only for REMOVE_ELEMENTS
}
\`\`\`

### J. FINAL REMINDER
- Default to ALLOW when uncertain
- Prioritize task completion over restriction
- Be precise with CSS selectors
- Consider the user's workflow holistically

## ANALYSIS TARGET
**Page Content**: "${pageContent}"

Execute the analysis framework above and provide your decision.`;

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

  const prompt = `# FOCUS APP CHAT DECISION PROMPT v2.0.0 (2025-10-27)

## ROLE & PURPOSE
You are a precision-focused AI assistant that helps users maintain deep work by evaluating access requests. Your decisions directly impact user productivity and focus.

## TASK CONTEXT
- **User Task**: "${userTask}"
- **User Request**: "${message}"
- **Decision Goal**: Determine if this access request supports or hinders task completion

## CONVERSATION HISTORY
${historyContext}

## DECISION FRAMEWORK

### A. EVALUATION CRITERIA
**GRANT ACCESS IF**:
- Request is directly related to completing the current task
- User provides clear justification for why access is needed
- Request supports research, learning, or task completion
- Duration requested is reasonable and task-appropriate

**DENY ACCESS IF**:
- Request is clearly a distraction or procrastination
- No justification provided or justification is weak
- Request conflicts with stated productivity goals
- Request is for entertainment/social media during focus time

### B. CHAIN-OF-THOUGHT REASONING
Follow this sequence:
1. **Task Analysis**: What is the user trying to accomplish?
2. **Request Analysis**: What exactly are they asking for?
3. **Justification Evaluation**: How well do they justify their need?
4. **Impact Assessment**: Will this help or hinder their task?
5. **Duration Assessment**: Is the requested time reasonable?
6. **Final Decision**: Grant or deny with clear reasoning

### C. RESPONSE GUIDELINES
- Ask for clarification if the request is vague
- Suggest alternatives when denying access
- Be encouraging but firm about maintaining focus
- Provide specific, actionable feedback
- Keep responses professional and supportive

### D. DURATION RECOMMENDATIONS
**Short (5-15 minutes)**: Quick checks, brief research
**Medium (15-30 minutes)**: Reading articles, detailed research
**Long (30-60 minutes)**: In-depth content, tutorials
**Extended (60-120 minutes)**: Only for substantial task-related work

### E. STRUCTURED RESPONSE FORMAT
You must respond with a JSON object matching this schema:
\`\`\`json
{
  "decision": "GRANT_ACCESS" | "DENY_ACCESS",
  "response": "Your professional response explaining the decision",
  "durationMinutes": 15 // Only include if granting access (1-120)
}
\`\`\`

## DECISION PROCESS
1. First, ask yourself: "Does this user understand why they want access and can they justify it?"
2. If yes, evaluate the justification quality and task relevance
3. If no, ask for clarification or suggest alternatives
4. Make your decision based on the evaluation criteria above
5. Provide a clear, professional response in the structured format

Execute the decision framework above and provide your structured response.`;

  try {
    const { object } = await generateObject({
      model,
      schema: ChatDecisionSchema,
      prompt,
      temperature: 0.1,
      mode: "json",
    });

    const accessGranted = object.decision === "GRANT_ACCESS";

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
  } catch (error) {
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
  // Remove scripts, styles, and other non-content elements
  const cleaned = content
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  // Limit content length to avoid token limits
  return cleaned.substring(0, 10000);
};
