# Turbostarter/Extro Boilerplate Analysis

## Project Overview
The turbostarter/extro is a modern Chrome extension starter kit built with WXT framework, React, TypeScript, and Tailwind CSS. It provides a solid foundation for building browser extensions with Manifest V3.

## Technology Stack

### Core Framework & Build Tools
- **WXT Framework**: Modern Chrome extension development framework with Manifest V3 support
- **Bun**: Package manager and runtime for fast development
- **TypeScript**: Strict type checking with `noUncheckedIndexedAccess: true`
- **Vite**: Build tool with plugin support

### Frontend Framework & UI
- **React 19.1.0**: Latest React version with strict mode
- **Tailwind CSS v4**: Utility-first CSS framework with Vite integration
- **Radix UI**: Headless UI components for accessibility
- **shadcn/ui**: Component library patterns built on Radix UI
- **Lucide React**: Icon library

### State Management & Data
- **React Query (@tanstack/react-query)**: Server state management
- **React Hook Form**: Form validation with Zod integration
- **Supabase**: Backend services and authentication
- **WXT Storage**: Type-safe Chrome storage abstraction

### AI & Development Tools
- **Vercel AI SDK**: Already included (`ai: ^4.3.16`, `@ai-sdk/google: ^2.0.23`)
- **Zod**: Schema validation (already included)
- **Biome**: Code formatting and linting (2-space indentation, 80-char width)
- **Husky**: Git hooks for commit validation

## Project Structure & Conventions

### Entry Points (WXT Pattern)
- **Directory**: `src/app/` (not `src/`)
- **Background Script**: `src/app/background/index.ts` - Service worker
- **Content Script**: `src/app/content/index.tsx` - Uses `createShadowRootUi`
- **Popup**: `src/app/popup/main.tsx` - Extension popup UI
- **Options**: `src/app/options/main.tsx` - Extension options page
- **Side Panel**: `src/app/sidepanel/main.tsx` - Chrome side panel

### Component Architecture
- **Layout System**: Centralized `Layout` component with theme support
- **Component Location**: `src/components/` directory
- **UI Components**: `src/components/ui/` following shadcn/ui patterns
- **Import Alias**: `~/` for `src/` directory imports
- **Props Pattern**: `readonly` props by default for immutability
- **Performance**: `memo` for components that receive props but don't need re-rendering

### Storage System
- **Storage Keys**: Defined in `src/lib/storage.ts` with `local:` prefix
- **Type Safety**: Full TypeScript support with `WxtStorageItem`
- **Hooks**: `useStorage` hook for reactive storage access
- **Utilities**: `getStorage` utility for direct access

### Messaging System
- **Library**: `@webext-core/messaging` for type-safe communication
- **Pattern**: Predefined Message constants and typed interfaces
- **Location**: `src/lib/messaging.ts`

### Code Style & Standards
- **Formatting**: Biome with 2-space indentation, 80-character line width
- **Quotes**: Double quotes throughout
- **Imports**: Organized with `~/` alias for internal imports
- **Components**: Functional components with TypeScript interfaces
- **SVG Imports**: Use `?react` suffix for SVG files

### Chrome Extension Specifics
- **Permissions**: Defined in `wxt.config.ts` with minimal required permissions
- **Manifest V3**: Full support with service workers
- **Cross-browser**: Chrome and Firefox support with separate build commands
- **Content Security Policy**: Proper CSP compliance
- **Icons**: Auto-generated with `@wxt-dev/auto-icons`

### Development Commands
- **Development**: `bun dev` (Chrome), `bun dev:firefox` (Firefox)
- **Build**: `bun build` (creates both Chrome and Firefox packages)
- **Linting**: `bun lint` (check), `bun lint:fix` (auto-fix)
- **Type Checking**: `bun typecheck`
- **Testing**: `bun test` (uses Bun test framework, not Vitest)

## Key Patterns to Follow

### 1. Component Structure
```tsx
// Use readonly props by default
interface ComponentProps {
  readonly title: string;
  readonly onSave: () => void;
}

// Use memo for performance
const Component = memo(({ title, onSave }: ComponentProps) => {
  return <div>{title}</div>;
});
```

### 2. Storage Usage
```tsx
// Define storage keys with local: prefix
export const StorageKey = {
  API_KEY: "local:apiKey",
  TASK: "local:task",
} as const;

// Use hooks for reactive access
const { data: apiKey, set: setApiKey } = useStorage(StorageKey.API_KEY);
```

### 3. Content Script Pattern
```tsx
// Use createShadowRootUi for proper DOM isolation
const ui = await createShadowRootUi(ctx, {
  name: "extension-ui",
  position: "overlay",
  anchor: "body",
  onMount: (container) => {
    // Mount React component
  },
  onRemove: (root) => {
    root?.unmount();
  },
});
```

### 4. Messaging Pattern
```tsx
// Define message constants
export const Message = {
  ANALYZE_PAGE: "analyzePage",
  BLOCK_RESULT: "blockResult",
} as const;

// Type-safe messaging
export const { sendMessage, onMessage } = defineExtensionMessaging<Messages>();
```

## Security Considerations
- Content Security Policy compliance
- Secure storage with `local:` prefix
- Type-safe messaging to prevent injection
- Proper cleanup in content scripts

## Development Workflow
1. Use `bun dev` for Chrome development
2. Follow Conventional Commits (100-character body limit)
3. Use Biome for consistent formatting
4. Leverage TypeScript strict mode
5. Test with Bun test framework

This boilerplate provides an excellent foundation for building the focus extension with AI-powered content analysis and blocking capabilities.