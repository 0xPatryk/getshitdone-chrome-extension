import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateObject } from "ai";
import {
  type AnalysisResult,
  AnalysisResultSchema,
  type UnblockRequest,
  type UnblockResponse,
  UnblockResponseSchema,
} from "~/lib/messaging";

let googleProvider: ReturnType<typeof createGoogleGenerativeAI> | null = null;

const getGoogleProvider = (apiKey: string) => {
  if (!googleProvider) {
    googleProvider = createGoogleGenerativeAI({ apiKey });
  }
  return googleProvider;
};

export const analyzePageContent = async (
  apiKey: string,
  userTask: string,
  pageContent: string,
  url: string,
): Promise<AnalysisResult> => {
  const google = getGoogleProvider(apiKey);

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
      model: google("gemini-2.5-flash-lite"),
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
): Promise<UnblockResponse> => {
  const google = getGoogleProvider(apiKey);

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
      model: google("gemini-2.5-flash-lite"),
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
