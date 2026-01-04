import path from "node:path";
import { defineConfig } from "vitest/config";
import { WxtVitest } from "wxt/testing/vitest-plugin";

export default defineConfig({
  plugins: [WxtVitest()],
  resolve: {
    alias: {
      "#imports": path.resolve(
        __dirname,
        "./src/lib/tests/mocks/wxt-imports.ts",
      ),
      "~": path.resolve(__dirname, "./src"),
    },
  },
});
