/**
 * Textarea component for multi-line text input.
 * This component provides a styled textarea element with consistent
 * styling and accessibility features.
 */

import * as React from "react";

import { cn } from "~/lib/utils";

/**
 * Props for Textarea component
 */
export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

/**
 * Textarea component for multi-line text input.
 * Provides a styled textarea element with consistent styling,
 * focus states, and accessibility features. Supports all
 * standard HTML textarea attributes.
 *
 * @example
 * ```tsx
 * <Textarea placeholder="Enter your message..." />
 * ```
 *
 * @example
 * ```tsx
 * <Textarea className="custom-textarea" rows={4} />
 * ```
 *
 * @param props - Component props including standard textarea attributes
 * @returns A React element containing the styled textarea
 */
const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Textarea.displayName = "Textarea";

export { Textarea };
