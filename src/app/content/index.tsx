import { useState, useEffect } from "react";
import ReactDOM from "react-dom/client";
import { createShadowRootUi, defineContentScript } from "#imports";
import { BlockOverlay } from "~/components/content/block-overlay";
import { Message, type AnalysisResult } from "~/lib/messaging";

import "~/assets/styles/globals.css";

const ContentScriptUI = () => {
  const [blockResult, setBlockResult] = useState<AnalysisResult | null>(null);
  const [isBlocked, setIsBlocked] = useState(false);

  useEffect(() => {
    // Listen for messages from background script
    const messageListener = (message: any) => {
      if (message.type === Message.BLOCK_RESULT && message.data) {
        handleBlockResult(message.data);
      }
    };

    chrome.runtime.onMessage.addListener(messageListener);

    return () => {
      chrome.runtime.onMessage.removeListener(messageListener);
    };
  }, []);

  const handleBlockResult = (result: AnalysisResult) => {
    setBlockResult(result);

    switch (result.decision) {
      case "BLOCK_ALL":
        setIsBlocked(true);
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
    selectors.forEach((selector) => {
      try {
        const elements = document.querySelectorAll(selector);
        elements.forEach((element) => {
          element.remove();
        });
      } catch (error) {
        console.warn(`Failed to remove elements with selector: ${selector}`, error);
      }
    });
  };

  const handleUnblock = () => {
    setIsBlocked(false);
    setBlockResult(null);
  };

  // If not blocked, don't render anything
  if (!isBlocked || !blockResult) {
    return null;
  }

  return <BlockOverlay reason={blockResult.reason} onUnblock={handleUnblock} />;
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
        root.render(<ContentScriptUI />);
        return root;
      },
      onRemove: (root) => {
        root?.unmount();
      },
    });

    ui.mount();
  },
});
