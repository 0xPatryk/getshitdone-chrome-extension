# Project Debug Rules (Non-Obvious Only)

This file provides debugging-specific guidance for agents working in debug mode.

- Content script debugging requires Chrome DevTools for Extensions, not regular DevTools
- Background service worker logs appear in Chrome://extensions service worker inspector
- Storage debugging: use `local:` prefix when inspecting chrome.storage for extension data
- Extension messaging failures are silent - add console.log in message handlers
- WXT's `createShadowRootUi` cleanup issues manifest as memory leaks in content scripts
- Environment validation can be skipped with `SKIP_ENV_VALIDATION=1` for debugging
- Firefox debugging requires `bun dev:firefox` - Chrome dev commands won't work
- Extension reloads don't always clear storage - manually clear for clean debugging state
- TypeScript `noUncheckedIndexedAccess` causes runtime errors that need explicit type guards
- Content script injection timing varies by page load - add delays for reliable debugging