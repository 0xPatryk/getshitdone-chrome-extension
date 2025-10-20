# AGENTS.md

This file provides guidance to agents when working with code in this repository.

## Build and Development Commands

- Use `bun dev` for Chrome development, `bun dev:firefox` for Firefox
- Run `bun build:chrome` for production builds (creates both Chrome and Firefox packages)
- Use `bun lint` for Biome linting and `bun lint:fix` to auto-fix issues
- Run `bun typecheck` for TypeScript validation without emitting files
- Tests use Bun test framework (`bun:test`) rather than Vitest despite Vitest being in dependencies
- Run individual tests with `bun test src/lib/tests/utils.test.ts`

## Project Architecture

- WXT framework is used for Chrome extension development with Manifest V3
- Entry points are in `src/app/` directory, not `src/`
- Background scripts are service workers in `src/app/background/`
- Content scripts in `src/app/content/` require proper cleanup to avoid memory leaks
- Use `@webext-core/messaging` for type-safe communication between extension components
- Chrome extension permissions are defined in `wxt.config.ts` with minimal required permissions

## Code Style and Standards

- Uses Biome for formatting with 2-space indentation, 80-character line width, and double quotes
- TypeScript is configured with strict settings including `noUncheckedIndexedAccess: true`
- Follow Conventional Commits with commitlint validation (100-character body limit)
- Use `~/` alias for imports from `src/` directory (configured in components.json)
- Environment variables use `VITE_` prefix and are validated with Zod schemas via `envin`

## Testing and Quality

- Tests use Bun test framework, not Vitest (despite Vitest being installed)
- Test files should be placed in `src/lib/tests/` directory
- Use `import { describe, expect, it } from "bun:test"` for test syntax
- No test script is defined in package.json - run tests directly with `bun test`

## Browser Extension Specifics

- Extension supports both Chrome and Firefox with separate build commands
- Uses Chrome's side panel API for extended UI
- Implements proper Content Security Policy compliance
- Uses `chrome.storage` for persistent data storage
- Icons are auto-generated with `@wxt-dev/auto-icons` module

## Dependencies and Tools

- Uses Bun as the primary package manager and runtime
- Tailwind CSS v4 with Vite integration for styling
- React Hook Form with Zod for form validation
- React Query for server state management
- Supabase for backend services and authentication
- Radix UI primitives with shadcn/ui patterns for components
- Use `context7` mcp for package/service documentations
- Use `sequentional thinking` for reasoning of complex tasks