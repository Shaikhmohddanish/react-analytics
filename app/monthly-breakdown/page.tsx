"use client"

import React from "react"
import { useData } from "@/contexts/data-context"
import { useFilters } from "@/contexts/filter-context"
import { MonthlyBreakdownChart } from "@/components/monthly-breakdown-chart"

export default function MonthlyBreakdownPage() {
  const { loading } = useData()
  const { filteredData, hasActiveFilters } = useFilters()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filter Status Indicator */}
      {hasActiveFilters && (
        <div className="p-4 rounded-lg border border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
          <div className="flex items-center space-x-2 text-blue-700 dark:text-blue-300">
            <div className="h-4 w-4 rounded-full bg-blue-500"></div>
            <span className="text-sm font-medium">
              Showing monthly breakdown for {filteredData.length} filtered records
            </span>
          </div>
        </div>
      )}

      <MonthlyBreakdownChart height={600} />
    </div>
  )
}
