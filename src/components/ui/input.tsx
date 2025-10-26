/**
 * Input component for form input fields.
 * This component provides a styled input element with consistent
 * styling and accessibility features.
 */

import * as React from "react";

import { cn } from "~/lib/utils";

/**
 * Props for Input component
 */
export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

/**
 * Input component for form input fields.
 * Provides a styled input element with consistent styling,
 * focus states, and accessibility features. Supports all
 * standard HTML input attributes.
 *
 * @example
 * ```tsx
 * <Input placeholder="Enter text..." />
 * ```
 *
 * @example
 * ```tsx
 * <Input type="password" className="custom-input" />
 * ```
 *
 * @param props - Component props including standard input attributes
 * @returns A React element containing the styled input
 */
const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
