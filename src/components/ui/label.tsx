/**
 * Label component for form field labels.
 * This component provides a styled label element built on Radix UI
 * with consistent styling and accessibility features.
 */

import * as LabelPrimitive from "@radix-ui/react-label";
import { type VariantProps, cva } from "class-variance-authority";
import * as React from "react";

import { cn } from "~/lib/utils";

/**
 * Label variant configurations using class-variance-authority
 */
const labelVariants = cva(
  "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
);

/**
 * Label component for form field labels.
 * Provides a styled label element built on Radix UI primitives
 * with consistent styling and accessibility features. Automatically
 * associates with form inputs through HTML for attribute.
 *
 * @example
 * ```tsx
 * <Label htmlFor="email">Email Address</Label>
 * <Input id="email" type="email" />
 * ```
 *
 * @param props - Component props including standard label attributes
 * @returns A React element containing the styled label
 */
const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> &
    VariantProps<typeof labelVariants>
>(({ className, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn(labelVariants(), className)}
    {...props}
  />
));
Label.displayName = LabelPrimitive.Root.displayName;

export { Label };
