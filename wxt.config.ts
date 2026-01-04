import tailwindcss from "@tailwindcss/vite";
import svgr from "vite-plugin-svgr";
import { type WxtViteConfig, defineConfig } from "wxt";

export default defineConfig({
  manifest: {
    name: "__MSG_extensionName__",
    description: "__MSG_extensionDescription__",
    default_locale: "en",
    // Chrome Web Store requires homepage linking to privacy policy for extensions handling user data
    homepage_url: "https://github.com/pstemporowski/getshitdone",
    // Permissions required for core functionality
    permissions: ["storage", "sidePanel", "scripting"],
    // <all_urls> is required because the extension analyzes content on ANY website
    // to determine if it's relevant to the user's current task. This is the core
    // functionality and cannot be accomplished with a narrower permission set.
    host_permissions: ["<all_urls>"],
  },
  srcDir: "src",
  entrypointsDir: "app",
  outDir: "build",
  modules: ["@wxt-dev/module-react", "@wxt-dev/auto-icons"],
  imports: false,
  vite: () =>
    ({
      plugins: [svgr(), tailwindcss()],
    }) as WxtViteConfig,
  webExt: {
    chromiumArgs: ["--disable-features=DisableLoadExtensionCommandLineSwitch"],
  },
});
