/**
 * Full-screen chat container component for the main chat interface.
 * This component provides a full-screen layout with responsive design
 * following popup component patterns and using Radix UI components.
 */

import { Card } from "@/components/ui/card";
import { ChatHeader } from "./chat-header";
import { ChatInputForm } from "./chat-input-form";
import { ChatMessagesList } from "./chat-messages-list";
import { ChatProvider } from "./chat-provider";

/**
 * Props for FullScreenChatContainer component
 */
interface FullScreenChatContainerProps {
  /** Optional initial message to send when component mounts */
  readonly initialMessage?: string;
  /** Optional initial AI message to display as the reason for blocking */
  readonly initialAiMessage?: string;
  /** Optional callback triggered when AI grants access for a duration */
  readonly onUnblock?: (durationMinutes: number) => void;
  /** Optional callback triggered when AI denies access with a reason */
  readonly onAccessDenied?: (reason: string) => void;
}

/**
 * Full-screen chat container component.
 * Provides a full-screen layout with responsive design and centered content.
 * Follows popup component patterns with consistent spacing and styling.
 *
 * @param props - Component props
 * @param props.initialMessage - Optional initial message to send automatically
 * @param props.onUnblock - Callback for when access is granted
 * @param props.onAccessDenied - Callback for when access is denied
 * @returns A React element containing the full-screen chat container
 */
export const FullScreenChatContainer = ({
  initialMessage,
  initialAiMessage,
  onUnblock,
  onAccessDenied,
}: FullScreenChatContainerProps) => {
  return (
    <ChatProvider
      initialMessage={initialMessage}
      initialAiMessage={initialAiMessage}
      onUnblock={onUnblock}
      onAccessDenied={onAccessDenied}
    >
      <div className="h-full w-full flex items-center justify-center p-4 overflow-hidden">
        <Card className="flex flex-col w-full max-w-2xl h-[80vh] sm:h-[85vh] rounded-2xl shadow-lg border bg-background/95 backdrop-blur-sm min-h-0">
          <ChatHeader />
          <ChatMessagesList />
          <ChatInputForm />
        </Card>
      </div>
    </ChatProvider>
  );
};
