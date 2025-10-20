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
    VITE_GEMINI_API_KEY: z.string().optional(),
    VITE_OPENAI_API_KEY: z.string().optional(),
    VITE_AI_PROVIDER: z.enum(["gemini", "openai"]).default("gemini"),
    VITE_CURRENT_TASK: z.string().optional(),
    VITE_EXTENSION_ENABLED: z.enum(["true", "false"]).default("false"),
  },
  env: {
    VITE_OPEN_PANEL_KEY: import.meta.env.VITE_OPEN_PANEL_KEY,
    VITE_GEMINI_API_KEY: import.meta.env.VITE_GEMINI_API_KEY,
    VITE_OPENAI_API_KEY: import.meta.env.VITE_OPENAI_API_KEY,
    VITE_AI_PROVIDER: import.meta.env.VITE_AI_PROVIDER,
    VITE_CURRENT_TASK: import.meta.env.VITE_CURRENT_TASK,
    VITE_EXTENSION_ENABLED: import.meta.env.VITE_EXTENSION_ENABLED,
  },
  skip:
    (!!import.meta.env.SKIP_ENV_VALIDATION &&
      ["1", "true"].includes(import.meta.env.SKIP_ENV_VALIDATION)) ||
    import.meta.env.npm_lifecycle_event === "lint",
});
