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
    <CardHeader className="pb-2 sm:pb-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img
            src={generateAiAvatar()}
            alt="AI Assistant"
            className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex-shrink-0"
          />
          <div className="flex-1">
            <h2 className="text-sm sm:text-base font-semibold text-foreground">
              AI Assistant
            </h2>
            <p className="text-xs text-muted-foreground">
              Helping you stay focused
            </p>
          </div>
        </div>
        <Badge
          variant={getStatusVariant()}
          className="text-xs px-2 py-1 flex-shrink-0"
        >
          {getStatusText()}
        </Badge>
      </div>
    </CardHeader>
  );
};
