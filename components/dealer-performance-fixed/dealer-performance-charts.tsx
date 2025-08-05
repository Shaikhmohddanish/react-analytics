"use client"

import React from "react"
import { ProcessedData } from "@/models"

interface DealerPerformanceChartsProps {
  data: ProcessedData[]
  chartType: string
  height?: number
}

export default function DealerPerformanceCharts({ 
  data, 
  chartType, 
  height = 400 
}: DealerPerformanceChartsProps) {
  return (
    <div 
      className="p-4 border rounded-md bg-gray-50 flex items-center justify-center"
      style={{ height: `${height}px` }}
    >
      <div className="text-center">
        <h2 className="text-lg font-medium">{chartType} Chart</h2>
        <p className="text-sm text-gray-500 mt-2">
          (Temporary component - fixing module resolution issues)
        </p>
      </div>
    </div>
  )
}
