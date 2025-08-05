"use client"

import React from "react"
import { ProcessedData } from "@/models"

interface DealerRankingTableProps {
  data: ProcessedData[]
}

export default function DealerRankingTable({ data }: DealerRankingTableProps) {
  return (
    <div className="p-4 border rounded-md bg-gray-50">
      <h2 className="text-lg font-medium">Dealer Rankings Table</h2>
      <p className="text-sm text-gray-500 mt-2">
        (Temporary component - fixing module resolution issues)
      </p>
    </div>
  )
}
