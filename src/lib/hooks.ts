/**
 * React Hooks Module
 *
 * This module provides general-purpose React hooks used throughout the focus extension.
 * These hooks are not domain-specific and can be reused across different components.
 *
 * Key features:
 * - Auto-scrolling functionality
 * - Reusable UI patterns
 * - Component lifecycle management
 *
 * @module hooks
 */

import { type RefObject, useEffect } from "react";

/**
 * Automatically scrolls a scroll area to the bottom when dependencies change.
 *
 * This hook is particularly useful for chat interfaces or log viewers where
 * you want to keep the latest content visible as new items are added.
 * It works with Radix UI ScrollArea components by finding the viewport
 * element and scrolling it to the bottom.
 *
 * @param scrollRef - React ref object pointing to the scroll container element
 * @param dependencies - Array of dependencies that trigger scrolling when changed
 *
 * @example
 * ```typescript
 * import { useRef } from "react";
 *
 * const ChatMessages = ({ messages }) => {
 *   const scrollRef = useRef<HTMLDivElement>(null);
 *
 *   // Auto-scroll when messages change
 *   useAutoScroll(scrollRef, [messages]);
 *
 *   return (
 *     <ScrollArea ref={scrollRef}>
 *       {messages.map(message => (
 *         <ChatMessage key={message.id} message={message} />
 *       ))}
 *     </ScrollArea>
 *   );
 * };
 * ```
 */
export const useAutoScroll = (
  scrollRef: RefObject<HTMLDivElement | null>,
  dependencies: unknown[],
) => {
  // biome-ignore lint/correctness/useExhaustiveDependencies: dependencies array is intentionally dynamic
  useEffect(() => {
    if (scrollRef.current) {
      const scrollElement = scrollRef.current.querySelector(
        "[data-radix-scroll-area-viewport]",
      ) as HTMLElement;
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  }, dependencies);
};
