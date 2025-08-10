# Caching Implementation Guide

## Overview

This document describes the comprehensive caching system implemented in the Delivery Analytics Dashboard. The caching system provides multiple layers of caching to optimize performance and reduce redundant API calls.

## Architecture

### Multi-Layer Caching Strategy

1. **Memory Cache** - Fastest access, in-memory storage
2. **Local Storage Cache** - Persistent across browser sessions
3. **Server-Side Cache** - API route caching with Next.js
4. **Browser Cache** - Static asset caching with HTTP headers

## Components

### 1. Cache Utilities (`lib/cache-utils.ts`)

The core caching system provides:

- **MemoryCache Class**: In-memory caching with TTL support
- **LocalStorageCache Class**: Browser storage with automatic cleanup
- **CachedAPIClient**: Cache-aware API client
- **useCachedData Hook**: React hook for cache-aware data fetching
- **CacheMonitor**: Performance monitoring and statistics

#### Key Features:

```typescript
// Memory cache with TTL
memoryCache.set('key', data, 5 * 60 * 1000) // 5 minutes

// Local storage with automatic cleanup
localStorageCache.set('key', data, 30 * 60 * 1000) // 30 minutes

// Cache-aware data fetching
const data = await cachedFetch('key', fetcher, { ttl: CACHE_TTL.LONG })

// Cache invalidation
invalidateCache('specific_key') // Clear specific cache
invalidateCache() // Clear all caches
```

### 2. Cache-Aware Data Processing (`lib/data-processing-cached.ts`)

Enhanced data processing with built-in caching:

```typescript
// Load data with automatic caching
const data = await loadAndProcessData(forceRefresh)

// Invalidate related caches when data changes
invalidateDataCaches()
```

### 3. API Route Caching

Server-side caching for API routes:

```typescript
// API route with caching
export const revalidate = 300 // 5 minutes
const serverCache = new Map()

// Check cache before processing
if (!forceRefresh && serverCache.has(cacheKey)) {
  return cachedResponse
}
```

### 4. Next.js Configuration

HTTP header caching for static assets:

```javascript
// next.config.mjs
async headers() {
  return [
    {
      source: '/api/(.*)',
      headers: [
        {
          key: 'Cache-Control',
          value: 'public, max-age=300, stale-while-revalidate=600',
        },
      ],
    },
    {
      source: '/_next/static/(.*)',
      headers: [
        {
          key: 'Cache-Control',
          value: 'public, max-age=31536000, immutable',
        },
      ],
    },
  ]
}
```

## Cache Keys

Standardized cache keys for different data types:

```typescript
export const CACHE_KEYS = {
  DELIVERY_DATA: 'delivery_data',
  DEALER_ANALYTICS: 'dealer_analytics',
  PRODUCT_TRENDS: 'product_trends',
  MONTHLY_BREAKDOWN: 'monthly_breakdown',
  CSV_FILES: 'csv_files',
  STATS: 'stats',
  FILTERED_DATA: 'filtered_data',
}
```

## Cache TTL (Time To Live)

Configurable TTL values:

```typescript
export const CACHE_TTL = {
  SHORT: 2 * 60 * 1000,      // 2 minutes
  MEDIUM: 5 * 60 * 1000,     // 5 minutes
  LONG: 15 * 60 * 1000,      // 15 minutes
  VERY_LONG: 60 * 60 * 1000, // 1 hour
}
```

## Usage Examples

### 1. Basic Data Fetching with Cache

```typescript
import { cachedFetch, CACHE_KEYS, CACHE_TTL } from '@/lib/cache-utils'

const data = await cachedFetch(
  CACHE_KEYS.DELIVERY_DATA,
  () => fetchDataFromAPI(),
  {
    ttl: CACHE_TTL.LONG,
    forceRefresh: false,
    useLocalStorage: true
  }
)
```

### 2. React Hook for Cached Data

```typescript
import { useCachedData } from '@/lib/cache-utils'

function MyComponent() {
  const { data, loading, error, refresh } = useCachedData(
    CACHE_KEYS.DEALER_ANALYTICS,
    () => fetchDealerAnalytics(),
    { ttl: CACHE_TTL.MEDIUM }
  )

  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>

  return <div>{/* Render data */}</div>
}
```

### 3. API Client with Cache

```typescript
import { CachedAPIClient } from '@/lib/cache-utils'

const apiClient = new CachedAPIClient()

// GET request with caching
const data = await apiClient.get('/api/mongodb/get-delivery-data', {
  cacheKey: CACHE_KEYS.DELIVERY_DATA,
  ttl: CACHE_TTL.MEDIUM
})

// POST request with cache invalidation
await apiClient.post('/api/mongodb/store-delivery-data', data, {
  invalidateCache: [CACHE_KEYS.DELIVERY_DATA, CACHE_KEYS.STATS]
})
```

### 4. Cache Invalidation

```typescript
import { invalidateCache, CACHE_KEYS } from '@/lib/cache-utils'

// Clear specific cache
invalidateCache(CACHE_KEYS.DELIVERY_DATA)

// Clear all caches
invalidateCache()

// Clear related caches after data import
const importData = (newData, mode) => {
  if (mode === "replace") {
    invalidateCache(CACHE_KEYS.DELIVERY_DATA)
    invalidateCache(CACHE_KEYS.STATS)
    invalidateCache(CACHE_KEYS.DEALER_ANALYTICS)
  }
}
```

## Cache Management UI

The cache management component (`components/cache-management.tsx`) provides:

- **Performance Metrics**: Hit rate, cache efficiency, request counts
- **Cache Statistics**: Memory and local storage usage
- **Cache Actions**: Clear specific or all caches
- **Real-time Monitoring**: Live cache statistics
- **Configuration Display**: Current TTL settings

Access via: `/settings/cache`

## Performance Benefits

### 1. Reduced API Calls
- Cached data eliminates redundant database queries
- Automatic cache invalidation ensures data freshness
- Configurable TTL prevents stale data

### 2. Improved User Experience
- Faster page loads with cached data
- Reduced loading states
- Persistent data across browser sessions

### 3. Server Load Reduction
- Fewer database connections
- Reduced API processing overhead
- Better scalability

### 4. Network Optimization
- Reduced bandwidth usage
- Faster subsequent requests
- Offline capability with local storage

## Monitoring and Debugging

### Cache Statistics

```typescript
import { cacheMonitor } from '@/lib/cache-utils'

// Get cache performance stats
const stats = cacheMonitor.getStats()
console.log('Cache hit rate:', stats.hitRate)
console.log('Total requests:', stats.totalRequests)
```

### Debug Mode

Enable cache debugging in development:

```typescript
// Add to your component or utility
if (process.env.NODE_ENV === 'development') {
  console.log('Cache hit:', cacheMonitor.getStats())
}
```

## Best Practices

### 1. Cache Key Naming
- Use descriptive, consistent names
- Include parameters in cache keys
- Use the predefined `CACHE_KEYS` constants

### 2. TTL Selection
- **Short TTL (2-5 min)**: Frequently changing data
- **Medium TTL (5-15 min)**: Moderately changing data
- **Long TTL (15-60 min)**: Stable data
- **Very Long TTL (1+ hour)**: Static reference data

### 3. Cache Invalidation
- Invalidate related caches when data changes
- Use specific cache keys for targeted invalidation
- Consider cache dependencies

### 4. Memory Management
- Monitor cache size in production
- Implement cache size limits if needed
- Clear old cache entries periodically

## Troubleshooting

### Common Issues

1. **Stale Data**
   - Check TTL settings
   - Verify cache invalidation logic
   - Use `forceRefresh: true` for testing

2. **Memory Leaks**
   - Monitor cache size
   - Clear caches periodically
   - Check for circular references

3. **Performance Issues**
   - Review cache hit rates
   - Optimize cache key generation
   - Consider cache warming strategies

### Debug Commands

```typescript
// Check cache status
console.log('Memory cache size:', memoryCache['cache'].size)
console.log('Local storage keys:', Object.keys(localStorage))

// Clear all caches
invalidateCache()

// Force refresh specific data
const data = await cachedFetch('key', fetcher, { forceRefresh: true })
```

## Migration Guide

### From Old Caching System

1. Replace direct API calls with `cachedFetch`
2. Update data context to use new caching
3. Add cache invalidation to data modification functions
4. Update components to use `useCachedData` hook

### Example Migration

```typescript
// Before
const data = await fetch('/api/data')

// After
const data = await cachedFetch(
  CACHE_KEYS.DELIVERY_DATA,
  () => fetch('/api/data'),
  { ttl: CACHE_TTL.MEDIUM }
)
```

## Future Enhancements

1. **Redis Integration**: Server-side distributed caching
2. **Cache Warming**: Pre-populate frequently accessed data
3. **Advanced Analytics**: Detailed cache performance metrics
4. **Cache Compression**: Reduce memory usage
5. **Background Refresh**: Update cache in background

## Conclusion

The caching system provides a robust, multi-layer approach to performance optimization. By implementing these caching strategies, the application achieves:

- **Faster Response Times**: Reduced API calls and database queries
- **Better User Experience**: Persistent data and reduced loading states
- **Improved Scalability**: Reduced server load and bandwidth usage
- **Enhanced Reliability**: Graceful fallbacks and error handling

The system is designed to be flexible, maintainable, and easily extensible for future requirements.
