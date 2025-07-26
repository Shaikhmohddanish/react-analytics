"use client"

import type React from "react"
import { createContext, useContext, useState, useMemo } from "react"
import { useData } from "./data-context"
import type { ProcessedData } from "@/lib/data-processing"

interface FilterState {
  dateRange: {
    from: Date | null
    to: Date | null
  }
  customers: string[]
  categories: string[]
  amountRange: {
    min: number
    max: number
  }
  searchTerm: string
}

interface FilterContextType {
  filters: FilterState
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>
  filteredData: ProcessedData[]
  searchTerm: string
  setSearchTerm: (term: string) => void
  hasActiveFilters: boolean
  clearAllFilters: () => void
  applyQuickFilter: (type: string, value: any) => void
}

const FilterContext = createContext<FilterContextType | undefined>(undefined)

const initialFilters: FilterState = {
  dateRange: { from: null, to: null },
  customers: [],
  categories: [],
  amountRange: { min: 0, max: Number.POSITIVE_INFINITY },
  searchTerm: "",
}

export function FilterProvider({ children }: { children: React.ReactNode }) {
  const { data } = useData()
  const [filters, setFilters] = useState<FilterState>(initialFilters)
  const [searchTerm, setSearchTerm] = useState("")

  const filteredData = useMemo(() => {
    let filtered = data

    // Date range filter
    if (filters.dateRange.from || filters.dateRange.to) {
      filtered = filtered.filter((item) => {
        const itemDate = item.challanDate
        if (filters.dateRange.from && itemDate < filters.dateRange.from) return false
        if (filters.dateRange.to && itemDate > filters.dateRange.to) return false
        return true
      })
    }

    // Customer filter
    if (filters.customers.length > 0) {
      filtered = filtered.filter((item) => filters.customers.includes(item["Customer Name"]))
    }

    // Category filter
    if (filters.categories.length > 0) {
      filtered = filtered.filter((item) => filters.categories.includes(item.category))
    }

    // Amount range filter
    if (filters.amountRange.min > 0 || filters.amountRange.max < Number.POSITIVE_INFINITY) {
      filtered = filtered.filter(
        (item) => item.itemTotal >= filters.amountRange.min && item.itemTotal <= filters.amountRange.max,
      )
    }

    // Enhanced search filter with multiple field matching
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      filtered = filtered.filter((item) => {
        // Search in multiple fields
        const searchableFields = [
          item["Customer Name"],
          item["Item Name"],
          item.category,
          item["Delivery Challan Number"],
          item.month,
          item.year.toString(),
        ]

        return searchableFields.some((field) => field && field.toString().toLowerCase().includes(searchLower))
      })
    }

    return filtered
  }, [data, filters, searchTerm])

  const hasActiveFilters = useMemo(() => {
    return (
      filters.dateRange.from !== null ||
      filters.dateRange.to !== null ||
      filters.customers.length > 0 ||
      filters.categories.length > 0 ||
      filters.amountRange.min > 0 ||
      filters.amountRange.max < Number.POSITIVE_INFINITY ||
      searchTerm.length > 0
    )
  }, [filters, searchTerm])

  const clearAllFilters = () => {
    setFilters(initialFilters)
    setSearchTerm("")
  }

  const applyQuickFilter = (type: string, value: any) => {
    switch (type) {
      case "customer":
        setFilters((prev) => ({
          ...prev,
          customers: [value],
        }))
        // Clear search when applying specific filter
        setSearchTerm("")
        break
      case "category":
        setFilters((prev) => ({
          ...prev,
          categories: [value],
        }))
        // Clear search when applying specific filter
        setSearchTerm("")
        break
      case "dateRange":
        setFilters((prev) => ({
          ...prev,
          dateRange: value,
        }))
        break
      default:
        break
    }
  }

  return (
    <FilterContext.Provider
      value={{
        filters,
        setFilters,
        filteredData,
        searchTerm,
        setSearchTerm,
        hasActiveFilters,
        clearAllFilters,
        applyQuickFilter,
      }}
    >
      {children}
    </FilterContext.Provider>
  )
}

export function useFilter() {
  const context = useContext(FilterContext)
  if (context === undefined) {
    throw new Error("useFilter must be used within a FilterProvider")
  }
  return context
}

// Add this alias for consistent naming
export const useFilters = useFilter;
