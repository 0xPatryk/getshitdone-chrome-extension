/**
 * Extension Popup Interface
 *
 * This file renders the extension's popup interface that appears when
 * users click the extension icon in the browser toolbar. The popup
 * provides quick access to:
 * - Extension status and toggle controls
 * - Current focus task management
 * - Always-remove element configuration
 * - Quick access to full settings page
 *
 * @see https://developer.chrome.com/docs/extensions/reference/action
 */

import React from "react";
import ReactDOM from "react-dom/client";
import { browser } from "wxt/browser";

import { Settings } from "lucide-react";
import { Layout } from "~/components/layout/layout";
import { AlwaysRemoveInput } from "~/components/popup/always-remove-input";
import { ExtensionToggle } from "~/components/popup/extension-toggle";
import { StatusDisplay } from "~/components/popup/status-display";
import { TaskInput } from "~/components/popup/task-input";
import { Button } from "~/components/ui/button";
import { Separator } from "~/components/ui/separator";
import { useStorage } from "~/lib/storage/services";
import { StorageKey } from "~/lib/storage/types";

/**
 * Extension Popup Component
 *
 * The main component for the extension popup interface. It provides
 * a compact view of extension controls and status information with
 * a fixed width of 23rem for consistent appearance.
 *
 * @returns The popup interface UI
 */
const Popup = () => {
  const { data: currentTask } = useStorage(StorageKey.CURRENT_TASK);

  return (
    <div className="w-[23rem] p-4 space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <h1 className="text-lg font-semibold">Focus Mode</h1>
          <p className="text-sm text-muted-foreground">
            AI-powered distraction blocking for better productivity
          </p>
          {currentTask && (
            <div className="rounded-md bg-green-50 p-2 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
              <p className="text-xs font-medium text-green-800 dark:text-green-200">
                Running: {currentTask}
              </p>
            </div>
          )}
        </div>

        <Separator />

        <div className="space-y-4">
          <StatusDisplay />
          <ExtensionToggle />
        </div>

        <Separator />

        <TaskInput />

        <Separator />

        <AlwaysRemoveInput />

        <Separator />

        <div className="flex justify-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              browser.tabs.create({
                url: `${browser.runtime.getURL("/tabs.html")}#settings`,
              });
            }}
            className="gap-2"
          >
            <Settings className="size-4" />
            Settings
          </Button>
        </div>
      </div>
    </div>
  );
};

/**
 * Renders the popup application
 *
 * Mounts React application to the DOM root element with
 * StrictMode enabled for development debugging and additional
 * runtime checks. The popup is wrapped in the standard Layout
 * component for consistent styling.
 *
 * @example
 * // This is called automatically when the popup is opened
 * // and renders the extension's control interface
 */
ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <Layout>
      <Popup />
    </Layout>
  </React.StrictMode>,
);
