/**
 * Button component for interactive UI elements.
 * This component provides a versatile button with multiple variants, sizes,
 * and styling options built on Radix UI primitives.
 */

import { Slot } from "@radix-ui/react-slot";
import { type VariantProps, cva } from "class-variance-authority";
import * as React from "react";

import { cn } from "~/lib/utils";

/**
 * Button variant configurations using class-variance-authority
 */
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        /** Default primary button style */
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        /** Destructive button for dangerous actions */
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        /** Outline button with border and transparent background */
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        /** Secondary button with muted colors */
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        /** Ghost button with hover effects only */
        ghost: "hover:bg-accent hover:text-accent-foreground",
        /** Link-style button with underline */
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        /** Default button size */
        default: "h-10 px-4 py-2",
        /** Small button size */
        sm: "h-9 rounded-md px-3",
        /** Large button size */
        lg: "h-11 rounded-md px-8",
        /** Icon button size (square) */
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

/**
 * Props for the Button component
 */
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /** Whether to render as Slot component for composition */
  asChild?: boolean;
}

/**
 * Button component for interactive UI elements.
 * Provides a flexible button implementation with multiple variants, sizes,
 * and accessibility features. Supports composition with other components
 * through Radix UI Slot when asChild is true.
 *
 * @example
 * ```tsx
 * <Button>Click me</Button>
 * ```
 *
 * @example
 * ```tsx
 * <Button variant="destructive" size="sm">Delete</Button>
 * <Button variant="outline" size="lg">Cancel</Button>
 * <Button variant="ghost" asChild>
 *   <Link href="/home">Home</Link>
 * </Button>
 * ```
 *
 * @param props - Component props including variant, size, and standard button attributes
 * @returns A React element containing the button
 */
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
