/**
 * Comprehensive Caching Utilities for the Delivery Analytics Dashboard
 * 
 * This module provides multiple caching strategies:
 * 1. Memory caching for expensive computations
 * 2. Local storage caching for client-side data
 * 3. Cache invalidation utilities
 * 4. Cache-aware data fetching
 */

// Memory cache for expensive computations
class MemoryCache {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

  set(key: string, data: any, ttl: number = 5 * 60 * 1000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  get(key: string): any | null {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  has(key: string): boolean {
    return this.cache.has(key) && this.get(key) !== null;
  }
}

// Local storage cache for client-side data
class LocalStorageCache {
  private prefix = 'delivery_analytics_cache_';

  set(key: string, data: any, ttl: number = 30 * 60 * 1000): void {
    try {
      const item = {
        data,
        timestamp: Date.now(),
        ttl
      };
      localStorage.setItem(this.prefix + key, JSON.stringify(item));
    } catch (error) {
      console.warn('Failed to set localStorage cache:', error);
    }
  }

  get(key: string): any | null {
    try {
      const item = localStorage.getItem(this.prefix + key);
      if (!item) return null;

      const parsed = JSON.parse(item);
      if (Date.now() - parsed.timestamp > parsed.ttl) {
        this.delete(key);
        return null;
      }

      return parsed.data;
    } catch (error) {
      console.warn('Failed to get localStorage cache:', error);
      return null;
    }
  }

  delete(key: string): void {
    try {
      localStorage.removeItem(this.prefix + key);
    } catch (error) {
      console.warn('Failed to delete localStorage cache:', error);
    }
  }

  clear(): void {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(this.prefix)) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.warn('Failed to clear localStorage cache:', error);
    }
  }
}

// Cache keys for different data types
export const CACHE_KEYS = {
  DELIVERY_DATA: 'delivery_data',
  DEALER_ANALYTICS: 'dealer_analytics',
  PRODUCT_TRENDS: 'product_trends',
  MONTHLY_BREAKDOWN: 'monthly_breakdown',
  CSV_FILES: 'csv_files',
  STATS: 'stats',
  FILTERED_DATA: 'filtered_data',
} as const;

// Cache TTL constants (in milliseconds)
export const CACHE_TTL = {
  SHORT: 2 * 60 * 1000,      // 2 minutes
  MEDIUM: 5 * 60 * 1000,     // 5 minutes
  LONG: 15 * 60 * 1000,      // 15 minutes
  VERY_LONG: 60 * 60 * 1000, // 1 hour
} as const;

// Global cache instances
export const memoryCache = new MemoryCache();
export const localStorageCache = new LocalStorageCache();

/**
 * Cache-aware data fetcher with automatic fallback
 */
export async function cachedFetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: {
    ttl?: number;
    useLocalStorage?: boolean;
    forceRefresh?: boolean;
  } = {}
): Promise<T> {
  const { ttl = CACHE_TTL.MEDIUM, useLocalStorage = true, forceRefresh = false } = options;

  // Check memory cache first (fastest)
  if (!forceRefresh && memoryCache.has(key)) {
    return memoryCache.get(key);
  }

  // Check localStorage cache
  if (!forceRefresh && useLocalStorage) {
    const cached = localStorageCache.get(key);
    if (cached) {
      // Also store in memory cache for faster subsequent access
      memoryCache.set(key, cached, ttl);
      return cached;
    }
  }

  // Fetch fresh data
  try {
    const data = await fetcher();
    
    // Store in both caches
    memoryCache.set(key, data, ttl);
    if (useLocalStorage) {
      localStorageCache.set(key, data, ttl);
    }
    
    return data;
  } catch (error) {
    console.error(`Failed to fetch data for key: ${key}`, error);
    throw error;
  }
}

/**
 * Cache invalidation utilities
 */
export function invalidateCache(pattern?: string): void {
  if (pattern) {
    // Invalidate specific cache keys
    memoryCache.delete(pattern);
    localStorageCache.delete(pattern);
  } else {
    // Clear all caches
    memoryCache.clear();
    localStorageCache.clear();
  }
}

/**
 * Cache-aware API client
 */
export class CachedAPIClient {
  private baseURL: string;

  constructor(baseURL: string = '/api') {
    this.baseURL = baseURL;
  }

  async get<T>(
    endpoint: string,
    options: {
      cacheKey?: string;
      ttl?: number;
      forceRefresh?: boolean;
      params?: Record<string, string>;
    } = {}
  ): Promise<T> {
    const { cacheKey, ttl, forceRefresh, params } = options;
    const key = cacheKey || `${endpoint}_${JSON.stringify(params || {})}`;

    return cachedFetch(
      key,
      async () => {
        const url = new URL(`${this.baseURL}${endpoint}`, window.location.origin);
        if (params) {
          Object.entries(params).forEach(([key, value]) => {
            url.searchParams.append(key, value);
          });
        }

        const response = await fetch(url.toString());
        if (!response.ok) {
          throw new Error(`API request failed: ${response.statusText}`);
        }

        return response.json();
      },
      { ttl, forceRefresh }
    );
  }

  async post<T>(
    endpoint: string,
    data: any,
    options: {
      invalidateCache?: string[];
    } = {}
  ): Promise<T> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    const result = await response.json();

    // Invalidate related caches
    if (options.invalidateCache) {
      options.invalidateCache.forEach(key => {
        invalidateCache(key);
      });
    }

    return result;
  }
}

/**
 * Hook for cache-aware data fetching in React components
 */
export function useCachedData<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: {
    ttl?: number;
    useLocalStorage?: boolean;
    forceRefresh?: boolean;
  } = {}
) {
  const [data, setData] = React.useState<T | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    let mounted = true;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const result = await cachedFetch(key, fetcher, options);
        
        if (mounted) {
          setData(result);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err : new Error('Unknown error'));
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      mounted = false;
    };
  }, [key, options.forceRefresh]);

  const refresh = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await cachedFetch(key, fetcher, { ...options, forceRefresh: true });
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  }, [key, fetcher, options]);

  return { data, loading, error, refresh };
}

/**
 * Cache performance monitoring
 */
export class CacheMonitor {
  private hits = new Map<string, number>();
  private misses = new Map<string, number>();

  recordHit(key: string): void {
    this.hits.set(key, (this.hits.get(key) || 0) + 1);
  }

  recordMiss(key: string): void {
    this.misses.set(key, (this.misses.get(key) || 0) + 1);
  }

  getStats(): Record<string, { hits: number; misses: number; hitRate: number }> {
    const stats: Record<string, { hits: number; misses: number; hitRate: number }> = {};
    
    const allKeys = new Set([...this.hits.keys(), ...this.misses.keys()]);
    
    allKeys.forEach(key => {
      const hits = this.hits.get(key) || 0;
      const misses = this.misses.get(key) || 0;
      const total = hits + misses;
      const hitRate = total > 0 ? (hits / total) * 100 : 0;
      
      stats[key] = { hits, misses, hitRate };
    });
    
    return stats;
  }

  reset(): void {
    this.hits.clear();
    this.misses.clear();
  }
}

export const cacheMonitor = new CacheMonitor();
