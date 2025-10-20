"use client";

import { Moon, Sun } from "lucide-react";
import { memo } from "react";

import { Button } from "~/components/ui/button";
import { StorageKey, useStorage } from "~/lib/storage";
import { cn } from "~/lib/utils";
import { Theme } from "~/types";

type ThemeSwitchProps = {
  readonly className?: string;
};

export const ThemeSwitch = memo<ThemeSwitchProps>(({ className }) => {
  const { data: currentTheme, set: setTheme } = useStorage(StorageKey.THEME);

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
    >
      <Sun className="size-5 scale-100 dark:scale-0" />
      <Moon className="absolute size-5 scale-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
});

ThemeSwitch.displayName = "ThemeSwitch";