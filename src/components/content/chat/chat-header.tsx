/**
 * Chat header component for displaying AI assistant information and status.
 * This component shows the AI avatar, title, description, and current status
 * with responsive design and consistent styling.
 */

import { Badge } from "@/components/ui/badge";
import { CardHeader } from "@/components/ui/card";
import { generateAiAvatar } from "~/lib/avatar";
import { useChatContext } from "./chat-provider";

/**
 * Chat header component.
 * Displays AI assistant information with avatar, title, and status badge.
 * Responsive design with mobile-first approach and consistent spacing.
 *
 * @returns A React element containing the chat header
 */
export const ChatHeader = () => {
  const { accessState, isProcessing } = useChatContext();

  const getStatusVariant = () => {
    if (accessState.isGranted) return "default";
    if (accessState.isDenied) return "destructive";
    if (isProcessing) return "secondary";
    return "outline";
  };

  const getStatusText = () => {
    if (accessState.isGranted) return "Access Granted";
    if (accessState.isDenied) return "Access Denied";
    if (isProcessing) return "Processing...";
    return "Ready";
  };

  return (
    <CardHeader className="pb-3 sm:pb-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3 justify-center sm:justify-start w-full">
          <img
            src={generateAiAvatar()}
            alt="AI Assistant"
            className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex-shrink-0"
          />
          <div className="flex-1 text-center sm:text-left">
            <h2 className="text-base sm:text-lg font-semibold text-foreground">
              AI Assistant
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Helping you stay focused
            </p>
          </div>
          <Badge
            variant={getStatusVariant()}
            className="self-center sm:self-auto text-xs sm:text-sm px-3 sm:px-4 py-1 flex-shrink-0"
          >
            {getStatusText()}
          </Badge>
        </div>
      </div>
    </CardHeader>
  );
};
