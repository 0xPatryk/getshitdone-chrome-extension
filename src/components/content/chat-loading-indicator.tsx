/**
 * Chat loading indicator component.
 * Displays an animated loading state while waiting for AI response.
 */

/**
 * Shows a pulsing loading indicator for chat responses.
 *
 * This component displays three animated dots that pulse sequentially
 * to indicate that the AI assistant is processing a response.
 * The indicator is styled to match the assistant message appearance
 * with a gray background and left alignment.
 *
 * @returns A loading indicator component with animated dots
 *
 * @example
 * ```typescript
 * // Display while waiting for AI response
 * {isLoading && <ChatLoadingIndicator />}
 * ```
 */
export const ChatLoadingIndicator = () => {
  return (
    <div className="flex justify-start">
      <div className="bg-muted rounded-lg px-4 py-2">
        <div className="flex space-x-1">
          <div className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse" />
          <div className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse delay-75" />
          <div className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse delay-150" />
        </div>
      </div>
    </div>
  );
};
