"use client"

import type React from "react"
import { createContext, useContext, useState, useMemo, useCallback, useRef, useEffect } from "react"
import { useData } from "./data-context"
import type { ProcessedData } from "@/lib/data-processing"
import { debounce, processInChunks } from "@/lib/data-utils"

interface FilterState {
  dateRange: {
    from: Date | null
    to: Date | null
  }
  customers: string[]
  categories: string[]
  challanTypes: string[]
  statuses: string[]
  invoiceStatuses: string[]
  states: string[] // Place of Supply
  gstTreatments: string[]
  hasGSTIN: "any" | "with" | "without"
  usageUnits: string[]
  hsnCodes: string[]
  itemTypes: string[]
  amountRange: {
    min: number
    max: number
  }
  quantityRange: {
    min: number
    max: number
  }
  priceRange: {
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
  isFiltering: boolean
  filterProgress: number
}

const FilterContext = createContext<FilterContextType | undefined>(undefined)

const initialFilters: FilterState = {
  dateRange: { from: null, to: null },
  customers: [],
  categories: [],
  challanTypes: [],
  statuses: [],
  invoiceStatuses: [],
  states: [],
  gstTreatments: [],
  hasGSTIN: "any",
  usageUnits: [],
  hsnCodes: [],
  itemTypes: [],
  amountRange: { min: 0, max: Number.POSITIVE_INFINITY },
  quantityRange: { min: 0, max: Number.POSITIVE_INFINITY },
  priceRange: { min: 0, max: Number.POSITIVE_INFINITY },
  searchTerm: "",
}

export function FilterProvider({ children }: { children: React.ReactNode }) {
  const { data } = useData()
  const [filters, setFilters] = useState<FilterState>(initialFilters)
  const [searchTerm, setSearchTerm] = useState("")
  const [filteredData, setFilteredData] = useState<ProcessedData[]>([])
  const [isFiltering, setIsFiltering] = useState(false)
  const [filterProgress, setFilterProgress] = useState(100)
  
  // Refs to capture latest values for async operations
  const filtersRef = useRef(filters)
  const searchTermRef = useRef(searchTerm)
  const dataRef = useRef(data)
  
  // Update refs when the values change
  useEffect(() => {
    filtersRef.current = filters
  }, [filters])
  
  useEffect(() => {
    searchTermRef.current = searchTerm
  }, [searchTerm])
  
  useEffect(() => {
    dataRef.current = data
  }, [data])
  
  // Filter function to apply to each item
  const filterItem = useCallback((item: ProcessedData): boolean => {
    const currentFilters = filtersRef.current
    const currentSearchTerm = searchTermRef.current
    
    // Date range filter
    if (currentFilters.dateRange.from || currentFilters.dateRange.to) {
      const itemDate = item.challanDate
      if (currentFilters.dateRange.from && itemDate < currentFilters.dateRange.from) return false
      if (currentFilters.dateRange.to && itemDate > currentFilters.dateRange.to) return false
    }

    // Customer filter
    if (currentFilters.customers.length > 0) {
      if (!currentFilters.customers.includes(item["Customer Name"])) return false
    }

    // Category filter
    if (currentFilters.categories.length > 0) {
      if (!currentFilters.categories.includes(item.category)) return false
    }

    // Challan type filter
    if (currentFilters.challanTypes.length > 0) {
      const challanType = String((item as any)["Challan Type"] || "")
      if (!currentFilters.challanTypes.includes(challanType)) return false
    }

    // Status filter
    if (currentFilters.statuses.length > 0) {
      const status = String((item as any)["Status"] || "")
      if (!currentFilters.statuses.includes(status)) return false
    }

    // Invoice Status filter
    if (currentFilters.invoiceStatuses.length > 0) {
      const invoiceStatus = String((item as any)["Invoice Status"] || "")
      if (!currentFilters.invoiceStatuses.includes(invoiceStatus)) return false
    }

    // Place of Supply (state) filter
    if (currentFilters.states.length > 0) {
      const state = String((item as any)["Place of Supply"] || "")
      if (!currentFilters.states.includes(state)) return false
    }

    // GST Treatment filter
    if (currentFilters.gstTreatments.length > 0) {
      const gstTreatment = String((item as any)["GST Treatment"] || "")
      if (!currentFilters.gstTreatments.includes(gstTreatment)) return false
    }

    // Has GSTIN tri-state filter
    if (currentFilters.hasGSTIN !== "any") {
      const gstin = String((item as any)["GST Identification Number (GSTIN)"] || "").trim()
      const has = gstin.length > 0
      if (currentFilters.hasGSTIN === "with" && !has) return false
      if (currentFilters.hasGSTIN === "without" && has) return false
    }

    // Usage Unit filter
    if (currentFilters.usageUnits.length > 0) {
      const unit = String((item as any)["Usage unit"] || "")
      if (!currentFilters.usageUnits.includes(unit)) return false
    }

    // HSN/SAC filter
    if (currentFilters.hsnCodes.length > 0) {
      const hsn = String((item as any)["HSN/SAC"] || "")
      if (!currentFilters.hsnCodes.includes(hsn)) return false
    }

    // Item Type filter
    if (currentFilters.itemTypes.length > 0) {
      const itemType = String((item as any)["Item Type"] || "")
      if (!currentFilters.itemTypes.includes(itemType)) return false
    }

    // Amount range filter
    if (currentFilters.amountRange.min > 0 || currentFilters.amountRange.max < Number.POSITIVE_INFINITY) {
      if (item.itemTotal < currentFilters.amountRange.min || item.itemTotal > currentFilters.amountRange.max) return false
    }

    // Quantity range (use QuantityOrdered if present; fallback to QuantityInvoiced)
    if (currentFilters.quantityRange.min > 0 || currentFilters.quantityRange.max < Number.POSITIVE_INFINITY) {
      const qty = Number((item as any)["QuantityOrdered"]) || Number((item as any)["QuantityInvoiced"]) || 0
      if (qty < currentFilters.quantityRange.min || qty > currentFilters.quantityRange.max) return false
    }

    // Item price range
    if (currentFilters.priceRange.min > 0 || currentFilters.priceRange.max < Number.POSITIVE_INFINITY) {
      const priceRaw = String((item as any)["Item Price"] || "0").replace(/[₹$,]/g, "")
      const price = Number(priceRaw) || 0
      if (price < currentFilters.priceRange.min || price > currentFilters.priceRange.max) return false
    }

    // Enhanced search filter with multiple field matching
    if (currentSearchTerm) {
      const searchLower = currentSearchTerm.toLowerCase()
      // Search in multiple fields
      const searchableFields = [
        item["Customer Name"],
        item["Item Name"],
        item.category,
        item["Delivery Challan Number"],
        item.month,
        item.year.toString(),
      ]

      if (!searchableFields.some((field) => field && field.toString().toLowerCase().includes(searchLower))) return false
    }

    return true
  }, [])
  
  // Apply filters in chunks to avoid blocking the UI
  const applyFilters = useCallback(async () => {
    const currentData = dataRef.current
    
    // Skip if no data
    if (currentData.length === 0) {
      setFilteredData([])
      setIsFiltering(false)
      setFilterProgress(100)
      return
    }
    
    setIsFiltering(true)
    setFilterProgress(0)
    
    try {
      // For small datasets, filter synchronously
      if (currentData.length < 1000) {
        const filtered = currentData.filter(filterItem)
        setFilteredData(filtered)
        setFilterProgress(100)
      } else {
        // For larger datasets, use chunked processing
        const results: ProcessedData[] = []
        
        await processInChunks(
          currentData,
          (item) => {
            if (filterItem(item)) {
              results.push(item)
            }
            return null // We don't need the return value from processInChunks
          },
          500, // Process 500 items at a time
          (processed, total) => {
            // Update progress
            const progressPercent = Math.round((processed / total) * 100)
            setFilterProgress(progressPercent)
          }
        )
        
        setFilteredData(results)
      }
    } finally {
      setIsFiltering(false)
      setFilterProgress(100)
    }
  }, [filterItem])
  
  // Create a debounced version of applyFilters
  const debouncedApplyFilters = useMemo(
    () => debounce(applyFilters, 300), // 300ms debounce
    [applyFilters]
  )
  
  // Apply filters when data, filters, or search term changes
  useEffect(() => {
    debouncedApplyFilters()
  }, [data, filters, searchTerm, debouncedApplyFilters])

  const hasActiveFilters = useMemo(() => {
    return (
      filters.dateRange.from !== null ||
      filters.dateRange.to !== null ||
      filters.customers.length > 0 ||
      filters.categories.length > 0 ||
      filters.challanTypes.length > 0 ||
      filters.statuses.length > 0 ||
      filters.invoiceStatuses.length > 0 ||
      filters.states.length > 0 ||
      filters.gstTreatments.length > 0 ||
      filters.hasGSTIN !== "any" ||
      filters.usageUnits.length > 0 ||
      filters.hsnCodes.length > 0 ||
      filters.itemTypes.length > 0 ||
      filters.amountRange.min > 0 ||
      filters.amountRange.max < Number.POSITIVE_INFINITY ||
      filters.quantityRange.min > 0 ||
      filters.quantityRange.max < Number.POSITIVE_INFINITY ||
      filters.priceRange.min > 0 ||
      filters.priceRange.max < Number.POSITIVE_INFINITY ||
      searchTerm.length > 0
    )
  }, [filters, searchTerm])

  const clearAllFilters = useCallback(() => {
    setFilters(initialFilters)
    setSearchTerm("")
  }, [])

  const applyQuickFilter = useCallback((type: string, value: any) => {
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
  }, [])

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    filters,
    setFilters,
    filteredData,
    searchTerm,
    setSearchTerm,
    hasActiveFilters,
    clearAllFilters,
    applyQuickFilter,
    isFiltering,
    filterProgress,
  }), [
    filters, 
    filteredData, 
    searchTerm, 
    hasActiveFilters, 
    clearAllFilters, 
    applyQuickFilter,
    isFiltering,
    filterProgress
  ])

  return (
    <FilterContext.Provider value={contextValue}>
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
