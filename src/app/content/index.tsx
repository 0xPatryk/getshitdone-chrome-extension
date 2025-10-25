import { useMutation } from "@tanstack/react-query";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import { BlockOverlay } from "~/components/content/block-overlay";
import {
  type AnalysisResult,
  type ChatResponse,
  Message,
  onMessage,
  sendMessage,
} from "~/lib/messaging";
import { StorageKey, getStorageValue } from "~/lib/storage";
import { createShadowRootUi, defineContentScript } from "#imports";

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
    // Listen for block results from background script
    const blockResultListener = onMessage(Message.BLOCK_RESULT, (message) => {
      handleBlockResult(message.data);
    });

    // Listen for chat responses from background script
    const chatResponseListener = onMessage(Message.CHAT_RESPONSE, (message) => {
      handleChatResponse(message.data);
    });

    return () => {
      blockResultListener();
      chatResponseListener();
    };
  }, []);

  const handleBlockResult = (result: AnalysisResult) => {
    setBlockState((prev) => ({ ...prev, blockResult: result }));

    switch (result.decision) {
      case "BLOCK_ALL":
        setBlockState((prev) => ({ ...prev, isBlocked: true }));
        break;
      case "REMOVE_ELEMENTS":
        console.log(
          "[DEBUG] Removing elements with selectors:",
          result.selectors,
        );
        removeElements(result.selectors || []);
        break;
      case "ALLOW":
        // Even if the page is allowed, we still need to remove any always-remove elements
        if (result.selectors && result.selectors.length > 0) {
          console.log(
            "[DEBUG] Page allowed but removing always-remove elements with selectors:",
            result.selectors,
          );
          removeElements(result.selectors);
        }
        break;
    }
  };

  const removeElements = (selectors: string[]) => {
    console.log(
      `[DEBUG] removeElements called with ${selectors.length} selectors`,
    );

    for (const selector of selectors) {
      try {
        const elements = document.querySelectorAll(selector);
        console.log(
          `[DEBUG] Found ${elements.length} elements for selector: ${selector}`,
        );

        for (const element of elements) {
          element.remove();
        }

        if (elements.length > 0) {
          console.log(
            `[DEBUG] Successfully removed ${elements.length} elements with selector: ${selector}`,
          );
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
    setBlockState((prev) => ({ ...prev, isBlocked: false, blockResult: null }));
  }, []);

  const handleRequestAccess = useCallback(
    (justification: string) => {
      unblockMutation.mutate(justification);
    },
    [unblockMutation],
  );

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

    // Function to analyze the current page
    const analyzeCurrentPage = async () => {
      try {
        // Skip chrome:// pages and other special URLs
        if (
          window.location.href.startsWith("chrome://") ||
          window.location.href.startsWith("moz-extension://") ||
          window.location.href.startsWith("chrome-extension://")
        ) {
          return;
        }

        console.log("Analyzing page:", window.location.href);
        console.log(
          "Messaging system available:",
          typeof sendMessage !== "undefined",
        );

        // Get always remove list from storage
        const alwaysRemove = await getStorageValue(StorageKey.ALWAYS_REMOVE);

        console.log(
          "[DEBUG] Retrieved always-remove list from storage:",
          alwaysRemove,
        );

        // Send page content to background script for analysis
        console.log(
          "[DEBUG] Sending ANALYZE_PAGE message with always-remove data...",
        );
        const response = await sendMessage(Message.ANALYZE_PAGE, {
          url: window.location.href,
          content: document.documentElement.outerHTML,
          alwaysRemove,
        });
        console.log("[DEBUG] ANALYZE_PAGE response:", response);
      } catch (error) {
        console.error("Error analyzing page:", error);
      }
    };

    // Analyze the page when the content script loads
    analyzeCurrentPage();

    // Listen for location changes (for SPAs)
    ctx.addEventListener(window, "wxt:locationchange", () => {
      console.log(
        "[DEBUG] Location changed, analyzing new page at:",
        new Date().toISOString(),
      );
      console.log("[DEBUG] Current URL:", window.location.href);
      analyzeCurrentPage();
    });

    const ui = await createShadowRootUi(ctx, {
      name: "focus-block-ui",
      position: "inline",
      anchor: "body",
      append: "replace",
      onMount: (container) => {
        const app = document.createElement("div");
        app.className = "w-full h-full";
        container.append(app);

        const root = ReactDOM.createRoot(app);
        root.render(
          <QueryClientProvider client={queryClient}>
            <ContentScriptUI />
          </QueryClientProvider>,
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
