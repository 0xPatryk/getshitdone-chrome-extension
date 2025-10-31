/**
 * Block overlay component for displaying when a page is blocked by the extension.
 * This component renders a full-screen overlay that blocks access to a page,
 * showing the reason for blocking and providing options to chat with an AI
 * assistant or request temporary access with a timer.
 */

import { Button } from "@/components/ui/button";
import { generateAiAvatar } from "~/lib/avatar";
import { ChatInterface } from "./chat-interface";
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
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      <div className="flex-1 p-4 overflow-hidden">
        <div className="w-full max-w-2xl mx-auto h-full flex flex-col space-y-4 sm:space-y-6 py-4">
          {/* Header with minimal blocking message */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 mb-4 overflow-hidden">
              <img
                src={generateAiAvatar()}
                alt="AI Assistant"
                className="w-full h-full object-cover"
              />
            </div>
            <h1 className="text-2xl font-semibold text-foreground">
              Access Restricted
            </h1>
            <p className="text-muted-foreground">
              Your AI assistant has blocked this page to help you stay focused.
            </p>
          </div>

          {/* Reason display with subtle styling */}
          <div className="bg-muted/50 border border-border rounded-lg p-4">
            <p className="text-sm text-muted-foreground mb-1">AI Analysis:</p>
            <p className="text-foreground">{reason}</p>
          </div>

          {/* Timer display if temporary access is granted */}
          {accessExpiresAt && durationMinutes && onTimerExpire && (
            <TimerDisplay
              expiresAt={accessExpiresAt}
              durationMinutes={durationMinutes}
              onExpire={onTimerExpire}
            />
          )}

          {/* Chat interface as the main interaction point */}
          <div className="bg-card border border-border rounded-lg p-3 sm:p-4 shadow-sm flex-1 flex flex-col min-h-0">
            <div className="mb-3">
              <h2 className="text-lg font-medium text-foreground">
                Explain why you need access
              </h2>
              <p className="text-sm text-muted-foreground">
                Your AI assistant will evaluate your request and decide whether
                to grant access.
              </p>
            </div>
            <div className="flex-1 min-h-0">
              <ChatInterface
                initialMessage="I need access to this page. Can you help me understand why it's blocked?"
                onUnblock={onUnblock}
                onAccessDenied={(deniedReason) => {
                  // Access denied callback - no logging needed
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Footer with navigation */}
      <div className="border-t border-border p-3 sm:p-4 bg-card/50">
        <div className="max-w-2xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => window.history.back()}
            className="w-full"
          >
            Go Back
          </Button>
        </div>
      </div>
    </div>
  );
};
