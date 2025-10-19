import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";
import { generateObject, generateText } from "ai";
import {
  type AnalysisResult,
  AnalysisResultSchema,
  type ChatMessage,
  type UnblockRequest,
  type UnblockResponse,
  UnblockResponseSchema,
} from "~/lib/messaging";

type AIProvider = "gemini" | "openai";

let googleProvider: ReturnType<typeof createGoogleGenerativeAI> | null = null;
let openaiProvider: ReturnType<typeof createOpenAI> | null = null;

const getGoogleProvider = (apiKey: string) => {
  if (!googleProvider) {
    googleProvider = createGoogleGenerativeAI({ apiKey });
  }
  return googleProvider;
};

const getOpenAIProvider = (apiKey: string) => {
  if (!openaiProvider) {
    openaiProvider = createOpenAI({ apiKey });
  }
  return openaiProvider;
};

const getModel = (provider: AIProvider, apiKey: string) => {
  switch (provider) {
    case "gemini":
      return getGoogleProvider(apiKey)("gemini-2.5-flash-lite");
    case "openai":
      return getOpenAIProvider(apiKey)("gpt-4o-mini");
    default:
      throw new Error(`Unsupported provider: ${provider}`);
  }
};

export const analyzePageContent = async (
  apiKey: string,
  userTask: string,
  pageContent: string,
  url: string,
  provider: AIProvider = "gemini",
): Promise<AnalysisResult> => {
  const model = getModel(provider, apiKey);

  const prompt = `You are an AI assistant that helps users stay focused on their tasks.

User's current task: "${userTask}"

Current page content: "${pageContent.substring(0, 8000)}"

Page URL: "${url}"

Analyze whether this page content is relevant to the user's task or if it's likely to be a distraction. Consider:
1. Is the content directly related to completing the task?
2. Is this a productivity tool or resource that supports the task?
3. Is this entertainment, social media, news, or other potential distractions?
4. Does the content contain elements that could break focus?

Respond with a decision and appropriate action:
- BLOCK_ALL: The entire page should be blocked (e.g., social media, entertainment, news)
- REMOVE_ELEMENTS: Remove specific distracting elements (e.g., ads, recommendations, sidebars)
- ALLOW: The page is relevant to the task

If removing elements, provide CSS selectors for the distracting elements.`;

  try {
    const { object } = await generateObject({
      model,
      schema: AnalysisResultSchema,
      prompt,
      temperature: 0.1,
      mode: "json",
    });

    return object;
  } catch (error) {
    console.error("AI analysis failed:", error);
    // Fallback to allow if AI fails
    return {
      decision: "ALLOW",
      reason: "AI analysis failed - allowing access",
    };
  }
};

export const processUnblockRequest = async (
  apiKey: string,
  userTask: string,
  request: UnblockRequest,
  provider: AIProvider = "gemini",
): Promise<UnblockResponse> => {
  const model = getModel(provider, apiKey);

  const prompt = `User is requesting access to a blocked page. Evaluate if their justification is valid.

User's current task: "${userTask}"
Original reason for blocking: "${request.originalReason}"
User's justification for access: "${request.justification}"

Consider:
1. Does the justification show legitimate need related to their task?
2. Is this a reasonable exception or just procrastination?
3. Would allowing access support or hinder their productivity?

Decide whether to ALLOW or DENY access and provide a brief reason.`;

  try {
    const { object } = await generateObject({
      model,
      schema: UnblockResponseSchema,
      prompt,
      temperature: 0.2,
      mode: "json",
    });

    return object;
  } catch (error) {
    console.error("Unblock request processing failed:", error);
    // Fallback to deny if AI fails
    return {
      decision: "DENY",
      reason: "Unable to process request - please try again",
    };
  }
};

export const processChatMessage = async (
  apiKey: string,
  userTask: string,
  message: string,
  chatHistory: ChatMessage[],
  provider: AIProvider = "gemini",
): Promise<ChatMessage> => {
  const model = getModel(provider, apiKey);

  // Build conversation history for context
  const historyContext = chatHistory
    .slice(-5) // Keep last 5 messages for context
    .map((msg) => `${msg.role}: ${msg.content}`)
    .join("\n");

  const prompt = `You are a focused, professional AI assistant that helps users stay on task and maintain productivity. Your role is to:

1. Understand the user's current task: "${userTask}"
2. Evaluate whether their request aligns with their task
3. Be professional, focused, and encouraging
4. Grant access if they provide a good justification
5. Deny access if the request is clearly not related to their task or is a distraction
6. Suggest alternatives if access isn't appropriate
7. Keep responses concise and actionable

Previous conversation:
${historyContext}

User's new message: "${message}"

Respond in a professional, focused manner.
- If you decide to grant access, include "ACCESS_GRANTED" in your response.
- If you decide to deny access, include "ACCESS_DENIED: [reason]" in your response, where [reason] is a brief explanation.
- If you want to suggest alternatives, be specific about what they should do instead.`;

  try {
    const { text } = await generateText({
      model,
      prompt,
      temperature: 0.3,
    });

    return {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      content: text.trim(),
      role: "assistant",
      timestamp: Date.now(),
    };
  } catch (error) {
    console.error("Chat message processing failed:", error);
    // Fallback response
    return {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      content:
        "I'm having trouble processing your request right now. Please try again.",
      role: "assistant",
      timestamp: Date.now(),
    };
  }
};

// Utility function to extract main text content from a page
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
