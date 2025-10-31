import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useMutation } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { useAccessState, useChatMessages } from "~/lib/chat";
import { useAutoScroll } from "~/lib/hooks";
import { type ChatResponse, Message, sendMessage } from "~/lib/messaging";
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
      // Store this for later use in mutation
      return sendMessage(Message.SEND_CHAT_MESSAGE, {
        sessionId: sid,
        message: msg,
      });
    },
  });

  // Chat mutation for sending messages to AI
  const chatMutation = useMutation<
    ChatResponse,
    Error,
    { sessionId: string; message: string }
  >({
    mutationFn: async ({ sessionId, message }) => {
      const response = await sendMessage(Message.SEND_CHAT_MESSAGE, {
        sessionId,
        message,
      });
      return response;
    },
    onSuccess: (response) => {
      // Add AI response to messages
      addMessage(response.message);

      // Check for access granted
      if (response.accessGranted && response.durationMinutes) {
        const message = `Access granted for ${response.durationMinutes} minutes! Unblocking page...`;
        accessState.showGranted(message);
        setTimeout(() => {
          if (response.durationMinutes) {
            onUnblock?.(response.durationMinutes);
          }
        }, 2000);
      } else if (response.message.content) {
        // Extract reason from message
        accessState.showDenied(response.message.content, onAccessDenied);
      }
    },
    onError: (error) => {
      // Add specific error message based on the error type
      let errorMessageContent =
        "Sorry, I'm having trouble responding right now. Please try again.";

      if (error instanceof Error) {
        errorMessageContent = error.message;
      }

      const errorMessage = {
        content: errorMessageContent,
        role: "assistant" as const,
        id: `error_${Date.now()}`,
        timestamp: Date.now(),
      };
      addMessage(errorMessage);
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

  const handleSendMessage = async () => {
    if (
      !inputMessage.trim() ||
      chatMutation.isPending ||
      accessState.isGranted
    ) {
      return;
    }

    const message = inputMessage.trim();
    setInputMessage("");
    const userMessage = addUserMessage(message);

    // Use the mutation to send the message
    await chatMutation.mutateAsync({ sessionId, message });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const isInputDisabled = chatMutation.isPending || accessState.isGranted;

  return (
    <div className="flex flex-col h-full space-y-3">
      <ScrollArea ref={scrollAreaRef} className="flex-1 pr-3">
        <div className="space-y-3 pb-2">
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

      <div className="flex gap-2 pt-2 border-t border-border">
        <Input
          ref={inputRef}
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder="Explain why you need access..."
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
