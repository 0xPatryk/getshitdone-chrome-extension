import { useMutation } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import { BlockOverlay } from "~/components/content/block-overlay";
import {
  type AnalysisResult,
  type ChatResponse,
  Message,
  sendMessage,
} from "~/lib/messaging";
import { createShadowRootUi, defineContentScript } from "#imports";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import "~/assets/styles/globals.css";

const queryClient = new QueryClient();

const ContentScriptUI = () => {
  const [blockState, setBlockState] = useState<{
    blockResult: AnalysisResult | null;
    isBlocked: boolean;
  }>({
    blockResult: null,
    isBlocked: false,
  });

  // Mutation for unblock requests
  const unblockMutation = useMutation({
    mutationFn: async (justification: string) => {
      if (!blockState.blockResult) throw new Error("No block result available");

      return await sendMessage(Message.UNBLOCK_REQUEST, {
        justification: justification.trim(),
        originalReason: blockState.blockResult.reason,
        taskId: Date.now(),
      });
    },
    onSuccess: (response) => {
      if (response.decision === "ALLOW") {
        handleUnblock();
      } else {
        alert(`Access denied: ${response.reason}`);
      }
    },
    onError: (error) => {
      console.error("Unblock request failed:", error);
      alert("Failed to process request. Please try again.");
    },
  });

  useEffect(() => {
    // Listen for messages from background script
    const messageListener = (message: {
      type: string;
      data: AnalysisResult | ChatResponse;
    }) => {
      if (message.type === Message.BLOCK_RESULT && message.data) {
        handleBlockResult(message.data as AnalysisResult);
      } else if (message.type === Message.CHAT_RESPONSE && message.data) {
        handleChatResponse(message.data as ChatResponse);
      }
    };

    chrome.runtime.onMessage.addListener(messageListener);

    return () => {
      chrome.runtime.onMessage.removeListener(messageListener);
    };
  }, []);

  const handleBlockResult = (result: AnalysisResult) => {
    setBlockState(prev => ({ ...prev, blockResult: result }));

    switch (result.decision) {
      case "BLOCK_ALL":
        setBlockState(prev => ({ ...prev, isBlocked: true }));
        break;
      case "REMOVE_ELEMENTS":
        removeElements(result.selectors || []);
        break;
      case "ALLOW":
        // Do nothing
        break;
    }
  };

  const removeElements = (selectors: string[]) => {
    for (const selector of selectors) {
      try {
        const elements = document.querySelectorAll(selector);
        for (const element of elements) {
          element.remove();
        }
      } catch (error) {
        console.warn(
          `Failed to remove elements with selector: ${selector}`,
          error,
        );
      }
    }
  };

  const handleUnblock = useCallback(() => {
    setBlockState(prev => ({ ...prev, isBlocked: false, blockResult: null }));
  }, []);

  const handleRequestAccess = useCallback((justification: string) => {
    unblockMutation.mutate(justification);
  }, [unblockMutation]);

  const handleChatResponse = useCallback((response: ChatResponse) => {
    // This will be handled by the ChatInterface component
    // We'll dispatch a custom event that the ChatInterface can listen for
    window.dispatchEvent(new CustomEvent("chatResponse", { detail: response }));
  }, []);

  // Function to send chat messages to background script
  const sendChatMessage = useCallback(
    async (sessionId: string, message: string) => {
      try {
        const response = await sendMessage(Message.SEND_CHAT_MESSAGE, {
          sessionId,
          message,
        });
        return response;
      } catch (error) {
        console.error("Failed to send chat message:", error);
        throw error;
      }
    },
    [],
  );

  // Make the sendChatMessage function available globally for the ChatInterface component
  useEffect(() => {
    (
      window as Window & { sendChatMessage?: typeof sendChatMessage }
    ).sendChatMessage = sendChatMessage;
    return () => {
      (
        window as Window & { sendChatMessage?: typeof sendChatMessage }
      ).sendChatMessage = undefined;
    };
  }, [sendChatMessage]);

  // If not blocked, don't render anything
  if (!blockState.isBlocked || !blockState.blockResult) {
    return null;
  }

  return (
    <BlockOverlay
      reason={blockState.blockResult.reason}
      onUnblock={handleUnblock}
      onRequestAccess={handleRequestAccess}
      isSubmitting={unblockMutation.isPending}
    />
  );
};

export default defineContentScript({
  matches: ["<all_urls>"],
  cssInjectionMode: "ui",

  async main(ctx) {
    console.log(
      "Content script is running! Edit `src/app/content` and save to reload.",
    );

    const ui = await createShadowRootUi(ctx, {
      name: "focus-block-ui",
      position: "overlay",
      anchor: "body",
      onMount: (container) => {
        const app = document.createElement("div");
        container.append(app);

        const root = ReactDOM.createRoot(app);
        root.render(
          <QueryClientProvider client={queryClient}>
            <ContentScriptUI />
          </QueryClientProvider>
        );
        return root;
      },
      onRemove: (root) => {
        root?.unmount();
      },
    });

    ui.mount();
  },
});