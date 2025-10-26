/**
 * Cache settings component for managing extension cache data.
 * This component provides UI for viewing cache statistics, clearing cache,
 * and managing expired entries to optimize extension performance.
 */

import { useEffect, useState } from "react";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import {
  StorageKey,
  cleanupExpiredCacheEntries,
  clearDecisionCache,
  getCacheStats,
  useStorage,
} from "~/lib/storage";

/**
 * Cache settings component for managing extension cache.
 * Displays cache statistics including total entries, AI decisions, user unblocks,
 * and expired entries. Provides controls for clearing all cache or cleaning up
 * expired entries. Shows cache information and expiration policies.
 *
 * @example
 * ```tsx
 * <CacheSettings />
 * ```
 *
 * @returns A React element containing the cache settings interface
 */
export const CacheSettings = () => {
  const { data: cache, set: setCache } = useStorage(StorageKey.DECISION_CACHE);
  const [stats, setStats] = useState({
    totalEntries: 0,
    aiDecisionEntries: 0,
    userUnblockEntries: 0,
    expiredEntries: 0,
  });

  // Load cache stats on component mount
  useEffect(() => {
    const loadStats = async () => {
      const cacheStats = await getCacheStats();
      setStats(cacheStats);
    };

    loadStats();

    // Refresh stats every 30 seconds
    const interval = setInterval(loadStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleClearCache = async () => {
    await clearDecisionCache();
    // Force re-render
    setCache({});
    // Refresh stats
    const cacheStats = await getCacheStats();
    setStats(cacheStats);
  };

  const handleCleanupExpired = async () => {
    await cleanupExpiredCacheEntries();
    // Refresh stats
    const cacheStats = await getCacheStats();
    setStats(cacheStats);
  };

  return (
    <Card>
      <div className="p-4 space-y-4">
        <div>
          <h3 className="text-lg font-semibold">Cache Settings</h3>
          <p className="text-sm text-muted-foreground">
            Manage cached page analysis decisions to reduce API calls and
            improve performance.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold">{stats.totalEntries}</div>
            <div className="text-sm text-muted-foreground">Total Entries</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{stats.aiDecisionEntries}</div>
            <div className="text-sm text-muted-foreground">AI Decisions</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{stats.userUnblockEntries}</div>
            <div className="text-sm text-muted-foreground">User Unblocks</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              {stats.expiredEntries}
            </div>
            <div className="text-sm text-muted-foreground">Expired</div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button onClick={handleClearCache} variant="outline" size="sm">
            Clear All Cache
          </Button>
          <Button onClick={handleCleanupExpired} variant="outline" size="sm">
            Cleanup Expired
          </Button>
        </div>

        <div className="space-y-2">
          <h4 className="font-medium">Cache Information</h4>
          <div className="text-sm text-muted-foreground space-y-1">
            <p>• AI decisions are cached for 24 hours</p>
            <p>• User unblocks are cached for 1 hour</p>
            <p>• Cache is automatically cleaned every hour</p>
            <p>
              • Cache is invalidated when task or alwaysRemove settings change
            </p>
          </div>
        </div>

        {stats.expiredEntries > 0 && (
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-orange-600">
              {stats.expiredEntries} expired entries
            </Badge>
            <Button onClick={handleCleanupExpired} variant="ghost" size="sm">
              Clean up now
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
};
