# Project Documentation Rules (Non-Obvious Only)

This file provides documentation-specific guidance for agents working in ask mode.

- Extension entry points are in `src/app/` not `src/` - contrary to standard React projects
- WXT framework abstracts Chrome APIs - documentation refers to `#imports` not direct chrome APIs
- Storage system uses WXT's abstraction layer, not native chrome.storage APIs
- Component aliases in `components.json` don't match actual file structure (utils vs lib)
- Environment variables use `VITE_` prefix but are validated through `envin`, not Vite directly
- Test files exist in `src/lib/tests/` but no test script is defined in package.json
- TypeScript config extends `.wxt/tsconfig.json` - base config is hidden in generated files
- Extension permissions are defined in `wxt.config.ts` not manifest.json (auto-generated)
- Internationalization files are in `public/_locales/` not the typical `locales/` directory
- Tailwind CSS v4 uses Vite plugin, not PostCSS plugin like typical v4 setups