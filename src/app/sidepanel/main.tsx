/**
 * Extension Side Panel Interface
 *
 * This file renders the extension's side panel interface that provides
 * a persistent view alongside the main browser content. The side panel
 * offers additional space for extension features and information that
 * users want to keep visible while browsing.
 *
 * @see https://developer.chrome.com/docs/extensions/reference/sidePanel
 */

import React from "react";
import ReactDOM from "react-dom/client";

import { Main } from "~/components/common/main";
import { Layout } from "~/components/layout/layout";

/**
 * Side Panel Component
 *
 * The main component for the extension's side panel interface.
 * It renders the common Main component within the standard Layout
 * to provide consistent styling and functionality.
 *
 * @returns The side panel interface UI
 */
const SidePanel = () => {
  return (
    <Layout>
      <Main filename="app/sidepanel" />
    </Layout>
  );
};

/**
 * Renders the side panel application
 *
 * Mounts the React application to the DOM root element with
 * StrictMode enabled for development debugging and additional
 * runtime checks.
 *
 * @example
 * // This is called automatically when the side panel is opened
 * // and renders the extension's persistent interface
 */
ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <SidePanel />
  </React.StrictMode>,
);
