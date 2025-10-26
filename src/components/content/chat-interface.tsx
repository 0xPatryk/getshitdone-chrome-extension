/**
 * Chat interface component for communicating with AI assistant.
 * This component provides a chat UI that allows users to interact with an AI
 * assistant to request access to blocked pages. It handles message sending,
 * displays conversation history, and processes AI responses that may grant
 * temporary access or deny requests.
 */

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useEffect, useRef, useState } from "react";
import { useAccessState, useChatMessages, useChatMutation } from "~/lib/chat";
import { useAutoScroll } from "~/lib/hooks";
import { ChatAccessStatus } from "./chat-access-status";
import { ChatLoadingIndicator } from "./chat-loading-indicator";
import { ChatMessage } from "./chat-message";

/**
 * Props for the ChatInterface component
 */
interface ChatInterfaceProps {
  /** Optional initial message to send when component mounts */
  readonly initialMessage?: string;
  /** Optional callback triggered when AI grants access for a duration */
  readonly onUnblock?: (durationMinutes: number) => void;
  /** Optional callback triggered when AI denies access with a reason */
  readonly onAccessDenied?: (reason: string) => void;
}

/**
 * Chat interface component for interacting with AI assistant.
 * Provides a full-featured chat UI with message history, input handling,
 * and special processing for AI responses that can grant or deny access
 * to blocked pages. Handles loading states, auto-scrolling, and various
 * response types including access grants with time limits.
 *
 * @example
 * ```tsx
 * <ChatInterface
 *   initialMessage="I need access to this page for research"
 *   onUnblock={(minutes) => console.log(`Access granted for ${minutes} minutes`)}
 *   onAccessDenied={(reason) => console.log(`Access denied: ${reason}`)}
 * />
 * ```
 *
 * @param props - Component props
 * @param props.initialMessage - Optional initial message to send automatically
 * @param props.onUnblock - Callback for when access is granted
 * @param props.onAccessDenied - Callback for when access is denied
 * @returns A React element containing the chat interface
 */
export const ChatInterface = ({
  initialMessage,
  onUnblock,
  onAccessDenied,
}: ChatInterfaceProps) => {
  const [inputMessage, setInputMessage] = useState("");
  const [sessionId] = useState(() => `session_${Date.now()}`);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Custom hooks for state management
  const accessState = useAccessState();

  const { messages, addMessage, addUserMessage } = useChatMessages({
    initialMessage,
    sessionId,
    onInitialized: (sid, msg) => {
      chatMutation.sendMessage(sid, msg);
    },
  });

  const chatMutation = useChatMutation({
    onMessageReceived: addMessage,
    onAccessGranted: (durationMinutes, message) => {
      accessState.showGranted(message);
      setTimeout(() => {
        onUnblock?.(durationMinutes);
      }, 2000);
    },
    onAccessDenied: (reason) => {
      accessState.showDenied(reason, onAccessDenied);
    },
  });

  // Auto-scroll when messages change
  useAutoScroll(scrollAreaRef, [messages, chatMutation.isPending]);

  // Focus input when not disabled
  useEffect(() => {
    if (inputRef.current && !chatMutation.isPending && !accessState.isGranted) {
      inputRef.current.focus();
    }
  }, [chatMutation.isPending, accessState.isGranted]);

  const handleSendMessage = () => {
    if (
      !inputMessage.trim() ||
      chatMutation.isPending ||
      accessState.isGranted
    ) {
      return;
    }

    const message = inputMessage.trim();
    setInputMessage("");
    addUserMessage(message);
    chatMutation.sendMessage(sessionId, message);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const isInputDisabled = chatMutation.isPending || accessState.isGranted;

  return (
    <div className="flex flex-col h-full space-y-4">
      <ScrollArea ref={scrollAreaRef} className="flex-1 pr-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))}

          {chatMutation.isPending && <ChatLoadingIndicator />}

          {(accessState.isGranted || accessState.isDenied) && (
            <ChatAccessStatus
              isGranted={accessState.isGranted}
              message={accessState.message}
            />
          )}
        </div>
      </ScrollArea>

      <div className="flex gap-2">
        <Input
          ref={inputRef}
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder="Type your message..."
          disabled={isInputDisabled}
          className="flex-1"
        />
        <Button
          onClick={handleSendMessage}
          disabled={!inputMessage.trim() || isInputDisabled}
          size="sm"
        >
          Send
        </Button>
      </div>
    </div>
  );
};
