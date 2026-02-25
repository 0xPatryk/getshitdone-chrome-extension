/**
 * Timer display component for showing countdown to access expiration.
 * This component renders a visual countdown timer that shows remaining time
 * until temporary access expires, including a progress bar and formatted
 * time display. Automatically triggers expiration callback when timer reaches zero.
 */

import { useEffect, useState } from "react";

/**
 * Props for TimerDisplay component
 */
interface TimerDisplayProps {
  /** Timestamp when the temporary access expires */
  readonly expiresAt: number;
  /** Total duration in minutes for the temporary access */
  readonly durationMinutes: number;
  /** Callback function triggered when timer expires */
  readonly onExpire: () => void;
}

/**
 * Timer display component that shows a countdown until access expires.
 * Displays remaining time in MM:SS format with a visual progress bar
 * that decreases as time passes. Automatically updates every second
 * and triggers the onExpire callback when reaching zero.
 *
 * @example
 * ```tsx
 * <TimerDisplay
 *   expiresAt={Date.now() + 5 * 60 * 1000}
 *   durationMinutes={5}
 *   onExpire={() => console.log('Timer expired')}
 * />
 * ```
 *
 * @param props - Component props
 * @param props.expiresAt - Timestamp when access expires
 * @param props.durationMinutes - Total duration in minutes
 * @param props.onExpire - Callback triggered when timer expires
 * @returns A React element containing the timer display
 */
export const TimerDisplay = ({
  expiresAt,
  durationMinutes,
  onExpire,
}: TimerDisplayProps) => {
  const [timeRemaining, setTimeRemaining] = useState(0);

  useEffect(() => {
    const updateTimer = () => {
      const now = Date.now();
      const remaining = Math.max(0, expiresAt - now);
      setTimeRemaining(remaining);

      if (remaining === 0) {
        onExpire();
      }
    };

    // Update immediately
    updateTimer();

    // Update every second
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [expiresAt, onExpire]);

  const formatTime = (milliseconds: number): string => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  const percentageRemaining = () => {
    const totalDurationMs = durationMinutes * 60 * 1000;
    return Math.max(0, Math.min(100, (timeRemaining / totalDurationMs) * 100));
  };

  return (
    <div className="flex items-center gap-4 bg-primary/5 border border-primary/20 rounded-lg p-4">
      <div className="flex-1">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs sm:text-sm font-medium text-primary">
            Time Remaining
          </span>
          <span className="text-base sm:text-lg font-bold text-primary font-mono">
            {formatTime(timeRemaining)}
          </span>
        </div>
        <div className="w-full bg-primary/10 rounded-full h-2">
          <div
            className="bg-primary h-2 rounded-full transition-all duration-1000"
            style={{ width: `${percentageRemaining()}%` }}
          />
        </div>
      </div>
    </div>
  );
};
