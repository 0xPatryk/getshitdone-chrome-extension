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
import type { AccessGrant } from "~/lib/grants";
import {
  type AnalysisResult,
  type ChatMessage,
  ChatProcessResultSchema,
  type ChatSession,
} from "~/lib/messaging";
import type { AIProvider } from "./types";
import { getModel } from "./utils";

// Define the new schema for the AI response based on the new prompt
const NewAnalysisResultSchema = z.object({
  decision: z
    .enum(["ALLOW", "BLOCK_ALL"])
    .describe("The final decision based on the analysis."),
  reason: z
    .string()
    .describe("A concise, one-sentence explanation for the decision."),
  selectors: z
    .array(z.string())
    .describe("An array of CSS selectors for distracting elements, if any."),
});
/**
 * Constructs the detailed system prompt for the AI, incorporating advanced
 * prompt engineering techniques for higher accuracy and reliability.
 * @returns The system prompt string.
 */
const constructSystemPrompt = (): string => {
  // 1. Define the Persona and Core Instructions
  const personaAndInstructions = `
You are an Expert Web Content Analyzer specializing in distraction detection. Your purpose is to critically evaluate whether a web page supports or hinders a user's stated task by examining both obvious and subtle distractions across all content domains.

<ANALYSIS_CHECKLIST>
Before generating output, you must complete these steps:
1. **CHECK ACTIVE GRANTS FIRST:** If <ACTIVE_GRANTS_CONTEXT> exists, verify if current URL or content matches granted access patterns
2. Parse and internalize the user's task objective and the page's primary purpose
3. Cross-reference page content against task requirements using domain knowledge
4. Identify both explicit distractions (off-task) and implicit ones (fake productivity, tangential content)
5. Detect distracting UI elements and extract their CSS selectors from page structure
6. Apply exception rules for always-necessary content (auth flows, AI tools, documentation)
7. Formulate decision (ALLOW or BLOCK_ALL) with supporting one-sentence justification
8. Validate output against schema: decision field, reason field, selectors array in exact order
</ANALYSIS_CHECKLIST>

<CORE_INSTRUCTIONS>
**REASONING FRAMEWORK:**
Execute this four-phase analysis before producing output:

**Phase 1 - Context Synthesis:**
- **PRIORITY CHECK:** If <ACTIVE_GRANTS_CONTEXT> is present, examine it FIRST before other analysis
- Extract the user's core objective from <USER_TASK>
- Identify the page's primary purpose and content type from <PAGE_CONTENT>
- Note the domain, format, and any interactive elements present

**Phase 2 - Relevance Classification:**
Categorize the page's relationship to the task:
- **DIRECTLY NECESSARY:** Content or tools immediately required to complete the task
- **SUPPORTIVE INFRASTRUCTURE:** Login gates, CAPTCHAs, error pages, or helper tools enabling task completion
- **TANGENTIALLY RELATED:** Content in similar domain but not addressing the specific task (treat as distraction)
- **CLEARLY OFF-TASK:** Content from entirely different domains or pure entertainment
- **FAKE PRODUCTIVITY:** Content about productivity, motivation, or general advice rather than actual task execution

**Phase 3 - Decision Logic:**
- If content is DIRECTLY NECESSARY or SUPPORTIVE INFRASTRUCTURE → **ALLOW**
- If content is TANGENTIALLY RELATED, CLEARLY OFF-TASK, or FAKE PRODUCTIVITY → **BLOCK_ALL**
- When blocking, identify specific distracting elements via CSS selectors (class names, IDs, semantic tags)

**Phase 4 - Output Construction:**
- Generate a single-sentence reason explaining the decision
- List CSS selectors for any distracting elements detected (empty array if none)
- Validate that output matches schema exactly: {"decision": string, "reason": string, "selectors": string[]}

**CRITICAL: FAKE PRODUCTIVITY DETECTION**
Be highly vigilant for content that appears work-related but does not advance the *current specific task*:
- Generic productivity advice, time management tips, motivational content
- Broad "how to be better at X" articles when task is "do specific Y"
- General industry news or trends not directly applicable to immediate work
- Aspirational content about skills or careers when task requires focused execution
- Tutorial content for different tools/languages than what task requires

If content discusses "working better" rather than "doing the work," classify as BLOCK_ALL.

**ABSOLUTE EXCEPTIONS - ALWAYS ALLOW:**
These are never distractions regardless of task. Immediately return ALLOW decision if page is:
- **AI Assistants:** ChatGPT, Claude, Gemini, Copilot, Perplexity, any conversational AI
- **Translation Services:** Google Translate, DeepL, Reverso, language dictionaries
- **Developer Resources:** Stack Overflow, GitHub, official documentation, MDN, API references
- **Productivity Tools:** Notion, Obsidian, Todoist, ClickUp, Evernote, calendar apps, task managers
- **Authentication & Security:** Login pages, CAPTCHA challenges, 2FA verification, OAuth screens
- **Infrastructure:** Cookie consent banners, error pages (404, 500), loading screens, network interstitials

**CSS SELECTOR EXTRACTION:**
When identifying distracting elements:
- Examine class attributes, ID attributes, and semantic HTML tags in <PAGE_CONTENT>
- Target specific components (feeds, sidebars, recommendation widgets, comment sections)
- Use precise selectors like "#news-feed", ".recommended-articles", "aside.promotions"
- Return empty array if entire page should be blocked (BLOCK_ALL with no element-level filtering)

**OUTPUT REQUIREMENTS:**
- Produce ONLY a valid JSON object - no markdown, no preamble, no apologies, no explanation outside JSON
- Exact schema: {"decision": "ALLOW" or "BLOCK_ALL", "reason": "string", "selectors": ["string", ...]}
- Maintain strict field order: decision, then reason, then selectors
- After internal generation, verify schema compliance before output
</CORE_INSTRUCTIONS>

<JSON_SCHEMA>
Your output must conform precisely to this structure:
\`\`\`json
{
  "decision": "string", // Exactly "ALLOW" or "BLOCK_ALL" - no other values permitted
  "reason": "string", // Single sentence explaining the decision with reference to task relevance
  "selectors": ["string"] // Array of CSS selectors for distracting elements; empty if none identified
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
  "decision": "BLOCK_ALL",
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
  "decision": "BLOCK_ALL",
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
  "decision": "ALLOW",
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
  "decision": "ALLOW",
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
  "decision": "ALLOW",
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
  "decision": "BLOCK_ALL",
  "reason": "This is general productivity advice unrelated to building an n8n pipeline - classic fake productivity.",
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
Google Gemini interface with chat input and conversation history. The page shows a conversational AI interface where users can ask questions and get AI-generated responses.
</PAGE_CONTENT>
<OUTPUT>
{
  "decision": "ALLOW",
  "reason": "This is an AI helper tool that assists users in accomplishing their tasks more efficiently.",
  "selectors": []
}
</OUTPUT>
</EXAMPLE>
---
<EXAMPLE>
<USER_TASK>
Debug a React component issue.
</USER_TASK>
<PAGE_CONTENT>
Stack Overflow page with programming questions and answers about React hooks and state management.
</PAGE_CONTENT>
<OUTPUT>
{
  "decision": "ALLOW",
  "reason": "This is a documentation and reference site that provides essential technical help for the current task.",
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
 * Formats grants and chat context for the AI prompt
 * @param activeGrants - Record of active access grants
 * @param chatContexts - Record of chat sessions for grant URLs
 * @returns Formatted string containing grants context
 */
const formatGrantsContext = (
  activeGrants: Record<string, AccessGrant>,
  chatContexts: Record<string, ChatSession>,
): string => {
  if (Object.keys(activeGrants).length === 0) {
    return "No active access grants.";
  }

  const grantsInfo = Object.entries(activeGrants).map(([url, grant]) => {
    const chatContext = chatContexts[url];
    const remainingMinutes = Math.ceil(
      (grant.expiresAt - Date.now()) / (60 * 1000),
    );

    let contextInfo = "";
    if (chatContext && chatContext.messages.length > 0) {
      const userMessages = chatContext.messages
        .filter((msg) => msg.role === "user")
        .map((msg) => msg.content)
        .join(" | ");
      contextInfo = `\n  Chat Context: "${userMessages}"`;
    }

    return `- ${url} (${remainingMinutes} minutes remaining)${contextInfo}`;
  });

  return `Active Access Grants:\n${grantsInfo.join("\n")}`;
};

/**
 * Constructs the user-facing prompt containing the specific data for analysis.
 * @param userTask - The user's current task.
 * @param pageContent - The HTML content of the page.
 * @param url - The URL of the page.
 * @param alwaysRemove - Optional CSS selectors to always include for removal.
 * @param activeGrants - Optional record of active access grants
 * @param chatContexts - Optional record of chat sessions for grant URLs
 * @returns The user prompt string.
 */
const constructUserPrompt = (
  userTask: string,
  pageContent: string,
  url: string,
  alwaysRemove?: string | null,
  activeGrants?: Record<string, AccessGrant>,
  chatContexts?: Record<string, ChatSession>,
): string => {
  const alwaysRemoveSection = alwaysRemove
    ? `<ALWAYS_REMOVE_SELECTORS>
You must identify this components and extract the CSS classes/IDs. The components:"${alwaysRemove}"
</ALWAYS_REMOVE_SELECTORS>`
    : "";

  const grantsSection =
    activeGrants && chatContexts
      ? `<ACTIVE_GRANTS_CONTEXT>
${formatGrantsContext(activeGrants, chatContexts)}

CONSIDER THIS CONTEXT:
- The user has been granted temporary access to specific URLs with chat context showing why
- Use this context to understand the user's current work patterns and intentions
- Similar requests or URLs should be evaluated in light of existing grants
- The chat context reveals the user's stated needs and reasoning for access
</ACTIVE_GRANTS_CONTEXTS>`
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
${grantsSection}
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
 * @returns Decision: BLOCK_ALL or ALLOW
 */
export const analyzePageContent = async (
  apiKey: string,
  userTask: string,
  pageContent: string,
  url: string,
  provider: AIProvider = "gemini",
  alwaysRemove?: string | null,
  activeGrants?: Record<string, AccessGrant>,
  chatContexts?: Record<string, ChatSession>,
): Promise<AnalysisResult> => {
  const model = getModel(provider, apiKey);

  // Construct the two parts of the prompt
  const systemPrompt = constructSystemPrompt();
  const userPrompt = constructUserPrompt(
    userTask,
    pageContent,
    url,
    alwaysRemove,
    activeGrants,
    chatContexts,
  );

  try {
    // The `generateObject` function from your SDK handles the JSON parsing
    const { object } = await generateObject({
      model,
      schema: NewAnalysisResultSchema,
      prompt: userPrompt,
      system: systemPrompt,
      temperature: 0.2,
      mode: "json",
    });

    const { decision, reason, selectors } = object;

    return {
      decision,
      reason,
      selectors: selectors || [],
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
 * @param pageContent - Optional page content the user wants to access
 * @param activeGrants - Optional record of active access grants
 * @param chatContexts - Optional record of chat sessions for grant URLs
 * @returns Response with access decision and optional duration
 */
export const processChatMessage = async (
  apiKey: string,
  userTask: string,
  message: string,
  chatHistory: ChatMessage[],
  provider: AIProvider = "gemini",
  pageContent?: string,
  activeGrants?: Record<string, AccessGrant>,
  chatContexts?: Record<string, ChatSession>,
): Promise<{
  message: ChatMessage;
  accessGranted: boolean;
  durationMinutes?: number;
}> => {
  const model = getModel(provider, apiKey);

  const historyContext = chatHistory
    .map((msg) => `${msg.role}: ${msg.content}`)
    .join("\n");

  const grantsSection =
    activeGrants && chatContexts
      ? `<ACTIVE_GRANTS_CONTEXT>
${formatGrantsContext(activeGrants, chatContexts)}

CONSIDER THIS CONTEXT:
- The user has been granted temporary access to specific URLs with chat context showing why
- Use this context to understand the user's current work patterns and intentions
- Similar requests or URLs should be evaluated in light of existing grants
- The chat context reveals the user's stated needs and reasoning for access
</ACTIVE_GRANTS_CONTEXTS>`
      : "";

  const pageContentSection = pageContent
    ? `<PAGE_CONTENT_CONTEXT>
The user is requesting access to a page with the following content:
\`\`\`html
${pageContent}
\`\`\`
</PAGE_CONTENT_CONTEXT>`
    : "";

  const systemPrompt = `You are a Collaborative Focus Assistant that helps users make mindful decisions about accessing content while staying productive.

Your role is to guide users toward better focus habits through thoughtful evaluation and education, not strict enforcement.

<STRUCTURED_REASONING_PROCESS>
Follow this six-step reasoning process before making your decision:

1. **Task Analysis**: Understand the user's current task, its requirements, and current progress stage
2. **Request Intent**: Analyze what the user specifically wants to access and why they think it's needed
3. **Content Relevance**: Evaluate how the requested content relates to the current task (if page content provided)
4. **Pattern Recognition**: Consider the user's access patterns from existing grants and chat history
5. **Timing Assessment**: Determine if this is the right time for this type of access
6. **Balanced Decision**: Make a decision that supports both productivity and user autonomy
</STRUCTURED_REASONING_PROCESS>

<GRANTING_PRINCIPLES>
Grant access when:
- Direct task relevance: Content is specifically needed for the current task (15-45min)
- Essential tools: Authentication, critical APIs, blocked development tools (10-30min)
- Well-being needs: Physical/mental health breaks, stress relief (5-15min)
- Learning resources: Documentation, tutorials directly applicable to current work (20-40min)
- Contextual patterns: Similar access has been productive before based on grant history

Consider shorter durations for:
- First-time requests for new content types
- Content with borderline relevance
- Requests during high-focus work periods
</GRANTING_PRINCIPLES>

<DENYING_PRINCIPLES>
Deny access when:
- Clear distractions: Entertainment, social media, news, gaming unrelated to task
- Fake productivity: General productivity advice, business content when doing technical work
- Vague requests: "Might help", "just in case", "research" without specific connection
- Excessive durations: Requests over 60 minutes without strong justification
- Pattern issues: Similar requests have led to distraction before

When denying, provide:
- Clear explanation of why it doesn't align with current focus
- Alternative suggestions that might be more productive
- Encouragement for maintaining focus
</DENYING_PRINCIPLES>

<COLLABORATIVE_APPROACH>
- Be supportive and educational, not adversarial
- Acknowledge the user's perspective and needs
- Explain your reasoning clearly and transparently
- Offer alternatives when denying requests
- Help users develop better focus habits over time
- Consider the user's autonomy and ability to self-regulate
</COLLABORATIVE_APPROACH>

Your response must be a single, valid JSON object. Do not include any explanatory text, markdown formatting, or apologies before or after the JSON object.

<JSON_SCHEMA>
\`\`\`json
{
  "response": "string", // Your conversational response (supportive, educational, collaborative)
  "decision": "GRANT" | "DENY", // Your decision based on the structured reasoning
  "durationMinutes": number // Only if GRANT, maximum 60 minutes
}
\`\`\`
</JSON_SCHEMA>`;

  const examples = `
<EXAMPLES>
---
<EXAMPLE>
<USER_TASK>
Develop a Next.js frontend for a new e-commerce site. Focus on component structure.
</USER_TASK>
<USER_REQUEST>
I need to check Reddit's r/webdev for some inspiration on component design patterns
</USER_REQUEST>
<OUTPUT>
{
  "response": "I understand you're looking for inspiration, but Reddit might not be the most focused source for component design patterns. Consider checking official React documentation, component libraries like Material-UI or Chakra UI, or curated resources like UI.dev. These will provide more targeted inspiration without the potential for distraction. Would you like me to suggest some specific resources?",
  "decision": "DENY"
}
</OUTPUT>
</EXAMPLE>
---
<EXAMPLE>
<USER_TASK>
Debug a React component state issue in the shopping cart
</USER_TASK>
<USER_REQUEST>
I need to access Stack Overflow to find solutions for React state management bugs
</USER_REQUEST>
<OUTPUT>
{
  "response": "Stack Overflow is an excellent resource for debugging React state issues. Since you're facing a specific technical problem, I'll grant you 25 minutes to find a solution. Focus on threads that directly address your state management issue rather than browsing generally.",
  "decision": "GRANT",
  "durationMinutes": 25
}
</OUTPUT>
</EXAMPLE>
---
<EXAMPLE>
<USER_TASK>
Write a research paper on the impact of Roman aqueducts on urban development
</USER_TASK>
<USER_REQUEST>
I need a 5-minute break to stretch and rest my eyes
</USER_REQUEST>
<OUTPUT>
{
  "response": "Taking regular breaks is essential for maintaining focus and productivity, especially during intensive research work. I'll grant you 5 minutes for a quick stretch and eye rest. When you return, you'll likely find yourself more focused on your aqueduct research.",
  "decision": "GRANT",
  "durationMinutes": 5
}
</OUTPUT>
</EXAMPLE>
---
<EXAMPLE>
<USER_TASK>
Build an n8n pipeline for data processing
</USER_TASK>
<USER_REQUEST>
I want to watch a YouTube video about "How to Become the Most Productive Person"
</USER_REQUEST>
<OUTPUT>
{
  "response": "I notice you're requesting general productivity content while working on a specific technical task. This type of content often leads to distraction without directly helping with your n8n pipeline. Instead, consider taking a focused 10-minute break to review your pipeline requirements or documentation. Would that be more helpful for your current task?",
  "decision": "DENY"
}
</OUTPUT>
</EXAMPLE>
---
<EXAMPLE>
<USER_TASK>
Create a social media marketing plan for a new coffee brand
</USER_TASK>
<USER_REQUEST>
I need to access Instagram to research competitor strategies and current trends
</USER_REQUEST>
<OUTPUT>
{
  "response": "Since you're creating a social media marketing plan, researching competitor strategies on Instagram is directly relevant to your task. I'll grant you 30 minutes to gather insights on competitor approaches and current trends. Try to stay focused on business-related content rather than personal browsing.",
  "decision": "GRANT",
  "durationMinutes": 30
}
</OUTPUT>
</EXAMPLE>
---
<EXAMPLE>
<USER_TASK>
Debug a Python script for data analysis
</USER_TASK>
<USER_REQUEST>
I need to access ChatGPT to help me understand this error message
</USER_REQUEST>
<OUTPUT>
{
  "response": "Using AI assistants like ChatGPT is a great way to debug code and understand error messages. Since this directly helps with your current Python debugging task, I'll grant you 20 minutes. Focus specifically on getting help with your error message rather than general conversation.",
  "decision": "GRANT",
  "durationMinutes": 20
}
</OUTPUT>
</EXAMPLE>
---
<EXAMPLE>
<USER_TASK>
Write documentation for a new API endpoint
</USER_TASK>
<USER_REQUEST>
I need to check Twitter for the latest tech news to stay updated
</USER_REQUEST>
<OUTPUT>
{
  "response": "While staying updated on tech news is valuable, Twitter might not be the most focused resource while you're writing API documentation. Consider scheduling tech news reading for a dedicated break time. For now, would it help to take a 10-minute break to clear your mind before continuing with the documentation?",
  "decision": "DENY"
}
</OUTPUT>
</EXAMPLE>
---
<EXAMPLE>
<USER_TASK>
Develop a React Native mobile app
</USER_TASK>
<USER_REQUEST>
I need to access the official React Native documentation for navigation patterns
</USER_REQUEST>
<OUTPUT>
{
  "response": "The official React Native documentation is an essential resource for implementing navigation patterns in your app. Since this is directly relevant to your development task, I'll grant you 35 minutes to study the documentation and implement the navigation patterns you need.",
  "decision": "GRANT",
  "durationMinutes": 35
}
</OUTPUT>
</EXAMPLE>
</EXAMPLES>`;

  const prompt = `User Task: ${userTask}

Previous Conversation:
${historyContext}

User's Request:
${message}
${grantsSection}
${pageContentSection}

Please evaluate this request using the structured reasoning process and provide a collaborative, educational response.`;

  try {
    const { object } = await generateObject({
      model,
      schema: ChatProcessResultSchema,
      prompt: `${systemPrompt}\n\n${examples}\n\n${prompt}`,
      temperature: 0.3, // Lower temperature for more consistent decisions
      mode: "json",
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
