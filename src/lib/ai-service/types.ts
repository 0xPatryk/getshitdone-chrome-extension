/**
 * AI Service Types
 *
 * This module contains type definitions for the AI service domain.
 * It defines the supported AI providers and related type structures.
 *
 * @module ai-service/types
 */

import { z } from "zod";

/**
 * Supported AI providers for content analysis and chat functionality.
 * @typedef {"gemini" | "openai"} AIProvider
 */
export type AIProvider = "gemini" | "openai";

/**
 * Schema for AI chat decision responses
 * Defines the structure for AI decisions about granting or denying access to content
 */
export const ChatDecisionSchema = z.object({
  decision: z
    .enum(["GRANT_ACCESS", "DENY_ACCESS"])
    .describe("Whether to grant or deny access to the requested content"),
  response: z
    .string()
    .describe("The AI's response message to the user explaining the decision"),
  durationMinutes: z
    .number()
    .min(1)
    .max(120)
    .optional()
    .describe("Duration in minutes if access is granted (1-120)"),
});
