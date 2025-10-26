/**
 * Main component for displaying welcome content in the extension.
 * This component renders a centered layout with the extension logo,
 * a greeting message with the current filename, and a link to documentation.
 * Used as a landing page for various extension contexts (popup, options, etc.).
 */

import { browser } from "wxt/browser";

import Logo from "~/assets/logo.svg?react";
import { cn } from "~/lib/utils";

/**
 * Props for the Main component
 */
interface MainProps {
  /** Optional additional CSS classes for styling */
  readonly className?: string;
  /** The filename to display in the greeting message */
  readonly filename: string;
}

/**
 * Main component that renders the welcome screen for the extension.
 * Displays the extension logo with a pulse animation, a personalized greeting
 * message showing the current filename, and a link to the documentation.
 *
 * @example
 * ```tsx
 * <Main filename="popup.html" />
 * ```
 *
 * @param props - Component props
 * @param props.className - Optional CSS classes for additional styling
 * @param props.filename - The filename to display in the greeting
 * @returns A React element containing the welcome screen layout
 */
export const Main = ({ className, filename }: MainProps) => {
  return (
    <main
      className={cn(
        "flex flex-col items-center justify-center gap-4",
        className,
      )}
    >
      <Logo className="w-24 animate-pulse text-primary" />
      <p className="text-pretty text-center leading-tight">
        {browser.i18n.getMessage("hello")}{" "}
        <code className="inline-block rounded-sm bg-muted px-1.5 text-sm text-muted-foreground">
          {filename}
        </code>{" "}
        👋
      </p>
      <a
        href="https://turbostarter.dev/docs/extension"
        target="_blank"
        rel="noreferrer"
        className="cursor-pointer text-sm text-primary underline hover:no-underline"
      >
        {browser.i18n.getMessage("learnMore")}
      </a>
    </main>
  );
};
