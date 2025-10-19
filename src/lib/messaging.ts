import { defineExtensionMessaging } from "@webext-core/messaging";
import { z } from "zod";
import type { User } from "~/types";

export const Message = {
  USER: "user",
  ANALYZE_PAGE: "analyzePage",
  BLOCK_RESULT: "blockResult",
  UNBLOCK_REQUEST: "unblockRequest",
  UNBLOCK_RESPONSE: "unblockResponse",
  SEND_CHAT_MESSAGE: "sendChatMessage",
  CHAT_RESPONSE: "chatResponse",
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

export const ChatMessageSchema = z.object({
  id: z.string(),
  content: z.string(),
  role: z.enum(["user", "assistant"]),
  timestamp: z.number(),
});

export const ChatSessionSchema = z.object({
  id: z.string(),
  messages: z.array(ChatMessageSchema),
  createdAt: z.number(),
  status: z.enum(["active", "completed"]),
});

export const SendChatMessageSchema = z.object({
  sessionId: z.string(),
  message: z.string(),
});

export const ChatResponseSchema = z.object({
  sessionId: z.string(),
  message: ChatMessageSchema,
});

export type AnalysisResult = z.infer<typeof AnalysisResultSchema>;
export type UnblockRequest = z.infer<typeof UnblockRequestSchema>;
export type UnblockResponse = z.infer<typeof UnblockResponseSchema>;
export type ChatMessage = z.infer<typeof ChatMessageSchema>;
export type ChatSession = z.infer<typeof ChatSessionSchema>;
export type SendChatMessage = z.infer<typeof SendChatMessageSchema>;
export type ChatResponse = z.infer<typeof ChatResponseSchema>;

interface Messages {
  [Message.USER]: () => User | null;
  [Message.ANALYZE_PAGE]: (data: {
    url: string;
    content: string;
  }) => AnalysisResult;
  [Message.BLOCK_RESULT]: (data: AnalysisResult) => void;
  [Message.UNBLOCK_REQUEST]: (data: UnblockRequest) => UnblockResponse;
  [Message.UNBLOCK_RESPONSE]: (data: UnblockResponse) => void;
  [Message.SEND_CHAT_MESSAGE]: (data: SendChatMessage) => ChatResponse;
  [Message.CHAT_RESPONSE]: (data: ChatResponse) => void;
}

export const { sendMessage, onMessage } = defineExtensionMessaging<Messages>();
