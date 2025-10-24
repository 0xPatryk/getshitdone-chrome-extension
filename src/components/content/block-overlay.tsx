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
    <div className="min-h-screen bg-white dark:bg-gray-900 flex flex-col">
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-4xl mx-auto space-y-6">
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
              🚫 Access Blocked
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              This page has been identified as a distraction from your current task.
            </p>
          </div>

          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
            <p className="text-lg font-medium text-red-800 dark:text-red-200">
              Reason: {reason}
            </p>
          </div>

          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 min-h-[400px]">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
              Chat with Assistant
            </h2>
            <ChatInterface
              initialMessage="I need access to this page. Can you help me understand why it's blocked?"
              onUnblock={onUnblock}
              onAccessDenied={(deniedReason) => {
                console.log("Access denied:", deniedReason);
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
            disabled={isSubmitting}
            className="flex-1"
          >
            Go Back
          </Button>
        </div>
      </div>
    </div>
  );
};
