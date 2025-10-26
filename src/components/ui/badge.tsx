/**
 * Badge component for displaying small status indicators and labels.
 * This component provides a versatile badge UI element with multiple variants
 * for different visual states and contexts.
 */

import { type VariantProps, cva } from "class-variance-authority";
import type { HTMLAttributes } from "react";

import { cn } from "~/lib/utils";

/**
 * Badge variant configurations using class-variance-authority
 */
const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-hidden focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        /** Default badge with primary color and shadow */
        default:
          "border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80",
        /** Secondary badge with muted colors */
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        /** Destructive badge for error states */
        destructive:
          "border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80",
        /** Outline badge with transparent background */
        outline: "text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

/**
 * Props for the Badge component
 */
export interface BadgeProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

/**
 * Badge component for displaying status indicators and labels.
 * Provides a flexible badge UI with multiple variants for different visual
 * states. Supports all standard HTML div attributes and custom styling.
 *
 * @example
 * ```tsx
 * <Badge>Default Badge</Badge>
 * ```
 *
 * @example
 * ```tsx
 * <Badge variant="destructive">Error</Badge>
 * <Badge variant="secondary">Info</Badge>
 * <Badge variant="outline">Outline</Badge>
 * ```
 *
 * @param props - Component props including variant and standard HTML attributes
 * @returns A React element containing the badge
 */
function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
