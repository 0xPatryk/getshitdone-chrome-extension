/**
 * Toaster component for displaying toast notifications.
 * This component provides a styled toast notification system
 * using Sonner with theme integration and custom styling.
 */

import { useTheme } from "next-themes";
import { Toaster as Sonner } from "sonner";

/**
 * Props for Toaster component
 */
type ToasterProps = React.ComponentProps<typeof Sonner>;

/**
 * Toaster component for displaying toast notifications.
 * Provides a styled toast notification system using Sonner
 * with automatic theme integration and custom styling classes.
 * Automatically adapts to current theme (light/dark/system).
 *
 * @example
 * ```tsx
 * <Toaster />
 * ```
 *
 * @example
 * ```tsx
 * <Toaster position="top-right" richColors />
 * ```
 *
 * @param props - Component props including standard Sonner props
 * @returns A React element containing the toaster
 */
const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
