/**
 * Chat provider for centralized state management.
 * This component manages chat state, message handling, and communication
 * with the AI service, providing context to child components.
 */

import { useMutation } from "@tanstack/react-query";
import {
  type ReactNode,
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useAccessState, useChatMessages } from "~/lib/chat";
import { useAutoScroll } from "~/lib/hooks";
import {
  type ChatMessage,
  type ChatResponse,
  Message,
  sendMessage,
} from "~/lib/messaging";

// Import AccessState type from hooks
type AccessState = ReturnType<typeof useAccessState>;

/**
 * Chat context interface for state management
 */
interface ChatContextType {
  /** Current chat messages */
  readonly messages: ChatMessage[];
  /** Whether a message is being processed */
  readonly isProcessing: boolean;
  /** Current access state */
  readonly accessState: AccessState;
  /** Current input message */
  readonly inputMessage: string;
  /** Function to set input message */
  readonly setInputMessage: (message: string) => void;
  /** Function to send a message */
  readonly sendMessage: (message: string) => void;
}

/**
 * Chat context for managing chat state
 */
const ChatContext = createContext<ChatContextType | null>(null);

/**
 * Hook to access chat context
 */
export const useChatContext = (): ChatContextType => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChatContext must be used within ChatProvider");
  }
  return context;
};

/**
 * Props for ChatProvider component
 */
interface ChatProviderProps {
  /** Optional initial message to send when component mounts */
  readonly initialMessage?: string;
  /** Optional initial AI message to display as the reason for blocking */
  readonly initialAiMessage?: string;
  /** Optional callback triggered when AI grants access for a duration */
  readonly onUnblock?: (durationMinutes: number) => void;
  /** Optional callback triggered when AI denies access with a reason */
  readonly onAccessDenied?: (reason: string) => void;
  /** React children */
  readonly children: ReactNode;
}

/**
 * Chat provider component for centralized state management.
 * Provides chat context to child components with message handling,
 * state management, and AI communication.
 *
 * @param props - Component props
 * @param props.initialMessage - Optional initial message to send automatically
 * @param props.onUnblock - Callback for when access is granted
 * @param props.onAccessDenied - Callback for when access is denied
 * @param props.children - React children to provide context to
 * @returns A React element containing the chat provider
 */
export const ChatProvider = ({
  initialMessage,
  initialAiMessage,
  onUnblock,
  onAccessDenied,
  children,
}: ChatProviderProps) => {
  const [inputMessage, setInputMessage] = useState("");
  const [sessionId] = useState(() => `session_${Date.now()}`);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Custom hooks for state management
  const accessState = useAccessState();

  const { messages, addMessage, addUserMessage } = useChatMessages({
    initialMessage,
    initialAiMessage,
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

  const handleSendMessage = async (message: string) => {
    if (!message.trim() || chatMutation.isPending || accessState.isGranted) {
      return;
    }

    const trimmedMessage = message.trim();
    setInputMessage("");
    addUserMessage(trimmedMessage);

    // Use the mutation to send the message
    await chatMutation.mutateAsync({ sessionId, message: trimmedMessage });
  };

  const contextValue: ChatContextType = {
    messages,
    isProcessing: chatMutation.isPending,
    accessState,
    inputMessage,
    setInputMessage,
    sendMessage: handleSendMessage,
  };

  return (
    <ChatContext.Provider value={contextValue}>{children}</ChatContext.Provider>
  );
};
