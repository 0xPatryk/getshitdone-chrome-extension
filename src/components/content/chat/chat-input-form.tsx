/**
 * Chat input form component for message input and sending.
 * This component provides a form with textarea and send button,
 * following popup component patterns with consistent styling.
 */

import { Button } from "@/components/ui/button";
import { CardFooter } from "@/components/ui/card";
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

  // Debug logs for input validation
  useEffect(() => {
    console.log("DEBUG: ChatInputForm mounted");
    console.log("DEBUG: Input message length:", inputMessage.length);
    console.log("DEBUG: Textarea ref current:", textareaRef.current);
  }, [inputMessage]);

  // Auto-focus textarea when not disabled
  useEffect(() => {
    if (textareaRef.current && !isDisabled) {
      textareaRef.current.focus();
    }
  }, [isDisabled]);

  return (
    <CardFooter className="p-2 sm:p-3 md:p-4">
      <div className="space-y-2 sm:space-y-3 w-full">
        <div className="relative w-full">
          <Textarea
            ref={textareaRef}
            id="chat-input"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Explain why you need access..."
            className="min-h-[80px] sm:min-h-[100px] resize-none text-sm pr-14 w-full"
            rows={2}
            disabled={isDisabled}
          />
          <Button
            size="sm"
            className="absolute bottom-2 right-2 h-8 w-8 p-0 rounded-full transition-all duration-200 hover:scale-105"
            onClick={handleSubmit}
            disabled={!inputMessage.trim() || isDisabled}
            variant={
              inputMessage.trim() && !isDisabled ? "default" : "secondary"
            }
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </CardFooter>
  );
};
