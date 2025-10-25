import { useEffect, useState } from "react";

interface TimerDisplayProps {
  readonly expiresAt: number;
  readonly durationMinutes: number;
  readonly onExpire: () => void;
}

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
    <div className="flex items-center gap-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
      <div className="flex-1">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
            Time Remaining
          </span>
          <span className="text-2xl font-bold text-blue-600 dark:text-blue-400 font-mono">
            {formatTime(timeRemaining)}
          </span>
        </div>
        <div className="w-full bg-blue-100 dark:bg-blue-900/40 rounded-full h-2">
          <div
            className="bg-blue-500 dark:bg-blue-400 h-2 rounded-full transition-all duration-1000"
            style={{ width: `${percentageRemaining()}%` }}
          />
        </div>
      </div>
    </div>
  );
};
