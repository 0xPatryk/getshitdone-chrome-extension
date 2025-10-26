/**
 * DevTools Panel Entry Point
 *
 * This file sets up the Chrome DevTools panel for the extension.
 * It creates:
 * - A main DevTools panel with extension interface
 * - A sidebar pane in the Elements panel for quick access
 *
 * The DevTools panel provides developers with tools to inspect
 * and debug the extension's behavior on the current page.
 */

import React from "react";
import ReactDOM from "react-dom/client";
import { browser } from "wxt/browser";

import { Main } from "~/components/common/main";
import { Layout } from "~/components/layout/layout";

/**
 * Creates the main DevTools panel
 *
 * Registers a new panel in Chrome DevTools with the extension name
 * and icon. The panel loads the devtools.html file which contains
 * this React application.
 *
 * @see https://developer.chrome.com/docs/extensions/reference/devtools_panel
 */
browser.devtools.panels.create(
  browser.i18n.getMessage("extensionName"),
  "icons/128.png",
  "devtools.html",
);

/**
 * Creates a sidebar pane in the Elements panel
 *
 * Adds a sidebar pane to the Elements panel for quick access to
 * extension information and debugging tools.
 *
 * @param sidebar - The sidebar pane instance to configure
 */
browser.devtools.panels.elements.createSidebarPane(
  browser.i18n.getMessage("extensionName"),
  (sidebar) => {
    sidebar.setObject({
      name: "DevTools",
    });
  },
);

/**
 * DevTools Panel Component
 *
 * The main React component for the DevTools panel interface.
 * Renders the common Main component within the standard Layout.
 *
 * @returns The DevTools panel UI
 */
const DevTools = () => {
  return (
    <Layout>
      <Main filename="app/devtools" />
    </Layout>
  );
};

/**
 * Renders the DevTools panel application
 *
 * Mounts the React application to the DOM root element
 * with StrictMode enabled for development debugging.
 *
 * @example
 * // This is called automatically when the DevTools panel is opened
 * // and renders the extension's debugging interface
 */
ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <DevTools />
  </React.StrictMode>,
);
