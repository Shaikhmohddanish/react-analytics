"use client"

import React, { useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { useFilters } from "@/contexts/filter-context"
import { useData } from "@/contexts/data-context"
import { FilterX } from "lucide-react"

export function ProductFilters() {
  const { filters, setFilters, clearAllFilters } = useFilters()
  const { data } = useData()

  // Extract unique product categories from actual data
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

  // Extract unique customers from actual data
  const customers = useMemo(() => {
    if (!data || data.length === 0) return ["all"]
    
    const uniqueCustomers = new Set<string>()
    data.forEach(item => {
      if (item["Customer Name"]) {
        uniqueCustomers.add(item["Customer Name"])
      }
    })
    
    return ["all", ...Array.from(uniqueCustomers).sort()]
  }, [data])

  const handleCategoryChange = (category: string) => {
    setFilters(prev => ({
      ...prev,
      categories: category === "all" ? [] : [category]
    }))
  }

  const handleCustomerChange = (customer: string) => {
    setFilters(prev => ({
      ...prev,
      customers: customer === "all" ? [] : [customer]
    }))
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-wrap items-end gap-4">
          <div className="space-y-2 min-w-[200px]">
            <Label htmlFor="category-select">Product Category</Label>
            <Select 
              value={filters.categories.length > 0 ? filters.categories[0] : "all"} 
              onValueChange={handleCategoryChange}
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
            <Label htmlFor="customer-select">Customer</Label>
            <Select 
              value={filters.customers.length > 0 ? filters.customers[0] : "all"} 
              onValueChange={handleCustomerChange}
            >
              <SelectTrigger id="customer-select">
                <SelectValue placeholder="Select Customer" />
              </SelectTrigger>
              <SelectContent>
                {customers.map(customer => (
                  <SelectItem key={customer} value={customer}>
                    {customer === "all" ? "All Customers" : customer}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button 
            variant="outline"
            onClick={clearAllFilters}
            className="flex items-center gap-2"
          >
            <FilterX className="h-4 w-4" />
            Clear Filters
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
