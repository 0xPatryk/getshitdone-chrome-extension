# CLAUDE.md - GetShitDone Extension

> This file contains project-specific context, conventions, and instructions for Claude Code.
> It helps Claude understand the codebase and work effectively within its patterns.

---

## Project Overview

**Name:** GetShitDone
**Type:** Browser Extension (Chrome/Firefox)
**Framework:** WXT (Web Extension Framework)
**Purpose:** AI-powered productivity extension that intelligently blocks distractions based on user's current task

---

## Architecture

### Tech Stack
- **Framework:** WXT 0.20+ with file-based entrypoints
- **Language:** TypeScript 5.9+ (strict mode)
- **UI:** React 19, Tailwind CSS 4, shadcn/ui components
- **State:** TanStack Query (React Query) for server/cache state
- **AI:** Vercel AI SDK with Google Gemini / OpenAI
- **Storage:** WXT Storage API (browser.storage.local wrapper)
- **Messaging:** @webext-core/messaging (type-safe RPC)
- **Validation:** Zod schemas
- **Build:** Vite + Bun

### Entrypoints (WXT Pattern)
All entrypoints are in `src/app/` directory:

| Entrypoint | File | Purpose |
|------------|------|---------|
| Background | `app/background/index.ts` | Service worker - AI calls, caching, grants |
| Content | `app/content/index.tsx` | Injected into pages - blocking UI, analysis trigger |
| Popup | `app/popup/main.tsx` | Toolbar popup - quick controls |
| Options | `app/options/main.tsx` | Settings page - API keys |
| Sidepanel | `app/sidepanel/main.tsx` | Browser side panel |
| Tabs | `app/tabs/main.tsx` | Full-page settings interface |

### Module Organization
```
src/
├── app/                    # WXT entrypoints
├── components/             # React components
│   ├── ui/                 # shadcn/ui (button, card, input, etc.)
│   ├── content/            # Content script components
│   ├── popup/              # Popup-specific components
│   └── options/            # Options page components
├── lib/                    # Core business logic
│   ├── ai-service/         # AI integration (Vercel AI SDK)
│   ├── cache/              # Caching system (TTL-based)
│   ├── grants/             # Time-based access grants
│   ├── messaging/          # Type-safe message protocol
│   └── storage/            # Storage layer with React hooks
└── types/                  # Global TypeScript types
```

---

## Key Patterns

### 1. WXT Entrypoint Pattern
```typescript
// Background script
import { defineBackground } from "#imports";

export default defineBackground(() => {
  // Runs when service worker loads
  // Extension APIs available here
});

// Content script
import { defineContentScript, createShadowRootUi } from "#imports";

export default defineContentScript({
  matches: ["<all_urls>"],
  cssInjectionMode: "ui",
  async main(ctx) {
    const ui = await createShadowRootUi(ctx, {
      name: "extension-ui",
      position: "overlay",
      onMount: (container) => { /* mount React */ },
    });
    ui.mount();
  },
});
```

### 2. Type-Safe Messaging
```typescript
// lib/messaging/types.ts
export const Message = {
  ANALYZE_PAGE: "analyzePage",
  SEND_CHAT_MESSAGE: "sendChatMessage",
} as const;

export interface Messages {
  [Message.ANALYZE_PAGE]: (data: { url: string; content: string }) => AnalysisResult;
}

// Usage
import { sendMessage, onMessage } from "~/lib/messaging";
const result = await sendMessage(Message.ANALYZE_PAGE, { url, content });
```

### 3. WXT Storage with React Hook
```typescript
// lib/storage/services.ts
import { storage as browserStorage } from "#imports";

export const storage = {
  [StorageKey.CURRENT_TASK]: browserStorage.defineItem<string | null>(
    "local:currentTask",
    {
      fallback: null,
      init: () => import.meta.env.VITE_CURRENT_TASK || null,
    }
  ),
};

// React hook for reactive storage
export const useStorage = <K extends StorageKeyType>(key: K) => {
  // Watches storage changes, returns { data, set, remove }
};
```

### 4. Cache-First with TanStack Query
```typescript
// lib/cache/hooks.ts
export const usePageAnalysis = (url: string, task: string, enabled: boolean) => {
  return useQuery({
    queryKey: ["analysis", url, task],
    queryFn: async () => {
      const response = await sendMessage(Message.ANALYZE_PAGE, {
        url,
        content: document.documentElement.outerHTML,
      });
      return response;
    },
    enabled,
  });
};
```

### 5. Zod Schema Validation
```typescript
// lib/messaging/schemas.ts
export const AnalysisResultSchema = z.object({
  decision: z.enum(["BLOCK_ALL", "ALLOW"]),
  reason: z.string(),
  selectors: z.array(z.string()).optional(),
});

export type AnalysisResult = z.infer<typeof AnalysisResultSchema>;
```

### 6. Secure Cache Keys
```typescript
// lib/cache/utils.ts
import { sha256 } from "@noble/hashes/sha256";

export const generateCacheKey = (url: string, task: string): string => {
  const urlHash = createSecureHash(url);
  const taskHash = createSecureHash(task);
  return `${urlHash}:${taskHash}`;
};
```

---

## AI Integration

### Dual-Prompt System

**1. Page Analysis** (`lib/ai-service/services.ts:376-429`)
- Purpose: Decide if page is relevant to user's task
- Output: `{ decision: "BLOCK_ALL" | "ALLOW", reason: string, selectors: string[] }`
- Features: "Fake productivity" detection, CSS selector extraction

**2. Chat/Negotiation** (`lib/ai-service/services.ts:435-751`)
- Purpose: Handle user requests for access
- Output: Natural conversation + grant decision + duration
- Features: Time-boxed grants, context-aware from previous grants

### AI Service Pattern
```typescript
export const analyzePageContent = async (
  apiKey: string,
  userTask: string,
  pageContent: string,
  url: string,
  provider: AIProvider
): Promise<AnalysisResult> => {
  const model = getModel(provider, apiKey);

  const { object } = await generateObject({
    model,
    schema: AnalysisResultSchema,
    system: constructSystemPrompt(),
    prompt: constructUserPrompt(userTask, pageContent, url),
    temperature: 0.2,  // Low for consistency
  });

  return object;
};
```

---

## Code Conventions

### TypeScript
- **Strict mode enabled** - no `any`, explicit types required
- Use `readonly` props for React components
- Prefer `interface` over `type` for object shapes
- Use discriminated unions for state machines

### React Components
```typescript
// Props interface with readonly
interface ComponentProps {
  readonly id: string;
  readonly onAction: (value: string) => void;
}

// Function component
export const Component = ({ id, onAction }: ComponentProps): JSX.Element => {
  // Implementation
};
```

### Error Handling
```typescript
// Structured error logging
console.error("Error context:", {
  error: error instanceof Error ? error.message : String(error),
  url: data?.url || "unknown",
  timestamp: new Date().toISOString(),
  context: "operation name",
});
```

### Imports
```typescript
// External libraries first
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";

// Internal absolute imports (~/lib/*)
import { storage } from "~/lib/storage/services";
import { Message } from "~/lib/messaging/types";

// Internal relative imports (./ or ../)
import { Button } from "@/components/ui/button";
```

### CSS/Tailwind
- Use `cn()` utility for class merging: `cn("base", condition && "modifier")`
- Prefer Tailwind utility classes over custom CSS
- Use CSS variables from shadcn/ui theme

---

## Testing

### Test Organization
```
src/test/
├── lib/                    # Unit tests for lib modules
│   ├── ai-service/
│   ├── cache/
│   └── storage/
├── mocks/                  # Test mocks
│   └── wxt-imports.ts
└── setup.ts                # Test setup
```

### Naming Conventions
- `*.unit.test.ts` - Unit tests
- `*.integration.test.ts` - Integration tests
- `*.e2e.test.ts` - End-to-end tests

### Running Tests
```bash
bun test                    # Run all tests
bun test:unit              # Unit tests only
bun test:watch             # Watch mode
bun test:coverage          # With coverage
```

---

## Build & Development

### Scripts
```bash
bun dev:chrome             # Dev mode (Chrome)
bun dev:firefox            # Dev mode (Firefox)
bun build:chrome           # Production build (Chrome)
bun build:firefox          # Production build (Firefox)
bun lint                   # Biome linting
bun lint:fix               # Auto-fix linting
bun typecheck              # TypeScript check
```

### Environment Variables
```bash
# .env
VITE_AI_PROVIDER="gemini"                    # or "openai"
VITE_GEMINI_API_KEY="your-key"
VITE_OPENAI_API_KEY="your-key"
VITE_CURRENT_TASK="default task"
VITE_EXTENSION_ENABLED="true"
VITE_ALWAYS_REMOVE="comma, separated, elements"
```

---

## Common Tasks

### Adding a New Storage Item
1. Add key to `lib/storage/types.ts`
2. Define item in `lib/storage/services.ts`
3. Optional: Add env var initialization

### Adding a New Message Type
1. Add constant to `lib/messaging/types.ts`
2. Add handler type to `Messages` interface
3. Implement handler in `app/background/index.ts`
4. Use via `sendMessage()` in components

### Adding a New AI Prompt
1. Define Zod schema for output
2. Create prompt constructor function
3. Use `generateObject()` from Vercel AI SDK
4. Add to `lib/ai-service/services.ts`

### Adding a New UI Component
1. Check shadcn/ui registry first: `npx shadcn add <component>`
2. Or create in `components/ui/` following shadcn patterns
3. Use `cn()` for class merging
4. Export from `components/ui/index.ts`

---

## Important Notes

### Security
- API keys stored in browser storage (local only)
- Cache keys use SHA-256 hashing (no URL/task leakage)
- Content script uses Shadow DOM for isolation
- No data sent to third parties except chosen AI provider

### Performance
- Cache decisions to reduce AI calls
- Background script handles heavy lifting
- Content script minimal - just triggers analysis
- TanStack Query for efficient state management

### Browser Compatibility
- WXT handles cross-browser differences
- Chrome: MV3 (Manifest V3)
- Firefox: MV2 (Manifest V2)
- Use `browser.*` APIs (WXT polyfills)

---

## Resources

- [WXT Documentation](https://wxt.dev)
- [Vercel AI SDK](https://sdk.vercel.ai/docs)
- [shadcn/ui](https://ui.shadcn.com)
- [TanStack Query](https://tanstack.com/query/latest)
- [Web Extension API](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions)

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     PRESENTATION LAYER                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   Popup     │  │   Options   │  │   Content Overlay   │  │
│  │   (React)   │  │   (React)   │  │   (Shadow DOM)      │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     MESSAGING LAYER                          │
│         (@webext-core/messaging - Type-safe RPC)             │
│              Message.ANALYZE_PAGE                            │
│              Message.SEND_CHAT_MESSAGE                       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      SERVICE LAYER                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │  AI Service │  │    Cache    │  │      Grants         │  │
│  │  (Vercel)   │  │  (WXT Stor) │  │   (Time-based)      │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

*Last updated: 2026-02-25*
