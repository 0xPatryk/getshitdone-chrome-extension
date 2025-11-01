/**
 * Chat messages list component for displaying and managing chat messages.
 * This component renders the scrollable message container with auto-scrolling
 * and handles message display, loading states, and access status.
 */

import { CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useRef } from "react";
import { useAutoScroll } from "~/lib/hooks";
import { ChatAccessState } from "./chat-access-state";
import { ChatLoadingState } from "./chat-loading-state";
import { useChatContext } from "./chat-provider";
import { MessageItem } from "./message-item";

/**
 * Chat messages list component.
 * Displays all chat messages in a scrollable container with proper spacing.
 * Responsive design with mobile-first approach and consistent styling.
 *
 * @returns A React element containing the messages list
 */
export const ChatMessagesList = () => {
  const { messages, isProcessing, accessState } = useChatContext();
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Auto-scroll when messages change
  useAutoScroll(scrollAreaRef, [messages, isProcessing]);

  return (
    <CardContent className="flex-1 p-0 overflow-hidden">
      <ScrollArea ref={scrollAreaRef} className="h-full">
        <div className="space-y-3 sm:space-y-4 p-2 sm:p-3 md:p-4 lg:p-6 max-h-full overflow-y-auto">
          {messages.map((message) => (
            <MessageItem key={message.id} message={message} />
          ))}

          {isProcessing && <ChatLoadingState />}

          {(accessState.isGranted || accessState.isDenied) && (
            <div className="flex justify-center">
              <ChatAccessState
                isGranted={accessState.isGranted}
                message={accessState.message}
              />
            </div>
          )}
        </div>
      </ScrollArea>
    </CardContent>
  );
};
