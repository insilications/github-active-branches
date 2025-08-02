import { configManager } from './config';
import type { ConfigManager } from './config';
import type { BranchesData } from './types/types';

export interface CachedData {
  branchesData: BranchesData[] | null;
  defaultBranch: string | null;
}

export interface CacheEntry {
  data: CachedData;
  timestamp: number;
}

export interface CacheStats {
  total: number;
  valid: number;
  expired: number;
  estimatedSizeBytes: number;
}

/**
 * Persistent cache implementation using Violentmonkey's storage API
 * Maintains the same interface as Map for seamless integration
 */
export class PersistentCache {
  keyPrefix: string;
  configManager: ConfigManager;

  constructor(configManager: ConfigManager) {
    this.keyPrefix = 'ghab_'; // GitHub Active Branches cache prefix
    this.configManager = configManager;
  }

  /**
   * Get cached data for a key
   * @param {string} key - Cache key
   * @returns {CacheEntry | undefined} - Cached entry with {data, timestamp} or undefined
   */
  get(key: string): CacheEntry | undefined {
    const storageKey = this.keyPrefix + key;
    return GM_getValue<CacheEntry | undefined>(storageKey, undefined);
  }

  /**
   * Store data in cache
   * @param {string} key - Cache key
   * @param {CacheEntry} cacheEntry - Entry with {data, timestamp}
   */
  set(key: string, cacheEntry: CacheEntry): void {
    const storageKey = this.keyPrefix + key;
    GM_setValue<CacheEntry>(storageKey, cacheEntry);
  }

  /**
   * Check if key exists in cache (regardless of expiration)
   * @param {string} key - Cache key
   * @returns {boolean} - True if key exists
   */
  has(key: string): boolean {
    const storageKey = this.keyPrefix + key;
    const cached = GM_getValue<CacheEntry | undefined>(storageKey, undefined);
    return cached !== undefined;
  }

  /**
   * Delete a specific cache entry
   * @param {string} key - Cache key to delete
   */
  delete(key: string): void {
    const storageKey = this.keyPrefix + key;
    GM_deleteValue(storageKey);
  }

  /**
   * Clean up expired cache entries
   * @param {number} maxAge - Maximum age in milliseconds (default: 5 minutes)
   * @returns {number} - Number of entries cleaned up
   */
  cleanup(maxAge: number = this.configManager.get('CACHE_DURATION')): number {
    const allKeys = GM_listValues();
    const cacheKeys = allKeys.filter((key) => key.startsWith(this.keyPrefix));
    const now = Date.now();

    const expiredKeys = cacheKeys.filter((key: string) => {
      const cached = GM_getValue<CacheEntry | undefined>(key, undefined);
      // return cached && cached.timestamp && now - cached.timestamp > maxAge;
      return cached?.timestamp && now - cached.timestamp > maxAge;
    });

    if (expiredKeys.length > 0) {
      GM_deleteValues(expiredKeys);
      console.log(
        `🧹 [GitHub Active Branches] Cleaned up ${expiredKeys.length} expired cache entries`,
      );
    }

    return expiredKeys.length;
  }

  /**
   * Get cache statistics
   * @param {number} maxAge - Maximum age to consider valid (default: 5 minutes)
   * @returns {CacheStats} - Statistics object with total, valid, expired counts
   */
  getStats(maxAge: number = this.configManager.get('CACHE_DURATION')): CacheStats {
    const allKeys: string[] = GM_listValues();
    const cacheKeys: string[] = allKeys.filter((key: string) => key.startsWith(this.keyPrefix));
    const now = Date.now();

    let validEntries = 0;
    let expiredEntries = 0;
    let totalSize = 0;

    cacheKeys.forEach((key: string) => {
      const cached = GM_getValue<CacheEntry | undefined>(key, undefined);
      if (cached) {
        // Estimate size (rough JSON string length)
        totalSize += JSON.stringify(cached).length;

        if (cached.timestamp && now - cached.timestamp > maxAge) {
          expiredEntries++;
        } else {
          validEntries++;
        }
      }
    });

    return {
      total: cacheKeys.length,
      valid: validEntries,
      expired: expiredEntries,
      estimatedSizeBytes: totalSize,
    };
  }

  /**
   * Clear all cache entries for this userscript
   * @returns {number} - Number of entries cleared
   */
  clear(): number {
    const allKeys: string[] = GM_listValues();
    const cacheKeys: string[] = allKeys.filter((key: string) => key.startsWith(this.keyPrefix));

    if (cacheKeys.length > 0) {
      GM_deleteValues(cacheKeys);
      console.log(`🗑️ [GitHub Active Branches] Cleared ${cacheKeys.length} cache entries`);
    }

    return cacheKeys.length;
  }

  /**
   * Perform maintenance: cleanup expired entries and log stats
   */
  performMaintenance(): void {
    const stats: CacheStats = this.getStats();
    console.log(`📊 [GitHub Active Branches] Cache stats:`, stats);

    const cleaned = this.cleanup();
    console.log(`🧹 [GitHub Active Branches] Cleaned up ${cleaned} expired entries`);

    // If cache is getting large (>100 entries) or has many expired entries, suggest manual cleanup
    if (stats.total > 100 || stats.expired > 20) {
      console.warn(
        `⚠️ [GitHub Active Branches] Cache is large (${stats.total} entries, ${Math.round(stats.estimatedSizeBytes / 1024)}KB). Consider clearing: cache.clear()`,
      );
    }
  }
}

// Initialize persistent cache
export const cache: PersistentCache = new PersistentCache(configManager);

export interface TemporaryCacheData {
  owner: string;
  repo: string;
  defaultBranch: string;
}

export interface TemporaryCache {
  data: TemporaryCacheData;
}

// Initialize temporary cache
export const tempCache: TemporaryCache = {
  data: {
    owner: '',
    repo: '',
    defaultBranch: '',
  },
};
