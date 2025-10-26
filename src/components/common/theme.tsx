/**
 * Theme switcher component for toggling between light and dark themes.
 * This component provides a button that switches the application theme
 * between light and dark modes, storing the preference in browser storage.
 * Uses icons that change based on the current theme state.
 */

"use client";

import { Moon, Sun } from "lucide-react";
import { memo } from "react";

import { Button } from "~/components/ui/button";
import { StorageKey, useStorage } from "~/lib/storage";
import { cn } from "~/lib/utils";
import { Theme } from "~/types";

/**
 * Props for the ThemeSwitch component
 */
type ThemeSwitchProps = {
  /** Optional additional CSS classes for styling */
  readonly className?: string;
};

/**
 * Theme switcher component that allows users to toggle between light and dark themes.
 * The component uses browser storage to persist the theme preference and displays
 * appropriate icons (sun for light mode, moon for dark mode) based on the current state.
 *
 * @example
 * ```tsx
 * <ThemeSwitch />
 * ```
 *
 * @example
 * ```tsx
 * <ThemeSwitch className="absolute top-4 right-4" />
 * ```
 *
 * @param props - Component props
 * @param props.className - Optional CSS classes for additional styling
 * @returns A React element containing the theme toggle button
 */
export const ThemeSwitch = memo<ThemeSwitchProps>(({ className }) => {
  // Get current theme from storage and setter function
  const { data: currentTheme, set: setTheme } = useStorage(StorageKey.THEME);

  /**
   * Toggles between light and dark themes
   * Switches to the opposite theme and saves the preference
   */
  const toggleTheme = () => {
    const newTheme = currentTheme === Theme.LIGHT ? Theme.DARK : Theme.LIGHT;
    setTheme(newTheme);
  };

  return (
    <Button
      variant="outline"
      size="icon"
      className={cn("rounded-full", className)}
      onClick={toggleTheme}
      aria-label="Toggle theme"
    >
      <Sun className="size-5 scale-100 dark:scale-0" />
      <Moon className="absolute size-5 scale-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
});

ThemeSwitch.displayName = "ThemeSwitch";
