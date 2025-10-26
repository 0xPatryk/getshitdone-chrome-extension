/**
 * Block overlay component for displaying when a page is blocked by the extension.
 * This component renders a full-screen overlay that blocks access to a page,
 * showing the reason for blocking and providing options to chat with an AI
 * assistant or request temporary access with a timer.
 */

import { Button } from "@/components/ui/button";
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
 * Shows a blocking screen with the reason, provides a chat interface to request
 * access, optionally displays a countdown timer for temporary access, and includes
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
    <div className="min-h-screen bg-white dark:bg-gray-900 flex flex-col">
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-4xl mx-auto space-y-6">
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
              🚫 Access Blocked
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              This page has been identified as a distraction from your current
              task.
            </p>
          </div>

          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
            <p className="text-lg font-medium text-red-800 dark:text-red-200">
              Reason: {reason}
            </p>
          </div>

          {accessExpiresAt && durationMinutes && onTimerExpire && (
            <TimerDisplay
              expiresAt={accessExpiresAt}
              durationMinutes={durationMinutes}
              onExpire={onTimerExpire}
            />
          )}

          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 min-h-[400px]">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
              Chat with Assistant
            </h2>
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

      <div className="border-t border-gray-200 dark:border-gray-700 p-4">
        <div className="max-w-4xl mx-auto flex gap-4">
          <Button
            variant="outline"
            onClick={() => window.history.back()}
            className="flex-1"
          >
            Go Back
          </Button>
        </div>
      </div>
    </div>
  );
};
