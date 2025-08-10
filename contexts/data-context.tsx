"use client"

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react"
import { loadAndProcessData, type ProcessedData } from "@/lib/data-processing"
import { useToast } from "@/hooks/use-toast"
import { processInChunks } from "@/lib/data-utils"
import { createDataWorker } from "@/lib/worker-utils"
import { cachedFetch, CACHE_KEYS, CACHE_TTL, invalidateCache, cacheMonitor } from "@/lib/cache-utils"

interface DataContextType {
  data: ProcessedData[]
  loading: boolean
  error: string | null
  refreshData: (forceRefresh?: boolean) => Promise<void>
  importData: (newData: ProcessedData[], mode: "replace" | "append") => void
  lastUpdated: Date | null
  stats: {
    totalSales: number
    totalOrders: number
    totalCustomers: number
    avgOrderValue: number
    topCategory: string
    growthRate: number
  }
}

const DataContext = createContext<DataContextType | undefined>(undefined)

// Data processing function to be used with web worker
const calculateStats = (data: ProcessedData[]) => {
  if (data.length === 0) {
    return {
      totalSales: 0,
      totalOrders: 0,
      totalCustomers: 0,
      avgOrderValue: 0,
      topCategory: "",
      growthRate: 0,
    }
  }

  const totalSales = data.reduce((sum, item) => sum + item.itemTotal, 0)
  const uniqueOrders = new Set(data.map((item) => item["Delivery Challan Number"])).size
  const uniqueCustomers = new Set(data.map((item) => item["Customer Name"])).size
  const avgOrderValue = totalSales / uniqueOrders

  // Category analysis
  const categoryTotals = data.reduce(
    (acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + item.itemTotal
      return acc
    },
    {} as Record<string, number>,
  )

  const topCategory = Object.entries(categoryTotals).sort(([, a], [, b]) => b - a)[0]?.[0] || ""

  // Growth rate calculation (comparing current year vs previous)
  const currentYear = new Date().getFullYear()
  const currentYearData = data.filter((item) => item.year === currentYear)
  const previousYearData = data.filter((item) => item.year === currentYear - 1)

  const currentYearSales = currentYearData.reduce((sum, item) => sum + item.itemTotal, 0)
  const previousYearSales = previousYearData.reduce((sum, item) => sum + item.itemTotal, 0)

  const growthRate = previousYearSales > 0 ? ((currentYearSales - previousYearSales) / previousYearSales) * 100 : 0

  return {
    totalSales,
    totalOrders: uniqueOrders,
    totalCustomers: uniqueCustomers,
    avgOrderValue,
    topCategory,
    growthRate,
  }
}

// Create a worker-based stats calculator
const calculateStatsInWorker = createDataWorker(calculateStats)

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<ProcessedData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [stats, setStats] = useState(calculateStats([])) 
  const { toast } = useToast()
  
  // Use ref to track if component is mounted
  const isMountedRef = React.useRef(false)

  const processDataChunks = useCallback(async (rawData: ProcessedData[]) => {
    // Process data in chunks to prevent UI blocking
    try {
      // For large datasets, process in chunks
      if (rawData.length > 5000) {
        await processInChunks(
          rawData,
          item => {
            // Do any per-item processing here if needed
            return item
          },
          1000, // process 1000 items at a time
          (processed, total) => {
            // Update progress if needed
            console.log(`Processed ${processed}/${total} items`)
          }
        )
      }
      
      // Calculate stats using web worker for large datasets
      if (rawData.length > 2000) {
        const newStats = await calculateStatsInWorker(rawData)
        if (isMountedRef.current) {
          setStats(newStats)
        }
      } else {
        // For smaller datasets, calculate on main thread
        const newStats = calculateStats(rawData)
        if (isMountedRef.current) {
          setStats(newStats)
        }
      }
    } catch (err) {
      console.error("Error processing data chunks:", err)
    }
  }, [])

  const loadData = useCallback(async (forceRefresh = false) => {
    try {
      setLoading(true)
      setError(null)
      
      // Use cached fetch for data loading
      const processedData = await cachedFetch(
        CACHE_KEYS.DELIVERY_DATA,
        () => loadAndProcessData(forceRefresh),
        {
          ttl: CACHE_TTL.LONG,
          forceRefresh,
          useLocalStorage: true
        }
      )
      
      if (isMountedRef.current) {
        setData(processedData)
        setLastUpdated(new Date())
      
        // Process data in background after setting initial data
        processDataChunks(processedData)

        if (processedData.length > 0) {
          toast({
            title: "Data loaded successfully",
            description: `Processed ${processedData.length.toLocaleString()} records`,
          })
        }
      }
    } catch (err) {
      if (isMountedRef.current) {
        const errorMessage = err instanceof Error ? err.message : "Failed to load data"
        setError(errorMessage)
        console.warn("No CSV data found, starting with empty dataset")
        setData([])
        setLastUpdated(new Date())
        setStats(calculateStats([]))
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false)
      }
    }
  }, [toast, processDataChunks])

  const refreshData = useCallback(async (forceRefresh = false) => {
    console.log(`Refreshing data (force: ${forceRefresh})`);
    // Pass true to force refresh and bypass cache
    await loadData(forceRefresh);
    toast({
      title: "Data refreshed",
      description: "The latest data has been loaded"
    });
  }, [loadData, toast])

  const importData = useCallback(
    (newData: ProcessedData[], mode: "replace" | "append") => {
      if (mode === "replace") {
        setData(newData)
        // Process the new data in background
        processDataChunks(newData)
        
        // Invalidate related caches
        invalidateCache(CACHE_KEYS.DELIVERY_DATA)
        invalidateCache(CACHE_KEYS.STATS)
        invalidateCache(CACHE_KEYS.DEALER_ANALYTICS)
        invalidateCache(CACHE_KEYS.PRODUCT_TRENDS)
        
        toast({
          title: "Data replaced successfully",
          description: `Imported ${newData.length.toLocaleString()} new records`,
        })
      } else {
        setData((prevData) => {
          const combined = [...prevData, ...newData]
          // Process the combined data in background
          processDataChunks(combined)
          
          // Invalidate related caches
          invalidateCache(CACHE_KEYS.DELIVERY_DATA)
          invalidateCache(CACHE_KEYS.STATS)
          invalidateCache(CACHE_KEYS.DEALER_ANALYTICS)
          invalidateCache(CACHE_KEYS.PRODUCT_TRENDS)
          
          toast({
            title: "Data appended successfully",
            description: `Added ${newData.length.toLocaleString()} records. Total: ${combined.length.toLocaleString()}`,
          })
          return combined
        })
      }
      setLastUpdated(new Date())
      setError(null)
    },
    [toast, processDataChunks],
  )

  // Set mounted state on mount
  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  // First load of data
  useEffect(() => {
    loadData();
    toast({
      title: "Loading data",
      description: "Loading data from the most recent file"
    });
  }, [loadData, toast])

  const contextValue = useMemo(() => ({
    data,
    loading,
    error,
    refreshData,
    importData,
    lastUpdated,
    stats,
  }), [data, loading, error, refreshData, importData, lastUpdated, stats])

  return (
    <DataContext.Provider value={contextValue}>
      {children}
    </DataContext.Provider>
  )
}

export function useData() {
  const context = useContext(DataContext)
  if (context === undefined) {
    throw new Error("useData must be used within a DataProvider")
  }
  return context
}
