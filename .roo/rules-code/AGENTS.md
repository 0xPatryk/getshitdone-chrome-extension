# Project Coding Rules (Non-Obvious Only)

This file provides coding-specific guidance for agents working in code mode.

- Use `~/` alias for imports from `src/` directory (configured in components.json)
- Extension entry points are in `src/app/` directory, not `src/`
- Content scripts must use `createShadowRootUi` for proper DOM isolation and cleanup
- Storage keys use `local:` prefix (e.g., `local:theme`, `local:user`) via WXT storage system
- Import React components with `?react` suffix for SVG files (e.g., `~/assets/logo.svg?react`)
- Use `@webext-core/messaging` for type-safe communication between extension components
- Supabase auth uses custom storage adapter with `local:` prefix for keys
- All storage operations use the `useStorage` hook or `getStorage` utility, not direct chrome.storage
- Extension messaging uses predefined Message constants and typed interfaces
- Components use `readonly` props by default for immutability
- Use `memo` for components that receive props but don't need re-rendering