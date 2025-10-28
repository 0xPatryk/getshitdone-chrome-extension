/**
 * Cache Hooks Module
 *
 * This module provides React hooks for cache operations using TanStack Query.
 * It offers a simplified interface for cache operations with proper state management.
 *
 * Key features:
 * - TanStack Query integration for cache operations
 * - Simplified cache-first approach
 * - Automatic cache invalidation
 * - Optimistic updates for chat access
 *
 * @module cache.hooks
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { getCachedDecision, setCachedDecision } from "~/lib/cache/services";
import { sendMessage } from "~/lib/messaging";
import { Message } from "~/lib/messaging/types";

/**
 * Hook for getting cached decision with TanStack Query
 */
export const useCachedDecision = (
  url: string,
  task: string,
  alwaysRemove: string | null,
) => {
  return useQuery({
    queryKey: ["cache", url, task, alwaysRemove],
    queryFn: () => getCachedDecision(url, task, alwaysRemove),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Hook for page analysis with cache-first approach
 */
export const usePageAnalysis = (
  url: string,
  task: string,
  alwaysRemove: string | null,
  enabled: boolean,
) => {
  return useQuery({
    queryKey: ["analysis", url, task, alwaysRemove],
    queryFn: async () => {
      // Send page content to background script for analysis
      const response = await sendMessage(Message.ANALYZE_PAGE, {
        url,
        content: document.documentElement.outerHTML,
        alwaysRemove,
      });

      return response;
    },
    enabled,
    staleTime: 0, // Always refetch analysis
  });
};

/**
 * Hook for overwriting cache with chat access
 */
export const useChatAccess = (
  url: string,
  task: string,
  alwaysRemove: string | null,
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (durationMinutes: number) => {
      // Overwrite cache directly
      await setCachedDecision(
        url,
        task,
        alwaysRemove,
        "ALLOW",
        null, // No elements to remove when allowing access
        `Access granted via chat for ${durationMinutes} minutes`,
        durationMinutes * 60 * 1000, // Custom TTL based on duration
      );

      // Invalidate and refetch cache
      queryClient.invalidateQueries({
        queryKey: ["cache", url, task, alwaysRemove],
      });

      // Refresh page to apply new cache entry
      window.location.reload();
    },
  });
};

/**
 * Hook for cache invalidation
 */
export const useCacheInvalidation = () => {
  const queryClient = useQueryClient();

  const invalidateCache = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: ["cache"],
    });
    queryClient.invalidateQueries({
      queryKey: ["analysis"],
    });
  }, [queryClient]);

  const invalidateCacheForUrl = useCallback(
    (url: string, task: string, alwaysRemove: string | null) => {
      queryClient.invalidateQueries({
        queryKey: ["cache", url, task, alwaysRemove],
      });
      queryClient.invalidateQueries({
        queryKey: ["analysis", url, task, alwaysRemove],
      });
    },
    [queryClient],
  );

  return {
    invalidateCache,
    invalidateCacheForUrl,
  };
};
