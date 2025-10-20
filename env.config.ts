import { defineEnv } from "envin";
import { z } from "zod";
import { NodeEnv } from "./src/types";

export default defineEnv({
  shared: {
    NODE_ENV: z.nativeEnum(NodeEnv).default(NodeEnv.DEVELOPMENT),
  },
  clientPrefix: "VITE_",
  client: {
    VITE_OPEN_PANEL_KEY: z.string(),
  },
  env: {
    VITE_OPEN_PANEL_KEY: import.meta.env.VITE_OPEN_PANEL_KEY,
  },
  skip:
    (!!import.meta.env.SKIP_ENV_VALIDATION &&
      ["1", "true"].includes(import.meta.env.SKIP_ENV_VALIDATION)) ||
    import.meta.env.npm_lifecycle_event === "lint",
});
