"use client"

import React, { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useData } from "@/contexts/data-context"
import { useFilter } from "@/contexts/filter-context"
import ProductTrendsChart from "../../components/product-trends/product-trends-chart"
import ProductFilters from "../../components/product-trends/product-filters"
import { ExportButton } from "@/components/export-button"
import { Loader2 } from "lucide-react"

export default function ProductTrendsPage() {
  const { data, loading } = useData()
  const { filteredData } = useFilter()
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [selectedCustomerType, setSelectedCustomerType] = useState<string>("all")
  
  // Chart selectors for export
  const chartSelectors = [
    "#product-trends-chart-container"
  ]

  // Handle filter changes
  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category)
  }

  const handleCustomerTypeChange = (customerType: string) => {
    setSelectedCustomerType(customerType)
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading product trends data...</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Product Sales Trends</h1>
          <p className="text-muted-foreground">
            Analyze sales trends over time for each product category
          </p>
        </div>
        <ExportButton 
          chartSelectors={chartSelectors} 
          title="Product-Sales-Trends" 
        />
      </div>

      <ProductFilters
        onCategoryChange={handleCategoryChange}
        onCustomerTypeChange={handleCustomerTypeChange}
        selectedCategory={selectedCategory}
        selectedCustomerType={selectedCustomerType}
      />

      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>
              {selectedCategory === "all" 
                ? "All Categories" 
                : `${selectedCategory} - Monthly Sales Trends`}
            </CardTitle>
            <CardDescription>
              {selectedCustomerType === "all" 
                ? "All customer types" 
                : `Filtered by ${selectedCustomerType} customers`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ProductTrendsChart 
              data={filteredData}
              selectedCategory={selectedCategory}
              selectedCustomerType={selectedCustomerType}
              height={500}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
