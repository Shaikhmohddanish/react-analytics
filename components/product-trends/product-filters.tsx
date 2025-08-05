"use client"

import React, { useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { useData } from "@/contexts/data-context"
import { FilterX } from "lucide-react"

interface ProductFiltersProps {
  onCategoryChange: (category: string) => void
  onCustomerTypeChange: (customerType: string) => void
  selectedCategory: string
  selectedCustomerType: string
}

export default function ProductFilters({
  onCategoryChange,
  onCustomerTypeChange,
  selectedCategory,
  selectedCustomerType
}: ProductFiltersProps) {
  const { data } = useData()

  // Extract unique product categories
  const categories = useMemo(() => {
    if (!data || data.length === 0) return ["all"]
    
    const uniqueCategories = new Set<string>()
    data.forEach(item => {
      if (item.category) {
        uniqueCategories.add(item.category)
      }
    })
    
    return ["all", ...Array.from(uniqueCategories).sort()]
  }, [data])

  // Extract unique customer types
  const customerTypes = useMemo(() => {
    if (!data || data.length === 0) return ["all"]
    
    const uniqueTypes = new Set<string>()
    data.forEach(item => {
      if (item.customerType) {
        // Convert customerType to string to ensure type safety
        uniqueTypes.add(String(item.customerType))
      }
    })
    
    return ["all", ...Array.from(uniqueTypes).sort()]
  }, [data])

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-wrap items-end gap-4">
          <div className="space-y-2 min-w-[200px]">
            <Label htmlFor="category-select">Product Category</Label>
            <Select 
              value={selectedCategory} 
              onValueChange={onCategoryChange}
            >
              <SelectTrigger id="category-select">
                <SelectValue placeholder="Select Category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>
                    {category === "all" ? "All Categories" : category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 min-w-[200px]">
            <Label htmlFor="customer-type-select">Customer Type</Label>
            <Select 
              value={selectedCustomerType} 
              onValueChange={onCustomerTypeChange}
            >
              <SelectTrigger id="customer-type-select">
                <SelectValue placeholder="Select Customer Type" />
              </SelectTrigger>
              <SelectContent>
                {customerTypes.map(type => (
                  <SelectItem key={type} value={type}>
                    {type === "all" ? "All Customers" : type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button 
            variant="outline"
            onClick={() => {
              onCategoryChange("all")
              onCustomerTypeChange("all")
            }}
            disabled={selectedCategory === "all" && selectedCustomerType === "all"}
            className="mb-0"
          >
            <FilterX className="h-4 w-4 mr-2" />
            Reset Filters
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
