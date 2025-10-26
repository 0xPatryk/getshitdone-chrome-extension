/**
 * Extension Options Page
 *
 * This file renders the extension's options page where users can configure
 * API keys, AI provider settings, and other extension preferences.
 * The options page is accessible through Chrome's extension management
 * interface and provides a dedicated space for configuration.
 *
 * @see https://developer.chrome.com/docs/extensions/reference/options
 */

import React from "react";
import ReactDOM from "react-dom/client";

import { Layout } from "~/components/layout/layout";
import { ApiKeySettings } from "~/components/options/api-key-settings";

/**
 * Options Page Component
 *
 * The main component for the extension's options page. It renders
 * the API key settings component within a responsive layout with
 * maximum width constraint for optimal readability.
 *
 * @returns The options page UI
 */
const Options = () => {
  return (
    <Layout>
      <div className="w-full max-w-2xl">
        <ApiKeySettings />
      </div>
    </Layout>
  );
};

/**
 * Renders the options page application
 *
 * Mounts the React application to the DOM root element
 * with StrictMode enabled for development debugging and
 * additional runtime checks.
 *
 * @example
 * // This is called automatically when the options page is opened
 * // and renders the extension's configuration interface
 */
ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <Options />
  </React.StrictMode>,
);
