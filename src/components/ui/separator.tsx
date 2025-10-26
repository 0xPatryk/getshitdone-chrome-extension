/**
 * Separator component for visual content division.
 * This component provides a visual separator line for dividing
 * content sections, built on Radix UI primitives.
 */

"use client";

import * as SeparatorPrimitive from "@radix-ui/react-separator";
import * as React from "react";

import { cn } from "~/lib/utils";

/**
 * Separator component for visual content division.
 * Provides a visual separator line (horizontal or vertical) for
 * dividing content sections. Can be decorative or semantic.
 *
 * @example
 * ```tsx
 * <Separator />
 * <Separator orientation="vertical" />
 * ```
 *
 * @example
 * ```tsx
 * <Separator decorative={false} aria-label="Section divider" />
 * ```
 *
 * @param props - Component props including orientation and decorative settings
 * @returns A React element containing the separator
 */
const Separator = React.forwardRef<
  React.ElementRef<typeof SeparatorPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SeparatorPrimitive.Root>
>(
  (
    { className, orientation = "horizontal", decorative = true, ...props },
    ref,
  ) => (
    <SeparatorPrimitive.Root
      ref={ref}
      decorative={decorative}
      orientation={orientation}
      className={cn(
        "shrink-0 bg-border",
        orientation === "horizontal" ? "h-[1px] w-full" : "h-full w-[1px]",
        className,
      )}
      {...props}
    />
  ),
);
Separator.displayName = SeparatorPrimitive.Root.displayName;

export { Separator };
