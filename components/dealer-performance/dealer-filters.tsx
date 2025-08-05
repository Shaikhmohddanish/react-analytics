"use client"

import React, { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useFilter } from "@/contexts/filter-context"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, FilterX, SlidersHorizontal } from "lucide-react"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { DealerType } from "@/models/dealer"

export default function DealerFilters() {
  const { filters, setFilters, clearAllFilters, searchTerm, setSearchTerm } = useFilter()
  const [dealerType, setDealerType] = useState<DealerType>("all")
  const [isExpanded, setIsExpanded] = useState(false)
  const [salesRange, setSalesRange] = useState<[number, number]>([0, 1000000])
  
  const handleDateSelect = (field: "from" | "to", date: Date | undefined) => {
    setFilters(prev => ({
      ...prev,
      dateRange: {
        ...prev.dateRange,
        [field]: date || null
      }
    }))
  }

  const handleDealerTypeChange = (value: string) => {
    setDealerType(value as DealerType)
    
    // Apply filter based on dealer type
    if (value === "all") {
      setFilters(prev => ({
        ...prev,
        customers: []
      }))
    } else {
      // Note: Customer filtering based on dealer type would be applied
      // in the data context, this is just a placeholder
      console.log(`Filter by dealer type: ${value}`)
    }
  }

  const handleSalesRangeChange = (value: number[]) => {
    setSalesRange([value[0], value[1]])
    setFilters(prev => ({
      ...prev,
      amountRange: {
        min: value[0],
        max: value[1]
      }
    }))
  }

  const resetFilters = () => {
    clearAllFilters()
    setDealerType("all")
    setSalesRange([0, 1000000])
    setIsExpanded(false)
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-col space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
            <div className="relative flex-1">
              <Input
                placeholder="Search dealers, categories, or challan numbers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full"
                  onClick={() => setSearchTerm("")}
                >
                  <FilterX className="h-4 w-4" />
                </Button>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <Button
                variant={isExpanded ? "default" : "outline"}
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                <SlidersHorizontal className="h-4 w-4 mr-2" />
                Filters
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={resetFilters}
                disabled={!filters.dateRange.from && !filters.dateRange.to && !searchTerm && dealerType === "all" && salesRange[0] === 0 && salesRange[1] === 1000000}
              >
                Reset
              </Button>
            </div>
          </div>

          {isExpanded && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="dealer-type">Dealer Type</Label>
                <Select value={dealerType} onValueChange={handleDealerTypeChange}>
                  <SelectTrigger id="dealer-type">
                    <SelectValue placeholder="All Dealers" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Dealers</SelectItem>
                    <SelectItem value="highVolume">High Volume</SelectItem>
                    <SelectItem value="midVolume">Mid Volume</SelectItem>
                    <SelectItem value="lowVolume">Low Volume</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Sales Range</Label>
                <div className="pt-6 px-2">
                  <Slider
                    defaultValue={[0, 1000000]}
                    max={1000000}
                    step={10000}
                    value={salesRange}
                    onValueChange={handleSalesRangeChange}
                    className="mt-2"
                  />
                  <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                    <span>₹{salesRange[0].toLocaleString()}</span>
                    <span>₹{salesRange[1].toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Start Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !filters.dateRange.from && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {filters.dateRange.from ? (
                        format(filters.dateRange.from, "PPP")
                      ) : (
                        "Select date"
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={filters.dateRange.from || undefined}
                      onSelect={(date) => handleDateSelect("from", date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>End Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !filters.dateRange.to && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {filters.dateRange.to ? (
                        format(filters.dateRange.to, "PPP")
                      ) : (
                        "Select date"
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={filters.dateRange.to || undefined}
                      onSelect={(date) => handleDateSelect("to", date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
