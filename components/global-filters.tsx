"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, X } from "lucide-react"
import { format } from "date-fns"
import { useData } from "@/contexts/data-context"
import { useFilter } from "@/contexts/filter-context"
import { cn } from "@/lib/utils"

interface GlobalFiltersProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function GlobalFilters({ open, onOpenChange }: GlobalFiltersProps) {
  const { data } = useData()
  const { filters, setFilters, clearAllFilters } = useFilter()
  const [tempFilters, setTempFilters] = useState(filters)

  const customers = [...new Set(data.map((item) => item["Customer Name"]))].sort()
  const categories = [...new Set(data.map((item) => item.category))].sort()
  const maxAmount = Math.max(...data.map((item) => item.itemTotal), 1000000)

  const handleApply = () => {
    setFilters(tempFilters)
    onOpenChange(false)
  }

  const handleReset = () => {
    setTempFilters({
      dateRange: { from: null, to: null },
      customers: [],
      categories: [],
      amountRange: { min: 0, max: Number.POSITIVE_INFINITY },
      searchTerm: "",
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">Advanced Filters</DialogTitle>
          <DialogDescription className="text-sm">Apply filters to refine your data analysis</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Date Range */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Date Range</Label>
            <div className="flex flex-col sm:flex-row gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "justify-start text-left font-normal text-xs sm:text-sm",
                      !tempFilters.dateRange.from && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                    {tempFilters.dateRange.from ? format(tempFilters.dateRange.from, "PPP") : "From date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={tempFilters.dateRange.from || undefined}
                    onSelect={(date) =>
                      setTempFilters((prev) => ({
                        ...prev,
                        dateRange: { ...prev.dateRange, from: date || null },
                      }))
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "justify-start text-left font-normal text-xs sm:text-sm",
                      !tempFilters.dateRange.to && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                    {tempFilters.dateRange.to ? format(tempFilters.dateRange.to, "PPP") : "To date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={tempFilters.dateRange.to || undefined}
                    onSelect={(date) =>
                      setTempFilters((prev) => ({
                        ...prev,
                        dateRange: { ...prev.dateRange, to: date || null },
                      }))
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Amount Range */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Amount Range (₹)</Label>
            <div className="px-2">
              <Slider
                value={[
                  tempFilters.amountRange.min,
                  tempFilters.amountRange.max === Number.POSITIVE_INFINITY ? maxAmount : tempFilters.amountRange.max,
                ]}
                onValueChange={([min, max]) =>
                  setTempFilters((prev) => ({
                    ...prev,
                    amountRange: { min, max: max === maxAmount ? Number.POSITIVE_INFINITY : max },
                  }))
                }
                max={maxAmount}
                step={1000}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>₹{tempFilters.amountRange.min.toLocaleString()}</span>
                <span>
                  ₹
                  {(tempFilters.amountRange.max === Number.POSITIVE_INFINITY
                    ? maxAmount
                    : tempFilters.amountRange.max
                  ).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Categories */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Categories</Label>
            <div className="max-h-32 sm:max-h-48 overflow-y-auto space-y-2 border rounded-md p-3">
              {categories.map((category) => (
                <div key={category} className="flex items-center space-x-2">
                  <Checkbox
                    id={`category-${category}`}
                    checked={tempFilters.categories.includes(category)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setTempFilters((prev) => ({
                          ...prev,
                          categories: [...prev.categories, category],
                        }))
                      } else {
                        setTempFilters((prev) => ({
                          ...prev,
                          categories: prev.categories.filter((c) => c !== category),
                        }))
                      }
                    }}
                  />
                  <Label htmlFor={`category-${category}`} className="text-xs sm:text-sm">
                    {category}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Customers */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Customers</Label>
            <div className="max-h-32 sm:max-h-48 overflow-y-auto space-y-2 border rounded-md p-3">
              {customers.slice(0, 20).map((customer) => (
                <div key={customer} className="flex items-center space-x-2">
                  <Checkbox
                    id={`customer-${customer}`}
                    checked={tempFilters.customers.includes(customer)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setTempFilters((prev) => ({
                          ...prev,
                          customers: [...prev.customers, customer],
                        }))
                      } else {
                        setTempFilters((prev) => ({
                          ...prev,
                          customers: prev.customers.filter((c) => c !== customer),
                        }))
                      }
                    }}
                  />
                  <Label htmlFor={`customer-${customer}`} className="text-xs sm:text-sm truncate">
                    {customer}
                  </Label>
                </div>
              ))}
              {customers.length > 20 && (
                <p className="text-xs text-muted-foreground">And {customers.length - 20} more...</p>
              )}
            </div>
          </div>
        </div>

        {/* Active Filters */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Active Filters</Label>
          <div className="flex flex-wrap gap-1 sm:gap-2">
            {tempFilters.dateRange.from && (
              <Badge variant="secondary" className="text-xs">
                From: {format(tempFilters.dateRange.from, "MMM dd, yyyy")}
                <X
                  className="ml-1 h-3 w-3 cursor-pointer"
                  onClick={() =>
                    setTempFilters((prev) => ({
                      ...prev,
                      dateRange: { ...prev.dateRange, from: null },
                    }))
                  }
                />
              </Badge>
            )}
            {tempFilters.dateRange.to && (
              <Badge variant="secondary" className="text-xs">
                To: {format(tempFilters.dateRange.to, "MMM dd, yyyy")}
                <X
                  className="ml-1 h-3 w-3 cursor-pointer"
                  onClick={() =>
                    setTempFilters((prev) => ({
                      ...prev,
                      dateRange: { ...prev.dateRange, to: null },
                    }))
                  }
                />
              </Badge>
            )}
            {tempFilters.categories.map((category) => (
              <Badge key={category} variant="secondary" className="text-xs">
                {category.length > 15 ? category.substring(0, 12) + "..." : category}
                <X
                  className="ml-1 h-3 w-3 cursor-pointer"
                  onClick={() =>
                    setTempFilters((prev) => ({
                      ...prev,
                      categories: prev.categories.filter((c) => c !== category),
                    }))
                  }
                />
              </Badge>
            ))}
            {tempFilters.customers.map((customer) => (
              <Badge key={customer} variant="secondary" className="text-xs">
                {customer.length > 20 ? customer.substring(0, 17) + "..." : customer}
                <X
                  className="ml-1 h-3 w-3 cursor-pointer"
                  onClick={() =>
                    setTempFilters((prev) => ({
                      ...prev,
                      customers: prev.customers.filter((c) => c !== customer),
                    }))
                  }
                />
              </Badge>
            ))}
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={handleReset} className="w-full sm:w-auto bg-transparent">
            Reset
          </Button>
          <Button onClick={handleApply} className="w-full sm:w-auto">
            Apply Filters
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
