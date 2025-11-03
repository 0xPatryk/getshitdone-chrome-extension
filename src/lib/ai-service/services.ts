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

**EXCEPTIONS - NOT FAKE PRODUCTIVITY:**
- AI helper tools (ChatGPT, Gemini, Claude, Copilot) are task-enablers, not fake productivity
- Code assistants and development tools directly help with current work
- Notes sites provide essential technical information, to take notes
- Todo Lists

**KEY PRINCIPLE:** If content is about "being productive" rather than "doing the actual task," it's fake productivity. However, AI tools and helper applications actively assist with task completion.

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
- AI helper tools and LLM interfaces (ChatGPT, Claude, Gemini, Copilot, Bard, etc.)
- Code assistants and development helpers (GitHub Copilot, CodeWhisperer, Tabnine, etc.)
- Note Taking apps/Task Management (Clickup, Todo)
- Or similiar

These pages are essential infrastructure or productive helper tools that users cannot bypass and are never distractions, regardless of the user's task. AI tools specifically help users accomplish their tasks more efficiently.

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
<EXAMPLE>
<USER_TASK>
Create an n8n pipeline for outreach automation.
</USER_TASK>
<PAGE_CONTENT>
Google Gemini interface with chat input and conversation history. The page shows a conversational AI interface where users can ask questions and get AI-generated responses.
</PAGE_CONTENT>
<OUTPUT>
{
  "classification": "NEUTRAL",
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
  "classification": "NEUTRAL",
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
 * @returns Decision: BLOCK_ALL, REMOVE_ELEMENTS, or ALLOW
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
