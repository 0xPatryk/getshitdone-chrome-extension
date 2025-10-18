# Project Architecture Rules (Non-Obvious Only)

This file provides architecture-specific guidance for agents working in architect mode.

- WXT framework generates manifest.json from `wxt.config.ts` - never edit manifest directly
- Extension entry points in `src/app/` follow WXT conventions, not standard React routing
- Content scripts must use `createShadowRootUi` pattern to avoid CSS conflicts with host pages
- Storage layer abstracts chrome.storage with `local:` prefix - all persistence goes through this
- Extension messaging uses `@webext-core/messaging` with predefined Message constants
- Supabase auth requires custom storage adapter to work with extension storage constraints
- Background service worker is the only component that can access all extension APIs directly
- Content scripts are isolated - they must message background script for chrome API access
- Extension supports both Chrome and Firefox with separate build commands but shared codebase
- TypeScript strict mode with `noUncheckedIndexedAccess` requires explicit type safety throughout