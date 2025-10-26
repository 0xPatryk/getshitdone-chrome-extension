/**
 * Error boundary component for handling React component errors gracefully.
 * This component catches JavaScript errors in its child component tree,
 * logs error information, and displays a fallback UI instead of crashing.
 */

import { Component } from "react";

import type { ReactElement } from "react";

/**
 * Default error content displayed when an error occurs.
 * Shows a user-friendly error message with styling.
 *
 * @returns A React element displaying an error message
 */
const ErrorContent = () => {
  return (
    <div className="flex w-full min-w-64 items-center justify-center px-10 py-16">
      <span className="text-center text-destructive">
        Something went wrong. Please try again later.
      </span>
    </div>
  );
};

/**
 * React error boundary class component that catches and handles errors.
 * Implements the React error boundary lifecycle methods to catch errors,
 * log them, and display a fallback UI.
 */
class ReactErrorBoundary extends Component<
  {
    /** Child components to be wrapped by the error boundary */
    children: ReactElement;
    /** Fallback component to render when an error occurs */
    fallback: ReactElement;
  },
  {
    /** State tracking whether an error has been caught */
    hasError: boolean;
  }
> {
  state = { hasError: false };

  /**
   * Updates state when an error is caught in child components.
   * Called by React when an error is thrown during rendering.
   *
   * @returns New state with hasError set to true
   */
  static getDerivedStateFromError() {
    return { hasError: true };
  }

  /**
   * Logs error information for debugging purposes.
   * Called when an error is caught by the boundary.
   *
   * @param error - The error that was thrown
   * @param errorInfo - Additional error information from React
   */
  componentDidCatch(error: unknown, errorInfo: unknown) {
    console.error("Error boundary caught an error:", {
      error: error instanceof Error ? error.message : String(error),
      componentStack: errorInfo,
      timestamp: new Date().toISOString(),
      userAgent:
        typeof navigator !== "undefined" ? navigator.userAgent : "Unknown",
    });
  }

  /**
   * Renders either the children or the fallback based on error state.
   *
   * @returns Child components if no error, otherwise fallback component
   */
  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }

    return this.props.children;
  }
}

/**
 * Error boundary functional component wrapper.
 * Provides a convenient interface for using the React error boundary
 * with a default fallback component.
 *
 * @example
 * ```tsx
 * <ErrorBoundary>
 *   <MyComponent />
 * </ErrorBoundary>
 * ```
 *
 * @example
 * ```tsx
 * <ErrorBoundary fallback={<CustomErrorFallback />}>
 *   <MyComponent />
 * </ErrorBoundary>
 * ```
 *
 * @param props - Component props
 * @param props.children - Child components to wrap with error boundary
 * @param props.fallback - Optional custom fallback component to show on error
 * @returns A React element with error boundary protection
 */
export const ErrorBoundary = ({
  children,
  fallback = <ErrorContent />,
}: {
  children: ReactElement;
  fallback?: ReactElement;
}) => {
  return (
    <ReactErrorBoundary fallback={fallback}>{children}</ReactErrorBoundary>
  );
};
