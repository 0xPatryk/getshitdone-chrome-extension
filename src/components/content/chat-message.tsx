/**
 * Chat message display component.
 * Renders a single chat message with appropriate styling based on role.
 */

import { generateAiAvatar, generateUserAvatar } from "~/lib/avatar";
import type { ChatMessage as ChatMessageType } from "~/lib/messaging";
import { cn } from "~/lib/utils";

/**
 * Props for the ChatMessage component.
 */
interface ChatMessageProps {
  /** The chat message to display, including content, role, and timestamp */
  readonly message: ChatMessageType;
}

/**
 * Formats a timestamp as a time string (HH:MM).
 *
 * @param timestamp - The timestamp in milliseconds to format
 * @returns A formatted time string in HH:MM format
 *
 * @example
 * ```typescript
 * const timeString = formatTime(Date.now());
 * console.log(timeString); // "14:30"
 * ```
 */
const formatTime = (timestamp: number) => {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
};

/**
 * Displays a single chat message with role-based styling.
 *
 * This component renders chat messages with different styling based on the sender's role:
 * - User messages: Blue background, right-aligned
 * - Assistant messages: Gray background, left-aligned
 *
 * Each message displays the content and a timestamp.
 *
 * @param props - The component props
 * @param props.message - The chat message to display
 *
 * @example
 * ```typescript
 * const message: ChatMessage = {
 *   id: "msg_1",
 *   content: "Hello, how can I help you?",
 *   role: "assistant",
 *   timestamp: Date.now()
 * };
 *
 * <ChatMessage message={message} />
 * ```
 */
export const ChatMessage = ({ message }: ChatMessageProps) => {
  const isUser = message.role === "user";
  const avatarSrc = isUser ? generateUserAvatar() : generateAiAvatar();

  return (
    <div className={cn("flex gap-3", isUser ? "justify-end" : "justify-start")}>
      {!isUser && (
        <div className="flex-shrink-0">
          <img
            src={avatarSrc}
            alt="AI Assistant"
            className="w-8 h-8 rounded-full"
          />
        </div>
      )}
      <div
        className={cn(
          "max-w-[80%] rounded-lg px-4 py-2",
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-muted-foreground",
        )}
      >
        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        <p
          className={cn(
            "text-xs mt-1",
            isUser ? "text-primary-foreground/70" : "text-muted-foreground/70",
          )}
        >
          {formatTime(message.timestamp)}
        </p>
      </div>
      {isUser && (
        <div className="flex-shrink-0">
          <img src={avatarSrc} alt="User" className="w-8 h-8 rounded-full" />
        </div>
      )}
    </div>
  );
};
