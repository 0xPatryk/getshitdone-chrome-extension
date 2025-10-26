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
import { useMutation } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";
import type { ChatMessage, ChatResponse } from "~/lib/messaging";

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
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isAccessGranted, setIsAccessGranted] = useState(false);
  const [isAccessDenied, setIsAccessDenied] = useState(false);
  const [accessMessage, setAccessMessage] = useState("");

  // Local state for chat messages - avoids storage watcher issues
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sessionId] = useState(() => `session_${Date.now()}`);
  const [isInitialized, setIsInitialized] = useState(false);

  // Mutation for sending chat messages
  const chatMutation = useMutation<
    ChatResponse,
    Error,
    { sessionId: string; message: string }
  >({
    mutationFn: async ({
      sessionId,
      message,
    }: { sessionId: string; message: string }) => {
      console.log(
        "[DEBUG] ChatInterface: Attempting to send message, sessionId:",
        sessionId,
      );

      const windowWithChat = window as Window & {
        sendChatMessage?: (
          sessionId: string,
          message: string,
        ) => Promise<ChatResponse>;
      };

      console.log(
        "[DEBUG] ChatInterface: window.sendChatMessage available:",
        !!windowWithChat.sendChatMessage,
      );
      console.log(
        "[DEBUG] ChatInterface: Window object keys:",
        Object.keys(window).filter((key) => key.includes("chat")),
      );

      if (!windowWithChat.sendChatMessage) {
        console.error(
          "[DEBUG] ChatInterface: Chat function not available - this might be the root cause",
        );
        console.error("[DEBUG] ChatInterface: Current window properties:", {
          hasSendChatMessage: "sendChatMessage" in window,
          isInitialized,
          hasInitialMessage: !!initialMessage,
        });
        throw new Error("Chat function not available");
      }

      return await windowWithChat.sendChatMessage(sessionId, message);
    },
    onMutate: (variables) => {
      console.log(
        "[DEBUG] ChatInterface: Mutation starting with variables:",
        variables,
      );
    },
    onSettled: (data, error, variables) => {
      console.log("[DEBUG] ChatInterface: Mutation settled:", {
        data,
        error: error?.message,
        variables,
      });
    },
    onSuccess: (response) => {
      console.log("[DEBUG] Chat response received:", response);

      // Add AI response to local state
      setMessages((prev) => [...prev, response.message]);

      // Check if AI granted access with duration
      // Type assertion to handle optional properties
      const chatResponse = response as ChatResponse & {
        accessGranted?: boolean;
        durationMinutes?: number;
      };

      const accessGranted = chatResponse.accessGranted || false;
      const durationMinutes = chatResponse.durationMinutes;

      if (accessGranted && durationMinutes !== undefined && onUnblock) {
        setIsAccessGranted(true);
        setAccessMessage(
          `Access granted for ${durationMinutes} minutes! Unblocking page...`,
        );
        setTimeout(() => {
          onUnblock(durationMinutes);
        }, 2000);
      } else if (
        response.message.content.includes("ACCESS_DENIED") &&
        onAccessDenied
      ) {
        // Extract the reason from the message (everything after "ACCESS_DENIED")
        const reasonMatch = response.message.content.match(
          /ACCESS_DENIED:? *(.*)/,
        );
        const reason =
          reasonMatch?.[1]?.trim() || "Access denied by AI assistant";

        // Show the access denied message temporarily but don't permanently disable the input
        setAccessMessage(reason);
        setIsAccessDenied(true);

        // Reset the access denied state after showing the message
        setTimeout(() => {
          setIsAccessDenied(false);
          setAccessMessage("");
          onAccessDenied(reason);
        }, 3000);
      }
    },
    onError: (error, variables) => {
      console.error("Failed to send message:", {
        error: error instanceof Error ? error.message : String(error),
        sessionId: variables?.sessionId,
        timestamp: new Date().toISOString()
      });
      setMessages((prev) => [
        ...prev,
        {
          content:
            "Sorry, I'm having trouble responding right now. Please try again.",
          role: "assistant",
          id: `error_${Date.now()}`,
          timestamp: Date.now(),
        },
      ]);
      // Reset access denied state on error to allow retry
      setIsAccessDenied(false);
      setAccessMessage("");
    },
  });


  // Function to send message to AI
  const sendRealMessage = useCallback(
    (sessionId: string, message: string) => {
      chatMutation.mutate({ sessionId, message });
    },
    [chatMutation],
  );

  // Initialize with initial message if provided
  useEffect(() => {
    if (!isInitialized && initialMessage) {
      const userMessage: ChatMessage = {
        id: `user_${Date.now()}`,
        content: initialMessage,
        role: "user",
        timestamp: Date.now(),
      };
      setMessages([userMessage]);
      setIsInitialized(true);
      // Send to AI for real response
      sendRealMessage(sessionId, initialMessage);
    }
  }, [initialMessage, isInitialized, sessionId, sendRealMessage]);

  // Auto-scroll to bottom when new messages arrive
  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector(
        "[data-radix-scroll-area-viewport]",
      ) as HTMLElement;
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  }, [messages, chatMutation.isPending]);

  // Focus input when component mounts and when not disabled
  useEffect(() => {
    if (inputRef.current && !chatMutation.isPending && !isAccessGranted) {
      inputRef.current.focus();
    }
  }, [chatMutation.isPending, isAccessGranted]);

  const handleSendMessage = () => {
    if (!inputMessage.trim() || chatMutation.isPending || isAccessGranted)
      return;

    const message = inputMessage.trim();
    setInputMessage("");

    // Add user message to local state
    const userMessage: ChatMessage = {
      id: `user_${Date.now()}`,
      content: message,
      role: "user",
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, userMessage]);

    // Send to AI
    sendRealMessage(sessionId, message);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      <ScrollArea ref={scrollAreaRef} className="flex-1 pr-4">
        <div className="space-y-4">
          {messages.map((message: ChatMessage) => (
            <div
              key={message.id}
              className={`flex ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-4 py-2 ${
                  message.role === "user"
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                <p
                  className={`text-xs mt-1 ${
                    message.role === "user"
                      ? "text-blue-100"
                      : "text-gray-500 dark:text-gray-400"
                  }`}
                >
                  {formatTime(message.timestamp)}
                </p>
              </div>
            </div>
          ))}
          {chatMutation.isPending && (
            <div className="flex justify-start">
              <div className="bg-gray-100 dark:bg-gray-800 rounded-lg px-4 py-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-75" />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-150" />
                </div>
              </div>
            </div>
          )}
          {(isAccessGranted || isAccessDenied) && (
            <div
              className={`flex justify-center ${isAccessGranted ? "text-green-600" : "text-red-600"}`}
            >
              <div
                className={`rounded-lg px-4 py-2 text-center ${
                  isAccessGranted
                    ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
                    : "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
                }`}
              >
                <p className="text-sm font-medium">{accessMessage}</p>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="flex gap-2">
        <Input
          ref={inputRef}
          value={inputMessage}
          onChange={(e) => {
            setInputMessage(e.target.value);
          }}
          onKeyDown={(e) => {
            handleKeyPress(e);
          }}
          placeholder="Type your message..."
          disabled={chatMutation.isPending || isAccessGranted}
          className="flex-1"
        />
        <Button
          onClick={handleSendMessage}
          disabled={
            !inputMessage.trim() || chatMutation.isPending || isAccessGranted
          }
          size="sm"
        >
          Send
        </Button>
      </div>
    </div>
  );
};
