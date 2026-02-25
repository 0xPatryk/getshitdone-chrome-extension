# GetShitDone Extension - Architecture Deep Dive

## Overview

GetShitDone is an AI-powered browser extension that acts as a context-aware gatekeeper for user attention. It uses the **WXT (Web Extension Framework)** with TypeScript, React 19, and Tailwind CSS to build a sophisticated productivity tool.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | WXT (Web Extension Framework) |
| Language | TypeScript 5.9+ |
| UI | React 19, Tailwind CSS 4 |
| State | TanStack Query (React Query) |
| AI | Vercel AI SDK (@ai-sdk/google, @ai-sdk/openai) |
| Storage | WXT Storage API |
| Messaging | @webext-core/messaging |
| Validation | Zod |
| Build | Vite + WXT |
| Testing | Bun test + Vitest |

---

## WXT Architecture Patterns

### Entrypoints Structure

WXT uses **file-based entrypoints** - each file in the `app/` directory becomes an extension entrypoint:

```
app/
├── background/index.ts      # Service worker (background script)
├── content/index.tsx        # Content script (injected into pages)
├── popup/main.tsx           # Popup UI (toolbar icon click)
├── options/main.tsx         # Options page
├── sidepanel/main.tsx       # Side panel UI
├── tabs/main.tsx            # Full-page tabs
└── devtools/main.tsx        # DevTools panel
```

### Key WXT Patterns

#### 1. Background Script Entrypoint

```typescript
// app/background/index.ts
import { defineBackground } from "#imports";

export default defineBackground(() => {
  // Runs when background is loaded
  console.log('Background service worker initialized');
});
```

**Important**: Code outside `main()` runs in NodeJS during build. Extension APIs must be used INSIDE the callback.

#### 2. Content Script Entrypoint

```typescript
// app/content/index.tsx
import { defineContentScript, createShadowRootUi } from "#imports";

export default defineContentScript({
  matches: ["<all_urls>"],
  cssInjectionMode: "ui",  // Inject CSS into Shadow DOM

  async main(ctx) {
    // Create isolated UI using Shadow DOM
    const ui = await createShadowRootUi(ctx, {
      name: "my-extension-ui",
      position: "overlay",
      anchor: "body",
      onMount: (container) => {
        // Mount React app here
      },
    });
    ui.mount();
  },
});
```

#### 3. Storage with WXT

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
```

**Key Features:**
- Type-safe storage items
- Environment variable initialization
- Automatic fallback values
- Reactive watching with `.watch()`

---

## Core Architecture

### 1. Three-Layer Architecture

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
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      SERVICE LAYER                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │  AI Service │  │    Cache    │  │      Grants         │  │
│  │  (Vercel)   │  │  (WXT Storage)│  │   (Time-based)     │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### 2. Message Flow Architecture

```
Content Script                              Background Script
     │                                              │
     │  1. SEND: ANALYZE_PAGE                      │
     │ ─────────────────────────────────────────────>│
     │     { url, content, alwaysRemove }           │
     │                                              │
     │                    2. Check Cache            │
     │                    3. Call AI (if miss)      │
     │                    4. Store Result           │
     │                                              │
     │  5. RETURN: AnalysisResult                  │
     │ <─────────────────────────────────────────────│
     │     { decision, reason, selectors }          │
     │                                              │
     │  6. Render BlockOverlay (if BLOCK_ALL)       │
```

---

## Module Organization

### Directory Structure

```
src/
├── app/                          # WXT Entrypoints
│   ├── background/index.ts       # Service worker
│   ├── content/index.tsx         # Content script
│   ├── popup/main.tsx            # Popup UI
│   ├── options/main.tsx          # Options page
│   ├── sidepanel/main.tsx        # Side panel
│   └── tabs/main.tsx             # Full-page tabs
│
├── components/                   # React Components
│   ├── ui/                       # shadcn/ui components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   └── ...
│   ├── content/                  # Content script components
│   │   ├── block-overlay.tsx
│   │   └── chat/
│   │       ├── chat-provider.tsx
│   │       ├── chat-header.tsx
│   │       └── ...
│   ├── popup/                    # Popup components
│   ├── options/                  # Options components
│   └── layout/                   # Layout components
│
├── lib/                          # Core Logic
│   ├── ai-service/               # AI integration
│   │   ├── services.ts           # Main AI functions
│   │   ├── utils.ts              # Model configuration
│   │   └── types.ts              # AI types
│   ├── cache/                    # Caching system
│   │   ├── services.ts           # Cache operations
│   │   ├── hooks.ts              # React Query hooks
│   │   ├── utils.ts              # Cache key generation
│   │   └── types.ts              # Cache types
│   ├── grants/                   # Access grants
│   │   ├── services.ts           # Grant management
│   │   └── types.ts              # Grant types
│   ├── messaging/                # Message protocol
│   │   ├── services.ts           # Message handlers
│   │   ├── types.ts              # Message types
│   │   └── schemas.ts            # Zod schemas
│   ├── storage/                  # Storage layer
│   │   ├── services.ts           # Storage items
│   │   └── types.ts              # Storage keys
│   └── utils.ts                  # Utilities
│
├── types/                        # Global types
└── assets/                       # Static assets
```

---

## Key Architectural Patterns

### 1. Type-Safe Messaging

```typescript
// lib/messaging/types.ts
export const Message = {
  ANALYZE_PAGE: "analyzePage",
  SEND_CHAT_MESSAGE: "sendChatMessage",
  INVALIDATE_CACHE_TASK: "invalidateCacheTask",
} as const;

export interface Messages {
  [Message.ANALYZE_PAGE]: (data: {
    url: string;
    content: string;
    alwaysRemove?: string | null;
  }) => AnalysisResult;
}

// lib/messaging/services.ts
import { defineExtensionMessaging } from "@webext-core/messaging";

export const { sendMessage, onMessage } = defineExtensionMessaging<Messages>();

// Usage - fully type-safe!
const result = await sendMessage(Message.ANALYZE_PAGE, { url, content });
```

### 2. Cache-First Data Fetching

```typescript
// lib/cache/hooks.ts
export const usePageAnalysis = (
  url: string,
  task: string,
  alwaysRemove: string | null,
  enabled: boolean
) => {
  return useQuery({
    queryKey: ["analysis", url, task, alwaysRemove],
    queryFn: async () => {
      // Background script handles caching internally
      const response = await sendMessage(Message.ANALYZE_PAGE, {
        url,
        content: document.documentElement.outerHTML,
        alwaysRemove,
      });
      return response;
    },
    enabled,
    staleTime: 0,
  });
};
```

### 3. Zod Schema Validation

```typescript
// lib/messaging/schemas.ts
import { z } from "zod";

export const AnalysisResultSchema = z.object({
  decision: z.enum(["BLOCK_ALL", "ALLOW"]),
  reason: z.string(),
  selectors: z.array(z.string()).optional(),
});

export type AnalysisResult = z.infer<typeof AnalysisResultSchema>;
```

### 4. Secure Cache Keys

```typescript
// lib/cache/utils.ts
import { sha256 } from "@noble/hashes/sha256";
import { bytesToHex } from "@noble/hashes/utils";

export const createSecureHash = (input: string): string => {
  return bytesToHex(sha256(input));
};

export const generateCacheKey = (
  url: string,
  task: string,
  alwaysRemove: string | null
): string => {
  const urlHash = createSecureHash(url);
  const taskHash = createSecureHash(task);
  const alwaysRemoveHash = alwaysRemove
    ? createSecureHash(alwaysRemove)
    : "null";

  return `${urlHash}:${taskHash}:${alwaysRemoveHash}`;
};
```

### 5. Time-Based Access Grants

```typescript
// lib/grants/types.ts
export type AccessGrant = {
  url: string;
  expiresAt: number;        // Unix timestamp
  grantedAt: number;
  durationMinutes: number;
  reason?: string;
};

// lib/grants/services.ts
export const getActiveAccessGrant = async (
  url: string
): Promise<AccessGrant | null> => {
  const grants = await storage[StorageKey.ACCESS_GRANTS].getValue();
  const grant = grants[url];

  if (!grant) return null;

  // Auto-expire grants
  if (Date.now() >= grant.expiresAt) {
    await removeAccessGrant(url);
    return null;
  }

  return grant;
};
```

---

## AI Integration Architecture

### Dual-Prompt System

The extension uses two distinct AI prompts:

#### 1. Page Analysis Prompt
- **Purpose**: Determine if page is relevant to task
- **Output**: `BLOCK_ALL` | `ALLOW` + CSS selectors
- **Key Features**:
  - "Fake productivity" detection
  - CSS selector extraction for element removal
  - Exception handling (AI tools, auth, docs)

#### 2. Chat/Negotiation Prompt
- **Purpose**: Handle user requests for access
- **Output**: Natural conversation + grant decision
- **Key Features**:
  - Conversational style (2-4 sentences)
  - Time-boxed access grants
  - Context-aware from previous grants

### AI Service Flow

```typescript
// lib/ai-service/services.ts
export const analyzePageContent = async (
  apiKey: string,
  userTask: string,
  pageContent: string,
  url: string,
  provider: AIProvider = "gemini",
  alwaysRemove?: string | null,
  activeGrants?: Record<string, AccessGrant>,
  chatContexts?: Record<string, ChatSession>
): Promise<AnalysisResult> => {
  const model = getModel(provider, apiKey);

  const { object } = await generateObject({
    model,
    schema: NewAnalysisResultSchema,
    prompt: constructUserPrompt(...),
    system: constructSystemPrompt(),
    temperature: 0.2,  // Low for consistent decisions
  });

  return {
    decision: object.decision,
    reason: object.reason,
    selectors: object.selectors || [],
  };
};
```

---

## Clean Code Patterns

### 1. Barrel Exports

```typescript
// lib/cache/index.ts
export * from "./services";
export * from "./hooks";
export * from "./types";
export * from "./utils";
```

### 2. Path Aliases

```typescript
// tsconfig.json paths
{
  "~/*": ["src/*"],
  "@/components/*": ["src/components/*"]
}

// Usage
import { Button } from "@/components/ui/button";
import { storage } from "~/lib/storage/services";
```

### 3. Strict TypeScript Configuration

```json
{
  "compilerOptions": {
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

### 4. Consistent Error Handling

```typescript
// Pattern: Structured error logging
console.error("Error analyzing page:", {
  error: error instanceof Error ? error.message : String(error),
  url: data?.url || "unknown",
  timestamp: new Date().toISOString(),
  context: "background page analysis",
});
```

### 5. React Component Patterns

```typescript
// Props interface with readonly
interface BlockOverlayProps {
  readonly sessionId: string;
  readonly reason: string;
  readonly onUnblock: (durationMinutes: number) => void;
}

// Function component with explicit return type
export const BlockOverlay = ({
  sessionId,
  reason,
  onUnblock,
}: BlockOverlayProps): JSX.Element => {
  // Component logic
};
```

---

## Configuration

### WXT Config (`wxt.config.ts`)

```typescript
import { defineConfig } from "wxt";

export default defineConfig({
  manifest: {
    name: "__MSG_extensionName__",
    permissions: ["storage", "sidePanel", "scripting"],
    host_permissions: ["<all_urls>"],
  },
  srcDir: "src",
  entrypointsDir: "app",
  outDir: "build",
  modules: ["@wxt-dev/module-react", "@wxt-dev/auto-icons"],
  vite: () => ({
    plugins: [svgr(), tailwindcss()],
  }),
});
```

### Environment Variables

```bash
# .env
VITE_AI_PROVIDER="gemini"
VITE_GEMINI_API_KEY="your-key"
VITE_CURRENT_TASK="Building a Chrome extension"
VITE_EXTENSION_ENABLED="true"
VITE_ALWAYS_REMOVE="YouTube recommendations, Twitter trending"
```

---

## Testing Architecture

### Test Organization

```
src/test/
├── lib/
│   ├── ai-service/
│   ├── cache/
│   ├── chat/
│   └── storage/
├── mocks/
│   └── wxt-imports.ts
└── setup.ts
```

### Naming Conventions

- `*.unit.test.ts` - Unit tests
- `*.integration.test.ts` - Integration tests
- `*.e2e.test.ts` - E2E tests
- `*.component.test.tsx` - Component tests

---

## Best Practices Summary

1. **Entrypoints**: Use `defineBackground`, `defineContentScript` from `#imports`
2. **Storage**: Use WXT's `defineItem` with types and fallbacks
3. **Messaging**: Use `@webext-core/messaging` for type-safe RPC
4. **State**: Use TanStack Query for server/cache state
5. **AI**: Use Vercel AI SDK with Zod schemas for structured output
6. **Components**: Use Shadow DOM for content script UI isolation
7. **Security**: Hash sensitive cache keys with SHA-256
8. **Error Handling**: Log structured errors with context
9. **Types**: Use strict TypeScript with readonly props
10. **CSS**: Use Tailwind with `cn()` utility for class merging
