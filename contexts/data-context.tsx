"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from "react"
import { loadAndProcessData, type ProcessedData } from "@/lib/data-processing"
import { useToast } from "@/hooks/use-toast"

interface DataContextType {
  data: ProcessedData[]
  loading: boolean
  error: string | null
  refreshData: () => Promise<void>
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

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<ProcessedData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const { toast } = useToast()

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const processedData = await loadAndProcessData()
      setData(processedData)
      setLastUpdated(new Date())

      if (processedData.length > 0) {
        toast({
          title: "Data loaded successfully",
          description: `Processed ${processedData.length.toLocaleString()} records`,
        })
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load data"
      setError(errorMessage)
      console.warn("No CSV data found, starting with empty dataset")
      setData([])
      setLastUpdated(new Date())
    } finally {
      setLoading(false)
    }
  }, [toast])

  const refreshData = useCallback(async () => {
    await loadData()
  }, [loadData])

  const importData = useCallback(
    (newData: ProcessedData[], mode: "replace" | "append") => {
      if (mode === "replace") {
        setData(newData)
        toast({
          title: "Data replaced successfully",
          description: `Imported ${newData.length.toLocaleString()} new records`,
        })
      } else {
        setData((prevData) => {
          const combined = [...prevData, ...newData]
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
    [toast],
  )

  useEffect(() => {
    loadData()
  }, [loadData])

  // Calculate stats
  const stats = React.useMemo(() => {
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
  }, [data])

  return (
    <DataContext.Provider
      value={{
        data,
        loading,
        error,
        refreshData,
        importData,
        lastUpdated,
        stats,
      }}
    >
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
