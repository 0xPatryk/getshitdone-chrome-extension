/**
 * Suspense wrapper component for handling loading states in React.
 * This component provides a wrapper around React's Suspense with a default
 * loading indicator that displays a spinning loader icon.
 */

import { Loader2 } from "lucide-react";
import { Suspense as ReactSuspense } from "react";

import type { ReactElement } from "react";

/**
 * Default loading component displayed during suspense loading.
 * Shows a centered spinning loader icon with appropriate spacing.
 *
 * @returns A React element containing a loading spinner
 */
const Loading = () => {
  return (
    <div className="flex w-full min-w-64 items-center justify-center py-16">
      <Loader2 className="animate-spin" />
    </div>
  );
};

/**
 * Suspense wrapper component for handling lazy-loaded components.
 * Provides a convenient wrapper around React's Suspense with a default
 * loading fallback component.
 *
 * @example
 * ```tsx
 * <Suspense>
 *   <LazyComponent />
 * </Suspense>
 * ```
 *
 * @example
 * ```tsx
 * <Suspense fallback={<CustomLoading />}>
 *   <LazyComponent />
 * </Suspense>
 * ```
 *
 * @param props - Component props
 * @param props.children - The lazy-loaded child components to wrap
 * @param props.fallback - Optional custom loading component to show while loading
 * @returns A React element with suspense loading handling
 */
export const Suspense = ({
  children,
  fallback = <Loading />,
}: {
  children: ReactElement;
  fallback?: ReactElement;
}) => {
  return <ReactSuspense fallback={fallback}>{children}</ReactSuspense>;
};
