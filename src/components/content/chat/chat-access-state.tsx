/**
 * Chat access state component for displaying access granted/denied status.
 * This component shows access status with appropriate styling
 * following popup component patterns with consistent design.
 */

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

/**
 * Props for ChatAccessState component
 */
interface ChatAccessStateProps {
  /** Whether access was granted (true) or denied (false) */
  readonly isGranted: boolean;
  /** The status message to display */
  readonly message: string;
}

/**
 * Chat access state component.
 * Displays access granted or denied status with appropriate styling.
 * Responsive design with mobile-first approach and consistent spacing.
 *
 * @param props - Component props
 * @param props.isGranted - Whether access was granted or denied
 * @param props.message - The status message to display
 * @returns A React element containing the access state
 */
export const ChatAccessState = ({
  isGranted,
  message,
}: ChatAccessStateProps) => {
  return (
    <div className="flex justify-center px-1 sm:px-0">
      <Card className="w-full max-w-full sm:max-w-[90%] md:max-w-[85%] lg:max-w-[80%] mx-auto">
        <CardContent className="p-3 sm:p-4 text-center">
          <div className="space-y-2 sm:space-y-3">
            <Badge
              variant={isGranted ? "default" : "destructive"}
              className="text-sm sm:text-base px-2 sm:px-3 py-1"
            >
              {isGranted ? "✓ Access Granted" : "✗ Access Denied"}
            </Badge>
            <p className="text-sm sm:text-base leading-relaxed break-words">
              {message}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
