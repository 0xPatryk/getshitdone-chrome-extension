import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface BlockOverlayProps {
  readonly reason: string;
  readonly onUnblock: () => void;
  readonly onRequestAccess: (justification: string) => void;
  readonly isSubmitting: boolean;
}

export const BlockOverlay = ({ reason, onUnblock, onRequestAccess, isSubmitting }: BlockOverlayProps) => {
  const [justification, setJustification] = useState("");

  const handleRequestAccess = () => {
    if (!justification.trim()) {
      return;
    }
    onRequestAccess(justification);
  };

  return (
    <div className="fixed inset-0 z-[999999] bg-black/90 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-md w-full p-6 space-y-6">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-red-600 dark:text-red-400">
            🚫 Access Blocked
          </h2>
          <p className="text-gray-700 dark:text-gray-300">
            This page has been identified as a distraction from your current task.
          </p>
        </div>

        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
          <p className="text-sm font-medium text-red-800 dark:text-red-200">
            Reason: {reason}
          </p>
        </div>

        <div className="space-y-3">
          <Label htmlFor="justification">Request Access (Optional)</Label>
          <Textarea
            id="justification"
            placeholder="Explain why you need access to this page..."
            value={justification}
            onChange={(e) => setJustification(e.target.value)}
            className="min-h-[80px]"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Your justification will be reviewed by AI to determine if access should be granted.
          </p>
        </div>

        <div className="flex gap-3">
          <Button
            onClick={handleRequestAccess}
            disabled={isSubmitting || !justification.trim()}
            className="flex-1"
          >
            {isSubmitting ? "Requesting..." : "Request Access"}
          </Button>
          <Button
            variant="outline"
            onClick={() => window.history.back()}
            disabled={isSubmitting}
          >
            Go Back
          </Button>
        </div>
      </div>
    </div>
  );
};