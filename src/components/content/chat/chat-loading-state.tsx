/**
 * Chat loading state component for displaying AI processing indicator.
 * This component shows a loading indicator with animated dots
 * following popup component patterns with consistent styling.
 */

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

/**
 * Chat loading state component.
 * Displays a loading indicator with animated dots when AI is processing.
 * Responsive design with mobile-first approach and consistent styling.
 *
 * @returns A React element containing the loading state
 */
export const ChatLoadingState = () => {
  return (
    <div className="flex justify-center px-1 sm:px-0">
      <Card className="w-full max-w-full sm:max-w-[90%] md:max-w-[85%] lg:max-w-[80%] mr-auto">
        <CardContent className="p-3 sm:p-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <Badge variant="secondary" className="text-xs sm:text-sm px-2 py-1">
              AI is thinking
            </Badge>
            <div className="flex gap-1">
              <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-current rounded-full animate-pulse" />
              <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-current rounded-full animate-pulse delay-75" />
              <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-current rounded-full animate-pulse delay-150" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
