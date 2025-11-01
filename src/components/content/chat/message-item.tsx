/**
 * Message item component for displaying individual chat messages.
 * This component renders user and assistant messages with avatars,
 * timestamps, and role-based styling following design patterns.
 */

import { generateAiAvatar, generateUserAvatar } from "~/lib/avatar";
import type { ChatMessage } from "~/lib/messaging";
import { cn } from "~/lib/utils";

/**
 * Props for MessageItem component
 */
interface MessageItemProps {
  /** The chat message to display */
  readonly message: ChatMessage;
}

/**
 * Formats a timestamp as a time string (HH:MM).
 *
 * @param timestamp - The timestamp in milliseconds to format
 * @returns A formatted time string in HH:MM format
 */
const formatTime = (timestamp: number) => {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
};

/**
 * Message item component for displaying individual chat messages.
 * Renders user and assistant messages with appropriate styling,
 * avatars, and timestamps. Responsive design with consistent spacing.
 *
 * @param props - Component props
 * @param props.message - The chat message to display
 * @returns A React element containing the message item
 */
export const MessageItem = ({ message }: MessageItemProps) => {
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
