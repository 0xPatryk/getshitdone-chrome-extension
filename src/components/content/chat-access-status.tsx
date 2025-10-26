/**
 * Chat access status component.
 * Displays access granted/denied messages with appropriate styling.
 */

import { cn } from "~/lib/utils";

/**
 * Props for the ChatAccessStatus component.
 */
interface ChatAccessStatusProps {
  /** Whether access was granted (true) or denied (false) */
  readonly isGranted: boolean;
  /** The status message to display */
  readonly message: string;
}

/**
 * Shows access status messages (granted or denied) with color-coded styling.
 *
 * This component displays status messages with appropriate styling based on the access decision:
 * - Granted: Green background and text, indicating successful access
 * - Denied: Red background and text, indicating access was refused
 *
 * The component is centered and uses semantic colors to clearly communicate
 * the access status to users.
 *
 * @param props - The component props
 * @param props.isGranted - Whether access was granted (true) or denied (false)
 * @param props.message - The status message to display
 *
 * @example
 * ```typescript
 * // Access granted
 * <ChatAccessStatus
 *   isGranted={true}
 *   message="Access granted for 30 minutes!"
 * />
 *
 * // Access denied
 * <ChatAccessStatus
 *   isGranted={false}
 *   message="Access denied: Focus time not completed"
 * />
 * ```
 */
export const ChatAccessStatus = ({
  isGranted,
  message,
}: ChatAccessStatusProps) => {
  return (
    <div
      className={cn(
        "flex justify-center",
        isGranted ? "text-green-600" : "text-red-600",
      )}
    >
      <div
        className={cn(
          "rounded-lg px-4 py-2 text-center",
          isGranted
            ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
            : "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800",
        )}
      >
        <p className="text-sm font-medium">{message}</p>
      </div>
    </div>
  );
};
