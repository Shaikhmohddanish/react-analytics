"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/hooks/use-toast"
import { 
  RefreshCw, 
  Trash2, 
  Database, 
  HardDrive, 
  Memory, 
  Activity,
  TrendingUp,
  Clock,
  AlertTriangle
} from "lucide-react"
import { 
  memoryCache, 
  localStorageCache, 
  cacheMonitor, 
  invalidateCache,
  CACHE_KEYS,
  CACHE_TTL 
} from "@/lib/cache-utils"

interface CacheStats {
  memorySize: number
  localStorageSize: number
  memoryKeys: string[]
  localStorageKeys: string[]
  hitRate: number
  totalRequests: number
  cacheEfficiency: number
}

export function CacheManagement() {
  const [stats, setStats] = useState<CacheStats>({
    memorySize: 0,
    localStorageSize: 0,
    memoryKeys: [],
    localStorageKeys: [],
    hitRate: 0,
    totalRequests: 0,
    cacheEfficiency: 0
  })
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const calculateStats = (): CacheStats => {
    // Get cache monitor stats
    const monitorStats = cacheMonitor.getStats()
    
    // Calculate hit rate
    let totalHits = 0
    let totalMisses = 0
    Object.values(monitorStats).forEach(stat => {
      totalHits += stat.hits
      totalMisses += stat.misses
    })
    
    const totalRequests = totalHits + totalMisses
    const hitRate = totalRequests > 0 ? (totalHits / totalRequests) * 100 : 0
    
    // Estimate memory usage (rough calculation)
    const memoryKeys = Array.from(memoryCache['cache'].keys())
    const localStorageKeys = Object.keys(localStorage).filter(key => 
      key.startsWith('delivery_analytics_cache_')
    )
    
    // Calculate cache efficiency based on hit rate and size
    const cacheEfficiency = Math.min(100, hitRate + (100 - (memoryKeys.length / 10)))
    
    return {
      memorySize: memoryKeys.length,
      localStorageSize: localStorageKeys.length,
      memoryKeys,
      localStorageKeys,
      hitRate,
      totalRequests,
      cacheEfficiency
    }
  }

  const refreshStats = () => {
    setStats(calculateStats())
  }

  const clearMemoryCache = () => {
    memoryCache.clear()
    refreshStats()
    toast({
      title: "Memory cache cleared",
      description: "All memory cache entries have been removed",
    })
  }

  const clearLocalStorageCache = () => {
    localStorageCache.clear()
    refreshStats()
    toast({
      title: "Local storage cache cleared",
      description: "All local storage cache entries have been removed",
    })
  }

  const clearAllCaches = () => {
    invalidateCache()
    refreshStats()
    toast({
      title: "All caches cleared",
      description: "Memory and local storage caches have been cleared",
    })
  }

  const clearSpecificCache = (key: string) => {
    invalidateCache(key)
    refreshStats()
    toast({
      title: "Cache cleared",
      description: `Cache for "${key}" has been cleared`,
    })
  }

  useEffect(() => {
    refreshStats()
    
    // Refresh stats every 30 seconds
    const interval = setInterval(refreshStats, 30000)
    
    return () => clearInterval(interval)
  }, [])

  const getCacheKeyDisplayName = (key: string) => {
    const displayNames: Record<string, string> = {
      [CACHE_KEYS.DELIVERY_DATA]: "Delivery Data",
      [CACHE_KEYS.DEALER_ANALYTICS]: "Dealer Analytics",
      [CACHE_KEYS.PRODUCT_TRENDS]: "Product Trends",
      [CACHE_KEYS.MONTHLY_BREAKDOWN]: "Monthly Breakdown",
      [CACHE_KEYS.CSV_FILES]: "CSV Files",
      [CACHE_KEYS.STATS]: "Statistics",
      [CACHE_KEYS.FILTERED_DATA]: "Filtered Data",
    }
    return displayNames[key] || key
  }

  const getCacheKeyIcon = (key: string) => {
    if (key.includes('delivery')) return <Database className="h-4 w-4" />
    if (key.includes('analytics')) return <TrendingUp className="h-4 w-4" />
    if (key.includes('csv')) return <HardDrive className="h-4 w-4" />
    if (key.includes('stats')) return <Activity className="h-4 w-4" />
    return <Clock className="h-4 w-4" />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Cache Management</h2>
          <p className="text-muted-foreground">
            Monitor and manage application caching for optimal performance
          </p>
        </div>
        <Button onClick={refreshStats} disabled={loading}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh Stats
        </Button>
      </div>

      {/* Cache Performance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cache Hit Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.hitRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalRequests} total requests
            </p>
            <Progress value={stats.hitRate} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Memory Cache</CardTitle>
            <Memory className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.memorySize}</div>
            <p className="text-xs text-muted-foreground">
              Active cache entries
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Local Storage</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.localStorageSize}</div>
            <p className="text-xs text-muted-foreground">
              Persistent cache entries
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Cache Efficiency */}
      <Card>
        <CardHeader>
          <CardTitle>Cache Efficiency</CardTitle>
          <CardDescription>
            Overall cache performance and optimization metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Efficiency Score</span>
              <Badge variant={stats.cacheEfficiency > 80 ? "default" : stats.cacheEfficiency > 60 ? "secondary" : "destructive"}>
                {stats.cacheEfficiency.toFixed(1)}%
              </Badge>
            </div>
            <Progress value={stats.cacheEfficiency} className="h-2" />
            <div className="text-xs text-muted-foreground">
              {stats.cacheEfficiency > 80 ? "Excellent" : stats.cacheEfficiency > 60 ? "Good" : "Needs improvement"}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cache Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Cache Actions</CardTitle>
          <CardDescription>
            Clear specific caches or all cached data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={clearMemoryCache}>
              <Memory className="h-4 w-4 mr-2" />
              Clear Memory Cache
            </Button>
            <Button variant="outline" onClick={clearLocalStorageCache}>
              <HardDrive className="h-4 w-4 mr-2" />
              Clear Local Storage
            </Button>
            <Button variant="destructive" onClick={clearAllCaches}>
              <Trash2 className="h-4 w-4 mr-2" />
              Clear All Caches
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Active Cache Entries */}
      <Card>
        <CardHeader>
          <CardTitle>Active Cache Entries</CardTitle>
          <CardDescription>
            Currently cached data and their status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {stats.memoryKeys.length === 0 && stats.localStorageKeys.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
                <p>No active cache entries</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Memory Cache Entries */}
                <div>
                  <h4 className="font-medium mb-2 flex items-center">
                    <Memory className="h-4 w-4 mr-2" />
                    Memory Cache ({stats.memoryKeys.length})
                  </h4>
                  <div className="space-y-2">
                    {stats.memoryKeys.slice(0, 10).map((key) => (
                      <div key={key} className="flex items-center justify-between p-2 bg-muted rounded-md">
                        <div className="flex items-center space-x-2">
                          {getCacheKeyIcon(key)}
                          <span className="text-sm">{getCacheKeyDisplayName(key)}</span>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => clearSpecificCache(key)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                    {stats.memoryKeys.length > 10 && (
                      <div className="text-xs text-muted-foreground">
                        +{stats.memoryKeys.length - 10} more entries
                      </div>
                    )}
                  </div>
                </div>

                {/* Local Storage Entries */}
                <div>
                  <h4 className="font-medium mb-2 flex items-center">
                    <HardDrive className="h-4 w-4 mr-2" />
                    Local Storage ({stats.localStorageKeys.length})
                  </h4>
                  <div className="space-y-2">
                    {stats.localStorageKeys.slice(0, 10).map((key) => (
                      <div key={key} className="flex items-center justify-between p-2 bg-muted rounded-md">
                        <div className="flex items-center space-x-2">
                          {getCacheKeyIcon(key)}
                          <span className="text-sm">{getCacheKeyDisplayName(key.replace('delivery_analytics_cache_', ''))}</span>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => clearSpecificCache(key.replace('delivery_analytics_cache_', ''))}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                    {stats.localStorageKeys.length > 10 && (
                      <div className="text-xs text-muted-foreground">
                        +{stats.localStorageKeys.length - 10} more entries
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Cache Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Cache Configuration</CardTitle>
          <CardDescription>
            Current cache settings and TTL values
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-2">Cache TTL Settings</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Short Cache:</span>
                  <span>{CACHE_TTL.SHORT / 1000 / 60} minutes</span>
                </div>
                <div className="flex justify-between">
                  <span>Medium Cache:</span>
                  <span>{CACHE_TTL.MEDIUM / 1000 / 60} minutes</span>
                </div>
                <div className="flex justify-between">
                  <span>Long Cache:</span>
                  <span>{CACHE_TTL.LONG / 1000 / 60} minutes</span>
                </div>
                <div className="flex justify-between">
                  <span>Very Long Cache:</span>
                  <span>{CACHE_TTL.VERY_LONG / 1000 / 60} minutes</span>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-2">Cache Features</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Memory caching enabled</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Local storage persistence</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Automatic cache invalidation</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Performance monitoring</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
