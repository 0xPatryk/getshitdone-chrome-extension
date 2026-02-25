/**
 * Chat Hooks Module
 *
 * This module provides React hooks specific to chat functionality in the focus extension.
 * These hooks handle chat message state, and access state management.
 *
 * Key features:
 * - Chat message state management
 * - Access state management
 * - Initial message handling
 *
 * @module chat/hooks
 */

import { useCallback, useEffect, useState } from "react";
import type { ChatMessage } from "./types";

/**
 * Options for the useChatMessages hook.
 */
interface UseChatMessagesOptions {
  /** Optional initial message to send when the hook initializes */
  readonly initialMessage?: string;
  /** Optional initial AI message to display as the reason for blocking */
  readonly initialAiMessage?: string;
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
  initialAiMessage,
  sessionId,
  onInitialized,
}: UseChatMessagesOptions) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize with initial message if provided
  useEffect(() => {
    if (!isInitialized && initialMessage) {
      // Start with AI message first (use the reason if provided)
      const aiMessage: ChatMessage = {
        id: `ai_${Date.now()}`,
        content:
          initialAiMessage ||
          "I understand you need access to this page. Can you please explain why you need it so I can help you stay focused?",
        role: "assistant",
        timestamp: Date.now(),
      };

      // Then add the user message
      const userMessage: ChatMessage = {
        id: `user_${Date.now() + 1}`,
        content: initialMessage,
        role: "user",
        timestamp: Date.now() + 1,
      };

      setMessages([aiMessage, userMessage]);
      setIsInitialized(true);
      onInitialized?.(sessionId, initialMessage);
    }
  }, [
    initialMessage,
    initialAiMessage,
    isInitialized,
    sessionId,
    onInitialized,
  ]);

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
