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
    <div
      className={cn(
        "flex gap-2 sm:gap-3 w-full",
        isUser ? "justify-end" : "justify-start",
      )}
    >
      {!isUser && (
        <img
          src={avatarSrc}
          alt="AI Assistant"
          className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex-shrink-0 mt-1"
        />
      )}
      <div
        className={cn(
          "max-w-[70%] sm:max-w-[75%] lg:max-w-[80%] rounded-2xl sm:rounded-3xl px-4 py-2 sm:px-5 sm:py-3 shadow-sm",
          isUser
            ? "bg-primary text-primary-foreground rounded-br-sm"
            : "bg-muted text-muted-foreground rounded-bl-sm",
        )}
      >
        <p
          className={cn(
            "text-sm sm:text-base whitespace-pre-wrap break-words leading-relaxed",
            isUser ? "text-primary-foreground" : "text-foreground",
          )}
        >
          {message.content}
        </p>
        <p
          className={cn(
            "text-xs mt-1 opacity-70",
            isUser ? "text-primary-foreground/70" : "text-muted-foreground",
          )}
        >
          {formatTime(message.timestamp)}
        </p>
      </div>
      {isUser && (
        <img
          src={avatarSrc}
          alt="You"
          className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex-shrink-0 mt-1"
        />
      )}
    </div>
  );
};
