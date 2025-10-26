/**
 * Chat Hooks Module
 *
 * This module provides React hooks specific to chat functionality in the focus extension.
 * These hooks handle chat message state, mutations with AI integration, and access state management.
 *
 * Key features:
 * - Chat message state management
 * - Chat mutations with AI integration
 * - Access state management
 * - Initial message handling
 *
 * @module chat/hooks
 */

import { useMutation } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";
import type { ChatResponse } from "~/lib/messaging";
import type { ChatMessage } from "./types";

/**
 * Options for the useChatMessages hook.
 */
interface UseChatMessagesOptions {
  /** Optional initial message to send when the hook initializes */
  readonly initialMessage?: string;
  /** Unique session identifier for the chat session */
  readonly sessionId: string;
  /** Callback function called when the initial message is sent */
  readonly onInitialized?: (sessionId: string, message: string) => void;
}

/**
 * Manages chat messages state with support for initial message.
 *
 * This hook provides state management for chat messages, including the ability
 * to add new messages and handle an initial message when the component mounts.
 * It automatically creates and sends an initial message if one is provided.
 *
 * @param options - Configuration options for the hook
 * @param options.initialMessage - Optional initial message to send when the hook initializes
 * @param options.sessionId - Unique session identifier for the chat session
 * @param options.onInitialized - Callback function called when the initial message is sent
 *
 * @returns An object containing:
 * - `messages`: Array of chat messages in the current session
 * - `addMessage`: Function to add a new message to the chat
 * - `addUserMessage`: Function to add a new user message to the chat
 *
 * @example
 * ```typescript
 * const { messages, addMessage, addUserMessage } = useChatMessages({
 *   initialMessage: "Hello, I need help with focus",
 *   sessionId: "session_123",
 *   onInitialized: (sessionId, message) => {
 *     console.log(`Chat initialized with message: ${message}`);
 *   }
 * });
 *
 * // Add a new user message
 * const userMessage = addUserMessage("Can you help me stay focused?");
 *
 * // Add any message (e.g., assistant response)
 * addMessage({
 *   id: "assistant_1",
 *   content: "I'll help you stay focused!",
 *   role: "assistant",
 *   timestamp: Date.now()
 * });
 * ```
 */
export const useChatMessages = ({
  initialMessage,
  sessionId,
  onInitialized,
}: UseChatMessagesOptions) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

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
      onInitialized?.(sessionId, initialMessage);
    }
  }, [initialMessage, isInitialized, sessionId, onInitialized]);

  const addMessage = useCallback((message: ChatMessage) => {
    setMessages((prev) => [...prev, message]);
  }, []);

  const addUserMessage = useCallback((content: string) => {
    const message: ChatMessage = {
      id: `user_${Date.now()}`,
      content,
      role: "user",
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, message]);
    return message;
  }, []);

  return {
    messages,
    addMessage,
    addUserMessage,
  };
};

/**
 * Options for the useChatMutation hook.
 */
interface UseChatMutationOptions {
  /** Callback function called when a message is received from the AI */
  readonly onMessageReceived?: (message: ChatMessage) => void;
  /** Callback function called when access is granted by the AI */
  readonly onAccessGranted?: (durationMinutes: number, message: string) => void;
  /** Callback function called when access is denied by the AI */
  readonly onAccessDenied?: (reason: string) => void;
}

/**
 * Manages chat message mutations with TanStack Query.
 *
 * This hook handles sending messages to the AI assistant and processing the responses.
 * It manages the mutation state, handles different types of responses (regular messages,
 * access granted, access denied), and provides error handling.
 *
 * The hook integrates with the global window.sendChatMessage function to communicate
 * with the AI service and parses responses to determine the appropriate action.
 *
 * @param options - Configuration options for the hook
 * @param options.onMessageReceived - Callback function called when a message is received from the AI
 * @param options.onAccessGranted - Callback function called when access is granted by the AI
 * @param options.onAccessDenied - Callback function called when access is denied by the AI
 *
 * @returns An object containing:
 * - `sendMessage`: Function to send a message to the AI
 * - `isPending`: Boolean indicating if a message is currently being processed
 *
 * @example
 * ```typescript
 * const { sendMessage, isPending } = useChatMutation({
 *   onMessageReceived: (message) => {
 *     console.log("Received message:", message.content);
 *   },
 *   onAccessGranted: (duration, message) => {
 *     console.log(`Access granted for ${duration} minutes`);
 *     // Unblock the page or update UI
 *   },
 *   onAccessDenied: (reason) => {
 *     console.log("Access denied:", reason);
 *     // Show denial message to user
 *   }
 * });
 *
 * // Send a message to the AI
 * sendMessage("session_123", "Can I have access to social media?");
 * ```
 */
export const useChatMutation = ({
  onMessageReceived,
  onAccessGranted,
  onAccessDenied,
}: UseChatMutationOptions = {}) => {
  const mutation = useMutation<
    ChatResponse,
    Error,
    { sessionId: string; message: string }
  >({
    mutationFn: async ({ sessionId, message }) => {
      const windowWithChat = window as Window & {
        sendChatMessage?: (
          sessionId: string,
          message: string,
        ) => Promise<ChatResponse>;
      };

      if (!windowWithChat.sendChatMessage) {
        throw new Error("Chat function not available");
      }

      return await windowWithChat.sendChatMessage(sessionId, message);
    },
    onSuccess: (response) => {
      // Add AI response to messages
      onMessageReceived?.(response.message);

      // Check for access granted
      const chatResponse = response as ChatResponse & {
        accessGranted?: boolean;
        durationMinutes?: number;
      };

      if (chatResponse.accessGranted && chatResponse.durationMinutes) {
        const message = `Access granted for ${chatResponse.durationMinutes} minutes! Unblocking page...`;
        onAccessGranted?.(chatResponse.durationMinutes, message);
      } else if (response.message.content.includes("ACCESS_DENIED")) {
        // Extract reason from message
        const reasonMatch = response.message.content.match(
          /ACCESS_DENIED:? *(.*)/,
        );
        const reason =
          reasonMatch?.[1]?.trim() || "Access denied by AI assistant";
        onAccessDenied?.(reason);
      }
    },
    onError: () => {
      // Add error message
      const errorMessage: ChatMessage = {
        content:
          "Sorry, I'm having trouble responding right now. Please try again.",
        role: "assistant",
        id: `error_${Date.now()}`,
        timestamp: Date.now(),
      };
      onMessageReceived?.(errorMessage);
    },
  });

  const sendMessage = useCallback(
    (sessionId: string, message: string) => {
      mutation.mutate({ sessionId, message });
    },
    [mutation],
  );

  return {
    sendMessage,
    isPending: mutation.isPending,
  };
};

/**
 * State object for access status.
 */
interface AccessState {
  /** Whether access has been granted */
  isGranted: boolean;
  /** Whether access has been denied */
  isDenied: boolean;
  /** The status message to display */
  message: string;
}

/**
 * Manages access granted/denied state with auto-reset functionality.
 *
 * This hook provides state management for access status messages, including
 * automatic reset functionality for denied access. It's useful for displaying
 * temporary status messages to users when access decisions are made.
 *
 * Key features:
 * - Track granted/denied access state
 * - Display appropriate status messages
 * - Auto-reset denied status after 3 seconds
 * - Manual reset capability
 *
 * @returns An object containing:
 * - `isGranted`: Boolean indicating if access is currently granted
 * - `isDenied`: Boolean indicating if access is currently denied
 * - `message`: The current status message
 * - `showGranted`: Function to set granted state with a message
 * - `showDenied`: Function to set denied state with a message and optional callback
 * - `reset`: Function to manually reset the state
 *
 * @example
 * ```typescript
 * const {
 *   isGranted,
 *   isDenied,
 *   message,
 *   showGranted,
 *   showDenied,
 *   reset
 * } = useAccessState();
 *
 * // Show granted status
 * showGranted("Access granted for 30 minutes!");
 *
 * // Show denied status (auto-resets after 3 seconds)
 * showDenied("Access denied: Focus time not completed", (reason) => {
 *   console.log("Access was denied because:", reason);
 * });
 *
 * // Manually reset the state
 * reset();
 *
 * // Conditionally render status
 * {isGranted && <div className="text-green">{message}</div>}
 * {isDenied && <div className="text-red">{message}</div>}
 * ```
 */
export const useAccessState = () => {
  const [state, setState] = useState<AccessState>({
    isGranted: false,
    isDenied: false,
    message: "",
  });

  const showGranted = useCallback((message: string) => {
    setState({ isGranted: true, isDenied: false, message });
  }, []);

  const showDenied = useCallback(
    (message: string, onDeniedCallback?: (reason: string) => void) => {
      setState({ isGranted: false, isDenied: true, message });

      // Auto-reset after 3 seconds
      setTimeout(() => {
        setState({ isGranted: false, isDenied: false, message: "" });
        onDeniedCallback?.(message);
      }, 3000);
    },
    [],
  );

  const reset = useCallback(() => {
    setState({ isGranted: false, isDenied: false, message: "" });
  }, []);

  return {
    ...state,
    showGranted,
    showDenied,
    reset,
  };
};
