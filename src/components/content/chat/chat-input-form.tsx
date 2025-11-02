/**
 * Chat input form component for message input and sending.
 * This component provides a form with textarea and send button,
 * following popup component patterns with consistent styling.
 */

import { Button } from "@/components/ui/button";
import { CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Send } from "lucide-react";
import { useEffect, useRef } from "react";
import { useChatContext } from "./chat-provider";

/**
 * Chat input form component.
 * Provides a form with textarea for message input and send button.
 * Responsive design with mobile-first approach and consistent spacing.
 * Follows popup component patterns for form structure.
 *
 * @returns A React element containing the chat input form
 */
export const ChatInputForm = () => {
  const {
    inputMessage,
    setInputMessage,
    sendMessage,
    isProcessing,
    accessState,
  } = useChatContext();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = () => {
    if (inputMessage.trim() && !isProcessing && !accessState.isGranted) {
      sendMessage(inputMessage.trim());
      setInputMessage("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const isDisabled = isProcessing || accessState.isGranted;

  // Auto-focus textarea when not disabled
  useEffect(() => {
    if (textareaRef.current && !isDisabled) {
      textareaRef.current.focus();
    }
  }, [isDisabled]);

  return (
    <CardFooter className="p-3 sm:p-4 lg:p-6">
      <div className="space-y-3 sm:space-y-4 w-full">
        <div className="space-y-2">
          <Label
            htmlFor="chat-input"
            className="text-xs sm:text-sm font-medium"
          >
            Your Message
          </Label>
          <div className="relative">
            <Textarea
              ref={textareaRef}
              id="chat-input"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Explain why you need access..."
              className="min-h-[100px] sm:min-h-[120px] resize-none text-xs sm:text-sm pr-12"
              rows={3}
              disabled={isDisabled}
            />
            <Button
              size="sm"
              className="absolute bottom-3 right-3 h-8 w-8 p-0 rounded-full transition-all duration-200 hover:scale-105"
              onClick={handleSubmit}
              disabled={!inputMessage.trim() || isDisabled}
              variant={
                inputMessage.trim() && !isDisabled ? "default" : "secondary"
              }
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Be specific about why you need access to this page
          </p>
        </div>
      </div>
    </CardFooter>
  );
};
