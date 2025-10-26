/**
 * Chat message display component.
 * Renders a single chat message with appropriate styling based on role.
 */

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

  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[80%] rounded-lg px-4 py-2",
          isUser
            ? "bg-blue-500 text-white"
            : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100",
        )}
      >
        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        <p
          className={cn(
            "text-xs mt-1",
            isUser ? "text-blue-100" : "text-gray-500 dark:text-gray-400",
          )}
        >
          {formatTime(message.timestamp)}
        </p>
      </div>
    </div>
  );
};
