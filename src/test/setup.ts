import { mock } from "bun:test";
import { GlobalRegistrator } from "@happy-dom/global-registrator";

// Set required environment variables for tests
process.env.VITE_OPEN_PANEL_KEY = "mock_open_panel_key";

import * as wxtImports from "./mocks/wxt-imports";

// Register happy-dom for DOM API support
GlobalRegistrator.register({
  settings: {
    disableJavaScriptEvaluation: true,
    disableJavaScriptFileLoading: true,
    disableCSSFileLoading: true,
    disableIframePageLoading: true,
    disableComputedStyleRendering: true,
  },
});

// Mock #imports module used by WXT
mock.module("#imports", () => {
  return wxtImports;
});

// Polyfill chrome/browser extension APIs
// biome-ignore lint/suspicious/noExplicitAny: needed for global mock
(global as any).chrome = wxtImports.fakeBrowser;
// biome-ignore lint/suspicious/noExplicitAny: needed for global mock
(global as any).browser = wxtImports.fakeBrowser;
