/**
 * Extension Tabs Page Router
 *
 * This file sets up the routing for the extension's tabs page, which provides
 * a full-page interface for extension features. The tabs page is accessible
 * through the browser action or programmatically and uses hash-based routing
 * for navigation between different sections.
 *
 * The tabs page provides more space and functionality than the popup,
 * making it suitable for detailed configuration and extended features.
 */

import { Layout } from "@/components/layout/layout";
import ReactDOM from "react-dom/client";
import { RouterProvider, createHashRouter } from "react-router-dom";
import { SettingsTab } from "./settings";

/**
 * Hash-based router configuration for tabs page
 *
 * Creates a router using hash-based navigation which is ideal for
 * extension pages as it doesn't require server-side routing support.
 * Currently configured with a settings route.
 *
 * @example
 * // Routes:
 * // /#/settings - Renders the SettingsTab component
 */
const router = createHashRouter([
  {
    children: [
      {
        path: "settings",
        element: <SettingsTab />,
      },
    ],
  },
]);

/**
 * Renders the tabs page application
 *
 * Mounts React application to the DOM root element with the
 * router provider wrapped in the standard Layout component for
 * consistent styling across all tab pages.
 *
 * @example
 * // This is called automatically when the tabs page is opened
 * // and renders the appropriate route based on the hash
 */
ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <Layout>
    <RouterProvider router={router} />,
  </Layout>,
);
