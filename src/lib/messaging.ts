import { defineExtensionMessaging } from "@webext-core/messaging";
import type { User } from "~/types";
import { z } from "zod";

export const Message = {
  USER: "user",
  ANALYZE_PAGE: "analyzePage",
  BLOCK_RESULT: "blockResult",
  UNBLOCK_REQUEST: "unblockRequest",
  UNBLOCK_RESPONSE: "unblockResponse",
} as const;

export type Message = (typeof Message)[keyof typeof Message];

// Zod schemas for type safety
export const AnalysisResultSchema = z.object({
  decision: z.enum(["BLOCK_ALL", "REMOVE_ELEMENTS", "ALLOW"]),
  reason: z.string(),
  selectors: z.array(z.string()).optional(),
});

export const UnblockRequestSchema = z.object({
  justification: z.string(),
  originalReason: z.string(),
  taskId: z.number(),
});

export const UnblockResponseSchema = z.object({
  decision: z.enum(["ALLOW", "DENY"]),
  reason: z.string(),
});

export type AnalysisResult = z.infer<typeof AnalysisResultSchema>;
export type UnblockRequest = z.infer<typeof UnblockRequestSchema>;
export type UnblockResponse = z.infer<typeof UnblockResponseSchema>;

interface Messages {
  [Message.USER]: () => User | null;
  [Message.ANALYZE_PAGE]: (data: { url: string; content: string }) => AnalysisResult;
  [Message.BLOCK_RESULT]: (data: AnalysisResult) => void;
  [Message.UNBLOCK_REQUEST]: (data: UnblockRequest) => UnblockResponse;
  [Message.UNBLOCK_RESPONSE]: (data: UnblockResponse) => void;
}

export const { sendMessage, onMessage } = defineExtensionMessaging<Messages>();
