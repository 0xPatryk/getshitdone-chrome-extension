import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom/client";
import { BlockOverlay } from "~/components/content/block-overlay";
import {
  type AnalysisResult,
  type ChatResponse,
  Message,
  onMessage,
  sendMessage,
} from "~/lib/messaging";
import {
  StorageKey,
  getActiveAccessGrant,
  getStorageValue,
  removeAccessGrant,
  setAccessGrant,
} from "~/lib/storage";
import { createShadowRootUi, defineContentScript } from "#imports";

import "~/assets/styles/globals.css";

const queryClient = new QueryClient();

// Function to remove elements from the page
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

const ContentScriptUI = ({
  initialBlockResult,
}: {
  initialBlockResult?: AnalysisResult | null;
}) => {

  const timerExpiredRef = useRef(false);
  const timeoutRef = useRef<number | undefined>(undefined);
  const [blockState, setBlockState] = useState<{
    blockResult: AnalysisResult | null;
    isBlocked: boolean;
    accessExpiresAt?: number;
    durationMinutes?: number;
  }>({
    blockResult: initialBlockResult || null,
    isBlocked: initialBlockResult?.decision === "BLOCK_ALL" || false,
    accessExpiresAt: undefined,
    durationMinutes: undefined,
  });

  useEffect(() => {
    // Check for active access grant on mount
    const checkActiveGrant = async () => {
      const activeGrant = await getActiveAccessGrant(window.location.href);
      if (activeGrant) {
        setBlockState((prev) => ({
          ...prev,
          isBlocked: false,
          accessExpiresAt: activeGrant.expiresAt,
          durationMinutes: activeGrant.durationMinutes,
        }));
      }
    };
    checkActiveGrant();

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
      // Clear timeout on unmount
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleBlockResult = (result: AnalysisResult) => {
    setBlockState((prev) => ({ ...prev, blockResult: result }));

    switch (result.decision) {
      case "BLOCK_ALL":
        setBlockState((prev) => ({ ...prev, isBlocked: true }));
        break;
      case "REMOVE_ELEMENTS":
        removeElements(result.selectors || []);
        break;
      case "ALLOW":
        // Even if the page is allowed, we still need to remove any always-remove elements
        if (result.selectors && result.selectors.length > 0) {
          removeElements(result.selectors);
        }
        break;
    }
  };

  const handleUnblock = useCallback(async (durationMinutes: number) => {
    const now = Date.now();
    const expiresAt = now + durationMinutes * 60 * 1000;

    // Save access grant to storage
    await setAccessGrant({
      url: window.location.href,
      expiresAt,
      grantedAt: now,
      durationMinutes,
    });

    setBlockState((prev) => ({
      ...prev,
      isBlocked: false,
      blockResult: null,
      accessExpiresAt: expiresAt,
      durationMinutes,
    }));

    // Reset the expired flag
    timerExpiredRef.current = false;

    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set a timeout to re-block when timer expires (backup mechanism)
    timeoutRef.current = window.setTimeout(
      () => {
        handleTimerExpire();
      },
      durationMinutes * 60 * 1000,
    );
  }, []);

  const handleTimerExpire = useCallback(async () => {
    // Prevent multiple calls
    if (timerExpiredRef.current) {
      return;
    }
    timerExpiredRef.current = true;

    // Clear timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = undefined;
    }

    // Remove access grant from storage
    await removeAccessGrant(window.location.href);

    // Re-analyze the page when timer expires
    setBlockState((prev) => ({
      ...prev,
      isBlocked: true,
      accessExpiresAt: undefined,
      durationMinutes: undefined,
      blockResult: {
        decision: "BLOCK_ALL",
        reason:
          "Your temporary access has expired. Request access again if needed.",
      },
    }));
  }, []);

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
        console.error("ContentScriptUI: Failed to send chat message:", {
          error: error instanceof Error ? error.message : String(error),
          timestamp: new Date().toISOString(),
          context: "content script chat message sending"
        });
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
      accessExpiresAt={blockState.accessExpiresAt}
      durationMinutes={blockState.durationMinutes}
      onTimerExpire={handleTimerExpire}
    />
  );
};

export default defineContentScript({
  matches: ["<all_urls>"],
  cssInjectionMode: "ui",

  async main(ctx) {
    // Function to create and mount the ShadowRoot UI
    const createBlockUI = async (blockResult: AnalysisResult) => {
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
              <ContentScriptUI initialBlockResult={blockResult} />
            </QueryClientProvider>,
          );
          return root;
        },
        onRemove: (root) => {
          root?.unmount();
        },
      });

      ui.mount();
      return ui;
    };

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

        // Get always remove list from storage
        const alwaysRemove = await getStorageValue(StorageKey.ALWAYS_REMOVE);

        // Send page content to background script for analysis
        const response = await sendMessage(Message.ANALYZE_PAGE, {
          url: window.location.href,
          content: document.documentElement.outerHTML,
          alwaysRemove,
        });

        // Only create UI if we need to block the page
        if (response.decision === "BLOCK_ALL") {
          await createBlockUI(response);
        } else {
          // For REMOVE_ELEMENTS and ALLOW, we don't need to create a UI that replaces the body
          // Just handle the element removal directly without creating a ShadowRoot
          if (response.decision === "REMOVE_ELEMENTS" && response.selectors) {
            removeElements(response.selectors);
          } else if (response.decision === "ALLOW" && response.selectors) {
            removeElements(response.selectors);
          }
        }
      } catch (error) {
        console.error("Error analyzing page:", {
          error: error instanceof Error ? error.message : String(error),
          url: window.location.href,
          timestamp: new Date().toISOString(),
          context: "page analysis"
        });
      }
    };

    // Analyze the page when the content script loads
    analyzeCurrentPage();

    // Listen for location changes (for SPAs)
    ctx.addEventListener(window, "wxt:locationchange", () => {
      analyzeCurrentPage();
    });
  },
});
