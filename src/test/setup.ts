import { mock } from "bun:test";
import { GlobalRegistrator } from "@happy-dom/global-registrator";
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
global.chrome = wxtImports.fakeBrowser;
global.browser = wxtImports.fakeBrowser;
