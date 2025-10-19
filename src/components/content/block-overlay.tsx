import { Button } from "@/components/ui/button";
import { ChatInterface } from "./chat-interface";

interface BlockOverlayProps {
  readonly reason: string;
  readonly onUnblock: () => void;
  readonly onRequestAccess: (justification: string) => void;
  readonly isSubmitting: boolean;
}

export const BlockOverlay = ({
  reason,
  onUnblock,
  onRequestAccess,
  isSubmitting,
}: BlockOverlayProps) => {
  return (
    <div className="fixed inset-0 z-[999999] bg-black/90 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col p-6">
        <div className="space-y-4 mb-4">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-red-600 dark:text-red-400">
              🚫 Access Blocked
            </h2>
            <p className="text-gray-700 dark:text-gray-300">
              This page has been identified as a distraction from your current
              task.
            </p>
          </div>

          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
            <p className="text-sm font-medium text-red-800 dark:text-red-200">
              Reason: {reason}
            </p>
          </div>
        </div>

        <div className="flex-1 min-h-0">
          <ChatInterface
            initialMessage="I need access to this page. Can you help me understand why it's blocked?"
            onUnblock={onUnblock}
            onAccessDenied={(deniedReason) => {
              console.log("Access denied:", deniedReason);
            }}
          />
        </div>

        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button
            variant="outline"
            onClick={() => window.history.back()}
            disabled={isSubmitting}
            className="w-full"
          >
            Go Back
          </Button>
        </div>
      </div>
    </div>
  );
};
