/**
 * Main layout component for the extension application.
 * This component provides the overall layout structure including theme handling,
 * error boundaries, suspense loading, and global providers for the extension.
 */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ErrorBoundary } from "~/components/common/error-boundary";
import { Suspense } from "~/components/common/suspense";
import { Footer } from "~/components/layout/footer";
import { Header } from "~/components/layout/header";
import { Toaster } from "~/components/ui/sonner";
import { cn } from "~/lib/utils";
import "~/assets/styles/globals.css";

/**
 * Props for the Layout component
 */
interface LayoutProps {
  /** Child components to be wrapped by the layout */
  readonly children: React.ReactNode;
  /** Optional custom loading fallback component */
  readonly loadingFallback?: React.ReactElement;
  /** Optional custom error fallback component */
  readonly errorFallback?: React.ReactElement;
  /** Optional additional CSS classes for styling */
  readonly className?: string;
}

// Global query client for React Query
const queryClient = new QueryClient();

/**
 * Main layout component that wraps the entire application.
 * Provides React Query client, error boundary, suspense loading,
 * and theme management for the extension. Handles theme detection
 * and applies appropriate dark/light mode classes.
 *
 * @example
 * ```tsx
 * <Layout>
 *   <App />
 * </Layout>
 * ```
 *
 * @example
 * ```tsx
 * <Layout
 *   loadingFallback={<CustomLoader />}
 *   errorFallback={<CustomError />}
 *   className="custom-layout"
 * >
 *   <App />
 * </Layout>
 * ```
 *
 * @param props - Component props
 * @param props.children - Child components to wrap
 * @param props.loadingFallback - Optional custom loading component
 * @param props.errorFallback - Optional custom error component
 * @param props.className - Optional CSS classes
 * @returns A React element containing the wrapped application
 */
export const Layout = ({
  children,
  loadingFallback,
  errorFallback,
  className,
}: LayoutProps) => {
  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary fallback={errorFallback}>
        <Suspense fallback={loadingFallback}>
          <LayoutContent className={className}>{children}</LayoutContent>
        </Suspense>
      </ErrorBoundary>
    </QueryClientProvider>
  );
};

/**
 * Internal layout content component that handles theme and structure.
 * Manages theme application based on user preference and system settings,
 * and renders the main layout structure with header, content area, and footer.
 *
 * @param props - Component props
 * @param props.children - Child components to render in the main content area
 * @param props.className - Optional CSS classes for the content container
 * @returns A React element containing the themed layout structure
 */
const LayoutContent = ({
  children,
  className,
}: { readonly children: React.ReactNode; readonly className?: string }) => {
  return (
    <div
      className={cn(
        "flex min-h-screen bg-background text-foreground w-full min-w-[23rem] flex-col items-center justify-center font-sans text-base dark",
        className,
      )}
    >
      <div
        className={cn(
          "flex w-full max-w-[80rem] grow flex-col items-center justify-between gap-12 p-5",
          className,
        )}
      >
        <Header />
        {children}
        <Footer />
      </div>
      <Toaster />
    </div>
  );
};
