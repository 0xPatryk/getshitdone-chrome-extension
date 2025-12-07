/**
 * Content Script
 *
 * This content script runs on web pages and handles:
 * - Page content analysis and blocking
 * - UI overlay creation for blocked content
 * - Element removal based on AI analysis
 * - Chat interface integration
 * - Cache-based decision management
 * - Message passing with background script
 *
 * The script uses Shadow DOM to isolate its UI from the page content
 * and maintains state for blocking decisions and temporary access.
 */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useCallback, useEffect } from "react";
import ReactDOM from "react-dom/client";
import { BlockOverlay } from "~/components/content/block-overlay";
import { useChatAccess, usePageAnalysis } from "~/lib/cache";
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
 * @param url - The current page URL
 * @param task - The current user task
 * @param alwaysRemove - The always-remove configuration
 */
const ContentScriptUI = ({
  url,
  task,
  alwaysRemove,
  onShouldBlock,
}: {
  url: string;
  task: string;
  alwaysRemove: string | null;
  onShouldBlock?: (reason: string) => void;
}) => {
  // Query for page analysis
  const { data: analysisResult, isLoading: isAnalysisLoading } =
    usePageAnalysis(url, task, alwaysRemove, true);

  // Mutation for overwriting cache with chat access
  const chatAccessMutation = useChatAccess(url, task, alwaysRemove);

  // Apply decision to page
  // biome-ignore lint/correctness/useExhaustiveDependencies: It needs to update when always remove updates
  useEffect(() => {
    const decision = analysisResult;
    if (!decision) return;

    console.log(
      `Returned Page decision with decision: ${decision.decision}, reason ${decision.reason}, prompt: ${decision.prompt}, `,
    );

    switch (decision.decision) {
      case "BLOCK_ALL":
        console.log("ContentScript: Page should be blocked - showing overlay");
        // Remove distracting elements before showing the overlay

        if (onShouldBlock) {
          onShouldBlock(decision.reason);
        } else if (decision.selectors) {
          removeElements(decision.selectors);
        }

        // Block overlay will be rendered below
        break;
      case "ALLOW":
        console.log(
          "ContentScript: Page allowed - removing always-remove elements if any",
        );
        // Remove always-remove elements if any
        if (decision.selectors) {
          removeElements(decision.selectors);
        }
        break;
    }
  }, [analysisResult, alwaysRemove, onShouldBlock]);

  // Handle chat access grant
  const handleUnblock = useCallback(
    async (durationMinutes: number) => {
      chatAccessMutation.mutate(durationMinutes);
    },
    [chatAccessMutation],
  );

  // Don't render anything if still loading, no analysis result, or not blocking
  if (
    isAnalysisLoading ||
    !analysisResult ||
    analysisResult.decision !== "BLOCK_ALL"
  ) {
    return null;
  }

  // Get reason from decision
  const reason = analysisResult.reason;

  console.log("ContentScript: Rendering BlockOverlay with reason:", reason);
  console.log("ContentScript: About to render BlockOverlay component");

  return <BlockOverlay reason={reason} onUnblock={handleUnblock} />;
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
    let currentUI: Awaited<ReturnType<typeof createShadowRootUi>> | null = null;

    /**
     * Creates and mounts the ShadowRoot UI for blocking
     *
     * @param currentTask - The current user task
     * @param alwaysRemove - The always-remove configuration
     * @returns Promise resolving to the UI instance
     */
    const createBlockUI = async (
      currentTask: string,
      alwaysRemove: string | null,
    ) => {
      console.log(
        "ContentScript: Creating ShadowRoot UI with task:",
        currentTask,
      );

      const ui = await createShadowRootUi(ctx, {
        name: "focus-block-ui",
        position: "overlay",
        anchor: "body",
        append: "last",
        inheritStyles: true,
        onMount: (container) => {
          const app = document.createElement("div");
          app.className = "w-full h-full overflow-hidden";
          app.style.position = "fixed";
          app.style.top = "0";
          app.style.left = "0";
          app.style.right = "0";
          app.style.bottom = "0";
          app.style.zIndex = "9999";
          app.style.overscrollBehavior = "none";
          app.style.touchAction = "none";
          container.append(app);

          // Prevent background page scrolling when overlay is active
          document.body.style.overflow = "hidden";
          document.documentElement.style.overflow = "hidden";

          const root = ReactDOM.createRoot(app);
          root.render(
            <QueryClientProvider client={queryClient}>
              <ContentScriptUI
                url={window.location.href}
                task={currentTask}
                alwaysRemove={alwaysRemove}
              />
            </QueryClientProvider>,
          );
          return root;
        },
        onRemove: (root) => {
          console.log("ContentScript: ShadowRoot UI being removed");
          root?.unmount();
          // Restore background page scrolling when overlay is removed
          document.body.style.overflow = "";
          document.documentElement.style.overflow = "";
        },
      });

      currentUI = ui;
      ui.mount();
      console.log("ContentScript: ShadowRoot UI mounted successfully");
      return ui;
    };

    /**
     * Check if we should create UI immediately
     */
    const shouldCreateUI = async () => {
      try {
        // Skip chrome:// pages and other special URLs
        if (
          window.location.href.startsWith("chrome://") ||
          window.location.href.startsWith("moz-extension://") ||
          window.location.href.startsWith("chrome-extension://")
        ) {
          return false;
        }

        // Check if extension is enabled
        const extensionEnabled =
          await storage[StorageKey.EXTENSION_ENABLED].getValue();
        if (!extensionEnabled) {
          return false;
        }

        // Always create UI since background handles caching logic
        return true;
      } catch (error) {
        console.error("Error checking if UI should be created:", error);
        return false;
      }
    };

    /**
     * Main setup function
     */
    const setupUI = async () => {
      // Get current configuration
      const currentTask =
        (await storage[StorageKey.CURRENT_TASK].getValue()) || "";
      const alwaysRemove = await storage[StorageKey.ALWAYS_REMOVE].getValue();

      if (await shouldCreateUI()) {
        // Create a temporary div to mount ContentScriptUI component
        // This component will handle the analysis and only create overlay if needed
        const tempContainer = document.createElement("div");
        tempContainer.style.display = "none";
        document.body.appendChild(tempContainer);

        const tempRoot = ReactDOM.createRoot(tempContainer);
        tempRoot.render(
          <QueryClientProvider client={queryClient}>
            <ContentScriptUI
              url={window.location.href}
              task={currentTask}
              alwaysRemove={alwaysRemove}
              onShouldBlock={async (reason) => {
                // Create the actual blocking UI
                await createBlockUI(currentTask, alwaysRemove);
              }}
            />
          </QueryClientProvider>,
        );
      }
    };

    // Initial setup
    setupUI();

    // Listen for location changes (for SPAs)
    ctx.addEventListener(window, "wxt:locationchange", async () => {
      // Remove existing UI
      if (currentUI) {
        currentUI.remove();
        currentUI = null;
      }

      // Setup UI again
      await setupUI();
    });
  },
});
