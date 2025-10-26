/**
 * Header component for displaying navigation controls.
 * This component renders a header with a settings button and theme switcher,
 * providing access to extension settings and theme toggling functionality.
 */

import { Settings } from "lucide-react";
import { ThemeSwitch } from "~/components/common/theme";
import { buttonVariants } from "~/components/ui/button";
import { cn } from "~/lib/utils";

/**
 * Header component that displays navigation controls for the extension.
 * Renders a settings button that opens the settings page in a new tab
 * and includes the theme switcher for toggling between light and dark modes.
 *
 * @example
 * ```tsx
 * <Header />
 * ```
 *
 * @returns A React element containing the header with controls
 */
export const Header = () => {
  return (
    <header className="flex items-center justify-center gap-2">
      <a
        href="/tabs.html#settings"
        target="_blank"
        rel="noreferrer"
        className={cn(
          buttonVariants({
            variant: "outline",
            size: "icon",
          }),
          "rounded-full",
        )}
        aria-label="Open settings"
      >
        <Settings className="size-5" />
        <span className="sr-only">Settings</span>
      </a>
      <ThemeSwitch />
    </header>
  );
};
