import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";
import { generateObject, generateText } from "ai";
import {
  type AnalysisResult,
  AnalysisResultSchema,
  type ChatMessage,
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
  alwaysRemove?: string | null,
): Promise<AnalysisResult> => {
  const model = getModel(provider, apiKey);

  const alwaysRemoveSection = alwaysRemove
    ? `\n\nALWAYS REMOVE ELEMENTS:\nThe user has specified these elements that should ALWAYS be removed regardless of task relevance:\n"${alwaysRemove}"\n\nYou MUST include CSS selectors for these always remove elements in your response if they exist on the page, even if the page is otherwise relevant to the task.`
    : "";

  const prompt = `You are an AI assistant that helps users stay focused on their tasks.

User's current task: "${userTask}"

Current page content: "${pageContent.substring(0, 8000)}"

Page URL: "${url}"${alwaysRemoveSection}

Analyze whether this page content is relevant to the user's task or if it's likely to be a distraction. Consider:

PRIMARY ASSESSMENT:
1. Is the content directly related to completing the task?
2. Is this a productivity tool or resource that supports the task?
3. Is this entertainment, social media, news, or other potential distractions?
4. Does the content contain elements that could break focus?

CRITICAL PAGES THAT MUST ALWAYS BE ALLOWED:
5. Authentication pages: Login, register, sign-in forms, password reset, or any authentication mechanism
6. Verification pages: CAPTCHA (reCAPTCHA, hCaptcha, Turnstile), 2FA, security checks, email verification, phone verification
7. Gateway pages: Loading screens, "click to continue", age verification, cookie consent, or any required intermediate step
8. Account management: Profile settings, account recovery, subscription management, billing pages

URL PATTERNS TO ALWAYS ALLOW:
- Contains: captcha, recaptcha, hcaptcha, verify, verification, auth, authenticate, login, signin, register, signup, 2fa, mfa, otp, password, reset, recovery
- Contains: confirm, validation, security, check, challenge, prove, human, robot, bot
- Contains: consent, cookie, terms, privacy, age, gate, access, allow
- Contains: billing, payment, subscription, account, profile, settings

CONTENT INDICATORS TO ALWAYS ALLOW:
- CAPTCHA challenges: "I'm not a robot", "select all images with", "verify you are human"
- Authentication forms: Email/password fields, "sign in", "log in", "create account"
- Verification codes: "enter code", "verification code", "one-time password", "OTP"
- Security prompts: "two-factor authentication", "security check", "verify identity"
- Required steps: "continue to site", "proceed", "accept terms", "enable cookies"

DECISION RULES:
- If the page contains ANY authentication or verification elements, ALWAYS ALLOW regardless of task relevance
- If the URL contains authentication/verification patterns, ALWAYS ALLOW
- If the page is a required intermediate step to access content, ALWAYS ALLOW
- If you're UNCERTAIN about the page's purpose, DEFAULT TO ALLOW
- Only block if you're CERTAIN the page is a distraction with no legitimate purpose

For critical pages:
- ALLOW immediately without requiring task relevance
- Do not remove elements from authentication/verification pages
- Consider these pages as prerequisites for accessing task-relevant content
- Even minimal content pages with security features should be allowed

Respond with a decision and appropriate action:
- BLOCK_ALL: The entire page should be blocked (e.g., social media, entertainment, news)
- REMOVE_ELEMENTS: Remove specific distracting elements (e.g., ads, recommendations, sidebars)
- ALLOW: The page is relevant to the task or is a necessary intermediate step

If removing elements, provide CSS selectors for BOTH:
1. Any distracting elements you identify based on the task analysis
2. Any elements that match the "always remove" criteria specified above

The always remove elements should be included in your selectors list regardless of the main decision.

IMPORTANT: When in doubt, ALLOW the page. It's better to let a distraction through than to block a legitimate authentication or verification page.`;

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
- If you decide to grant access, you MUST specify the duration in minutes. Use the format: "ACCESS_GRANTED: [duration]" where [duration] is the number of minutes (e.g., "ACCESS_GRANTED: 15" for 15 minutes, "ACCESS_GRANTED: 30" for 30 minutes, "ACCESS_GRANTED: 60" for 1 hour).
- The duration should be reasonable based on their justification (typically 5-60 minutes).
- If you decide to deny access, include "ACCESS_DENIED: [reason]" in your response, where [reason] is a brief explanation.
- If you want to suggest alternatives, be specific about what they should do instead.

IMPORTANT: When granting access, you MUST include the duration number after "ACCESS_GRANTED:" (e.g., "ACCESS_GRANTED: 20").`;

  try {
    const { text } = await generateText({
      model,
      prompt,
      temperature: 0.3,
    });

    const content = text.trim();

    // Parse ACCESS_GRANTED with duration
    const grantedMatch = content.match(/ACCESS_GRANTED:\s*(\d+)/);
    const accessGranted = grantedMatch !== null;
    const durationMinutes = grantedMatch?.[1]
      ? Number.parseInt(grantedMatch[1], 10)
      : undefined;

    return {
      message: {
        id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        content,
        role: "assistant",
        timestamp: Date.now(),
      },
      accessGranted,
      durationMinutes,
    };
  } catch (error) {
    console.error("Chat message processing failed:", error);
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
