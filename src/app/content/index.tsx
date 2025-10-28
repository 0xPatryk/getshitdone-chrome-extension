/**
 * Content Script
 *
 * This content script runs on web pages and handles:
 * - Page content analysis and blocking
 * - UI overlay creation for blocked content
 * - Element removal based on AI analysis
 * - Chat interface integration
 * - Access timer management
 * - Message passing with background script
 *
 * The script uses Shadow DOM to isolate its UI from the page content
 * and maintains state for blocking decisions and temporary access.
 */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import { BlockOverlay } from "~/components/content/block-overlay";
import {
  type AccessGrant,
  getActiveAccessGrant,
  removeAccessGrant,
  setAccessGrant,
} from "~/lib/grants";
import {
  type AnalysisResult,
  Message,
  onMessage,
  sendMessage,
} from "~/lib/messaging";
import { storage } from "~/lib/storage/services";
import { StorageKey } from "~/lib/storage/types";
import { createShadowRootUi, defineContentScript } from "#imports";

import "~/assets/styles/globals.css";

const queryClient = new QueryClient();

/**
 * Removes DOM elements from the page based on CSS selectors
 *
 * This function safely removes elements that match the provided selectors.
 * It handles errors gracefully and logs warnings for failed removals.
 *
 * @param selectors - Array of CSS selectors for elements to remove
 * @example
 * // Remove all sidebar and footer elements
 * removeElements(['.sidebar', 'footer', '.ads']);
 */
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

/**
 * Content Script UI Component
 *
 * Manages the blocking overlay UI and handles user interactions.
 * This component is rendered inside a Shadow DOM to prevent conflicts
 * with the page's styles and scripts.
 *
 * @param initialBlockResult - Optional initial analysis result to apply
 * @param originalContent - The original page HTML content before blocking
 */
const ContentScriptUI = ({
  initialBlockResult,
  originalContent,
}: {
  initialBlockResult?: AnalysisResult | null;
  originalContent?: string;
}) => {
  const [blockState, setBlockState] = useState<{
    blockResult: AnalysisResult | null;
    isBlocked: boolean;
  }>({
    blockResult: initialBlockResult || null,
    isBlocked: initialBlockResult?.decision === "BLOCK_ALL" || false,
  });

  const [activeGrant, setActiveGrant] = useState<AccessGrant | null>(null);

  useEffect(() => {
    // Check for active access grant on mount
    getActiveAccessGrant(window.location.href).then(setActiveGrant);

    // Listen for block results from background script
    const blockResultListener = onMessage(Message.BLOCK_RESULT, (message) => {
      handleBlockResult(message.data);
    });

    return () => {
      blockResultListener();
    };
  }, []);

  /**
   * Handles analysis results from the background script
   *
   * Processes different types of blocking decisions:
   * - BLOCK_ALL: Shows the blocking overlay
   * - REMOVE_ELEMENTS: Removes specific elements from the page
   * - ALLOW: Removes always-remove elements if specified
   *
   * @param result - The analysis result containing the decision
   */
  const handleBlockResult = (result: AnalysisResult) => {
    setBlockState({
      blockResult: result,
      isBlocked: result.decision === "BLOCK_ALL",
    });

    // Handle element removal for non-blocking decisions
    if (result.decision === "REMOVE_ELEMENTS" && result.selectors) {
      removeElements(result.selectors);
    } else if (result.decision === "ALLOW" && result.selectors) {
      removeElements(result.selectors);
    }
  };

  /**
   * Handles temporary unblocking of the current page
   *
   * Creates an access grant for the specified duration.
   * Timer management is handled by the TimerDisplay component.
   *
   * @param durationMinutes - Number of minutes to grant access
   */
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

    // Update local grant state for timer display
    setActiveGrant({
      url: window.location.href,
      expiresAt,
      grantedAt: now,
      durationMinutes,
    });

    // Hide overlay
    setBlockState((prev) => ({ ...prev, isBlocked: false }));
  }, []);

  /**
   * Handles the expiration of temporary access
   *
   * Called when the access timer expires to re-block the page
   * and clean up the access grant.
   */
  const handleTimerExpire = useCallback(async () => {
    // Remove access grant from storage
    await removeAccessGrant(window.location.href);
    setActiveGrant(null);

    // Re-block the page
    setBlockState({
      blockResult: {
        decision: "BLOCK_ALL",
        reason:
          "Your temporary access has expired. Request access again if needed.",
      },
      isBlocked: true,
    });
  }, []);

  /**
   * Sends chat messages to the background script for processing
   *
   * This function is made available globally for the ChatInterface
   * component to use. It handles communication with the background
   * script and error logging.
   *
   * @param sessionId - The chat session ID (typically the page URL)
   * @param message - The user's chat message
   * @returns Promise resolving to the AI response
   * @throws Error when message sending fails
   */
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
          context: "content script chat message sending",
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
      accessExpiresAt={activeGrant?.expiresAt}
      durationMinutes={activeGrant?.durationMinutes}
      onTimerExpire={handleTimerExpire}
    />
  );
};

export default defineContentScript({
  matches: ["<all_urls>"],
  cssInjectionMode: "ui",

  /**
   * Main entry point for the content script
   *
   * Sets up the content script functionality including:
   * - Page analysis on load
   * - Shadow DOM UI creation
   * - Event listeners for navigation changes
   *
   * @param ctx - The content script execution context
   */
  async main(ctx) {
    // Store the original page content globally so it can be restored when unblocked
    let storedOriginalContent: string | null = null;
    let currentUI: Awaited<ReturnType<typeof createShadowRootUi>> | null = null;

    /**
     * Creates and mounts the ShadowRoot UI for blocking
     *
     * Uses WXT's createShadowRootUi to create an isolated DOM
     * environment for the blocking overlay, preventing conflicts
     * with the page's styles and scripts.
     *
     * @param blockResult - The analysis result requiring blocking
     * @returns Promise resolving to the UI instance
     */
    const createBlockUI = async (blockResult: AnalysisResult) => {
      // Store the original page content before replacing it
      storedOriginalContent = document.documentElement.outerHTML;

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
              <ContentScriptUI
                initialBlockResult={blockResult}
                originalContent={storedOriginalContent || undefined}
              />
            </QueryClientProvider>,
          );
          return root;
        },
        onRemove: (root) => {
          root?.unmount();
          // Restore original content when UI is removed
          if (storedOriginalContent) {
            document.documentElement.innerHTML = storedOriginalContent;
            // Re-run scripts that were in the original content
            for (const script of Array.from(
              document.querySelectorAll("script"),
            )) {
              const newScript = document.createElement("script");
              for (const attr of Array.from(script.attributes)) {
                newScript.setAttribute(attr.name, attr.value);
              }
              if (script.innerHTML) {
                newScript.innerHTML = script.innerHTML;
              } else if (script.src) {
                newScript.src = script.src;
              }
              script.parentNode?.replaceChild(newScript, script);
            }
          }
        },
      });

      currentUI = ui;
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

        // Check if extension is enabled
        const extensionEnabled =
          await storage[StorageKey.EXTENSION_ENABLED].getValue();
        if (!extensionEnabled) {
          return;
        }

        // Get always remove list from storage
        const alwaysRemove = await storage[StorageKey.ALWAYS_REMOVE].getValue();

        // Send page content to background script for analysis
        const response = await sendMessage(Message.ANALYZE_PAGE, {
          url: window.location.href,
          content: document.documentElement.outerHTML,
          alwaysRemove,
        });

        // Log the analysis response for debugging
        console.log("Focus App: Page analysis response received", {
          url: window.location.href,
          decision: response.decision,
          reason: response.reason,
          selectors: response.selectors,
          timestamp: new Date().toISOString(),
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
          context: "page analysis",
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
