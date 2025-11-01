/**
 * Block overlay component for displaying when a page is blocked by the extension.
 * This component renders a full-screen overlay that blocks access to a page,
 * showing the reason for blocking and providing options to chat with an AI
 * assistant or request temporary access with a timer.
 */

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Lock } from "lucide-react";
import { FullScreenChatContainer } from "./chat/full-screen-chat-container";
import { TimerDisplay } from "./timer-display";

/**
 * Props for the BlockOverlay component
 */
interface BlockOverlayProps {
  /** The reason why the page is being blocked */
  readonly reason: string;
  /** Callback function triggered when user is granted temporary access */
  readonly onUnblock: (durationMinutes: number) => void;
  /** Optional timestamp when temporary access expires */
  readonly accessExpiresAt?: number;
  /** Optional duration in minutes for temporary access */
  readonly durationMinutes?: number;
  /** Optional callback triggered when timer expires */
  readonly onTimerExpire?: () => void;
}

/**
 * Block overlay component that displays when a page is identified as a distraction.
 * Shows a minimal blocking screen with the AI assistant as the primary focus,
 * optionally displays a countdown timer for temporary access, and includes
 * navigation controls to go back to the previous page.
 *
 * @example
 * ```tsx
 * <BlockOverlay
 *   reason="This is a social media site that may distract from your current task"
 *   onUnblock={(minutes) => console.log(`Unblocked for ${minutes} minutes`)}
 *   accessExpiresAt={Date.now() + 5 * 60 * 1000}
 *   durationMinutes={5}
 *   onTimerExpire={() => console.log('Timer expired')}
 * />
 * ```
 *
 * @param props - Component props
 * @param props.reason - The reason for blocking the page
 * @param props.onUnblock - Callback function for when access is granted
 * @param props.accessExpiresAt - Optional timestamp when access expires
 * @param props.durationMinutes - Optional duration for temporary access
 * @param props.onTimerExpire - Optional callback for when timer expires
 * @returns A React element containing the block overlay interface
 */
export const BlockOverlay = ({
  reason,
  onUnblock,
  accessExpiresAt,
  durationMinutes,
  onTimerExpire,
}: BlockOverlayProps) => {
  return (
    <div className="h-screen w-screen bg-background flex flex-col">
      <div className="flex-1 overflow-hidden">
        <div className="w-full h-full p-2 sm:p-3 md:p-4 flex justify-end">
          <div className="h-full w-full flex flex-col gap-3 sm:gap-4">
            {/* Access Restricted Header */}
            <Card className="shadow-sm border-destructive/20 bg-destructive/5">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="flex-shrink-0">
                    <Lock className="h-8 w-8 sm:h-10 sm:w-10 text-destructive" />
                  </div>
                  <div className="flex-1">
                    <h1 className="text-base sm:text-lg font-bold text-destructive">
                      Access Restricted
                    </h1>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-2">
                      This page has been blocked to help you stay focused
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Timer display if temporary access is granted */}
            {accessExpiresAt && durationMinutes && onTimerExpire && (
              <Card className="shadow-sm">
                <CardContent className="p-3 sm:p-4">
                  <TimerDisplay
                    expiresAt={accessExpiresAt}
                    durationMinutes={durationMinutes}
                    onExpire={onTimerExpire}
                  />
                </CardContent>
              </Card>
            )}

            {/* Full-screen chat container */}
            <div className="flex-1 min-h-0">
              <FullScreenChatContainer
                initialMessage="I need access to this page. Can you help me understand why it's blocked?"
                initialAiMessage={reason}
                onUnblock={onUnblock}
                onAccessDenied={(deniedReason: string) => {
                  // Access denied callback - no logging needed
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Footer with navigation */}
      <div className="border-t border-border bg-card/50 p-3 sm:p-4 flex justify-end">
        <div className="w-full">
          <Button
            variant="outline"
            onClick={() => window.history.back()}
            className="w-full h-12 sm:h-14 text-sm sm:text-base font-medium"
          >
            Go Back
          </Button>
        </div>
      </div>
    </div>
  );
};
