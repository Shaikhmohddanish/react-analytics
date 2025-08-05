"use client"

import React, { useState, useMemo } from "react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useData } from "@/contexts/data-context"
import { useFilter } from "@/contexts/filter-context"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Filter } from "lucide-react"
import { format } from "date-fns"
import {
  ViewMode,
  MonthlyBreakdownChartProps,
  categoryColors,
  ChartTooltipProps,
  MonthlyData,
  CategoryData,
  DealerData,
  formatCurrency,
  getMonthNames,
  filterDataByYear,
  getUniqueYears,
  generateYearOptions
} from "@/models/charts"

export function MonthlyBreakdownChart({ className, height = 400 }: MonthlyBreakdownChartProps) {
  const { filteredData } = useFilter()
  const [viewMode, setViewMode] = useState<ViewMode>("monthly")
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear())
  const [activeBarIndex, setActiveBarIndex] = useState<number | null>(null)

  // Generate available years from data
  const availableYears = useMemo(() => {
    return getUniqueYears(filteredData)
  }, [filteredData])

  // Generate year options for the dropdown
  const yearOptions = useMemo(() => {
    return generateYearOptions(filteredData)
  }, [filteredData])

  // Navigate between years
  const navigateYear = (direction: "prev" | "next") => {
    const currentIndex = availableYears.indexOf(selectedYear)
    if (direction === "prev" && currentIndex > 0) {
      setSelectedYear(availableYears[currentIndex - 1])
    } else if (direction === "next" && currentIndex < availableYears.length - 1) {
      setSelectedYear(availableYears[currentIndex + 1])
    }
  }

  // Prepare monthly breakdown data
  const monthlyData = useMemo(() => {
    if (!filteredData.length) return [] as MonthlyData[]

    // Filter by selected year
    const yearData = filterDataByYear(filteredData, selectedYear)
    if (!yearData.length) return [] as MonthlyData[]

    // Create a structure to hold the data
    const monthlyBreakdown: Record<string, Record<string, number>> = {}
    const months = getMonthNames()
    months.forEach((month) => {
      monthlyBreakdown[month] = {}
    })

    // Populate the data
    yearData.forEach((item) => {
      if (item.month && item.category) {
        // Convert month to short name (Jan, Feb, etc.)
        const monthIndex = item.monthNum ? item.monthNum - 1 : 0
        if (monthIndex < 0 || monthIndex > 11) return
        
        const monthName = months[monthIndex]
        if (!monthlyBreakdown[monthName]) {
          monthlyBreakdown[monthName] = {}
        }
        
        const category = item.category || "Uncategorized"
        monthlyBreakdown[monthName][category] = (monthlyBreakdown[monthName][category] || 0) + item.itemTotal
      }
    })

    // Convert to the format needed for Recharts
    return months.map((month) => {
      const monthData: MonthlyData = { month, total: 0 }
      let total = 0
      
      // Add category values
      Object.keys(categoryColors).forEach((category) => {
        const value = monthlyBreakdown[month][category] || 0
        monthData[category] = value
        total += value
      })
      
      // Add total
      monthData.total = total
      
      return monthData
    })
  }, [filteredData, selectedYear])

  // Prepare category breakdown data
  const categoryData = useMemo(() => {
    if (!filteredData.length) return [] as CategoryData[]

    // Filter by selected year
    const yearData = filterDataByYear(filteredData, selectedYear)
    if (!yearData.length) return [] as CategoryData[]

    // Group by category
    const categoryTotals: Record<string, number> = {}
    yearData.forEach((item) => {
      const category = item.category || "Uncategorized"
      categoryTotals[category] = (categoryTotals[category] || 0) + item.itemTotal
    })

    // Convert to array format for the chart
    return Object.entries(categoryTotals)
      .map(([category, total]) => ({ category, total }))
      .sort((a, b) => b.total - a.total) as CategoryData[]
  }, [filteredData, selectedYear])

  // Prepare dealer breakdown data
  const dealerData = useMemo(() => {
    if (!filteredData.length) return [] as DealerData[]

    // Filter by selected year
    const yearData = filterDataByYear(filteredData, selectedYear)
    if (!yearData.length) return [] as DealerData[]

    // Group by dealer
    const dealerTotals: Record<string, Record<string, number>> = {}
    yearData.forEach((item) => {
      const dealer = item["Customer Name"]
      if (!dealer) return
      
      if (!dealerTotals[dealer]) {
        dealerTotals[dealer] = { total: 0 }
      }
      
      const category = item.category || "Uncategorized"
      dealerTotals[dealer][category] = (dealerTotals[dealer][category] || 0) + item.itemTotal
      dealerTotals[dealer].total = (dealerTotals[dealer].total || 0) + item.itemTotal
    })

    // Convert to array format for the chart and sort by total
    return Object.entries(dealerTotals)
      .map(([dealer, categories]) => {
        return {
          dealer,
          ...categories,
        } as DealerData
      })
      .sort((a, b) => b.total - a.total)
      .slice(0, 10) // Only top 10 dealers
  }, [filteredData, selectedYear])

  // Get chart data based on current view mode
  const chartData = useMemo(() => {
    switch (viewMode) {
      case "category":
        return categoryData
      case "dealer":
        return dealerData
      case "monthly":
      default:
        return monthlyData
    }
  }, [viewMode, monthlyData, categoryData, dealerData])

  // Determine which categories to display in chart
  const categoriesToDisplay = useMemo(() => {
    return Object.keys(categoryColors).filter((category) => {
      // Check if any month has non-zero value for this category
      return monthlyData.some((month) => {
        const value = month[category]
        return typeof value === 'number' && value > 0
      })
    })
  }, [monthlyData])

  // Custom tooltip for the chart
  const CustomTooltip = ({ active, payload, label }: ChartTooltipProps) => {
    if (!active || !payload || !payload.length) return null

    return (
      <div className="bg-background border border-border rounded p-2 shadow-md">
        <p className="font-medium">{label}</p>
        <div className="space-y-1 mt-1">
          {payload
            .filter((entry: any) => entry.value > 0)
            .sort((a: any, b: any) => b.value - a.value)
            .map((entry: any, index: number) => (
              <div key={index} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-sm">{entry.name}:</span>
                <span className="text-sm font-semibold">{formatCurrency(entry.value)}</span>
              </div>
            ))}
          {viewMode === "monthly" && (
            <div className="border-t border-border mt-1 pt-1">
              <div className="flex justify-between">
                <span className="text-sm font-medium">Total:</span>
                <span className="text-sm font-bold">
                  {formatCurrency(
                    payload.reduce((sum: number, entry: any) => sum + (entry.value || 0), 0)
                  )}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  // No data message
  if (!filteredData.length) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Monthly Breakdown</CardTitle>
          <CardDescription>Sales breakdown by month and category</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center" style={{ height: height - 100 }}>
          <p className="text-muted-foreground">No data available</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader className="space-y-0 pb-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Monthly Breakdown</CardTitle>
            <CardDescription>Sales breakdown by {viewMode}</CardDescription>
          </div>
          <div className="flex items-center space-x-2 mt-2 sm:mt-0">
            <Select value={viewMode} onValueChange={(value) => setViewMode(value as ViewMode)}>
              <SelectTrigger className="w-[150px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="View By" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">By Month</SelectItem>
                <SelectItem value="category">By Category</SelectItem>
                <SelectItem value="dealer">By Dealer</SelectItem>
              </SelectContent>
            </Select>
            
            <div className="flex items-center space-x-1">
              <Button
                variant="outline"
                size="icon"
                onClick={() => navigateYear("prev")}
                disabled={availableYears.indexOf(selectedYear) === 0}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                <SelectTrigger className="w-[100px]">
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent>
                  {yearOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value.toString()}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Button
                variant="outline"
                size="icon"
                onClick={() => navigateYear("next")}
                disabled={availableYears.indexOf(selectedYear) === availableYears.length - 1}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div style={{ height }}>
          <ResponsiveContainer width="100%" height="100%">
            {viewMode === "monthly" ? (
              <BarChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                barCategoryGap={8}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={{ stroke: "#e0e0e0" }}
                />
                <YAxis
                  tickFormatter={(value) => `₹${value.toLocaleString("en-IN", { notation: "compact" })}`}
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={{ stroke: "#e0e0e0" }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ paddingTop: 10 }} />
                
                {categoriesToDisplay.map((category) => (
                  <Bar
                    key={category}
                    dataKey={category}
                    stackId="a"
                    fill={categoryColors[category as keyof typeof categoryColors] || "#8884d8"}
                    name={category}
                  />
                ))}
              </BarChart>
            ) : viewMode === "category" ? (
              <BarChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                barCategoryGap={8}
                onMouseMove={(data) => {
                  if (data.activeTooltipIndex !== undefined) {
                    setActiveBarIndex(typeof data.activeTooltipIndex === 'number' ? data.activeTooltipIndex : null)
                  }
                }}
                onMouseLeave={() => setActiveBarIndex(null)}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                <XAxis
                  dataKey="category"
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={{ stroke: "#e0e0e0" }}
                />
                <YAxis
                  tickFormatter={(value) => `₹${value.toLocaleString("en-IN", { notation: "compact" })}`}
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={{ stroke: "#e0e0e0" }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="total" name="Total Sales">
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        categoryColors[entry.category as keyof typeof categoryColors] ||
                        (activeBarIndex === index ? "#3498db" : "#8884d8")
                      }
                      opacity={activeBarIndex === null || activeBarIndex === index ? 1 : 0.6}
                    />
                  ))}
                </Bar>
              </BarChart>
            ) : (
              <BarChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                barCategoryGap={8}
                layout="vertical"
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} opacity={0.3} />
                <XAxis
                  type="number"
                  tickFormatter={(value) => `₹${value.toLocaleString("en-IN", { notation: "compact" })}`}
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={{ stroke: "#e0e0e0" }}
                />
                <YAxis
                  dataKey="dealer"
                  type="category"
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={{ stroke: "#e0e0e0" }}
                  width={150}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ paddingTop: 10 }} />
                
                {categoriesToDisplay.map((category) => (
                  <Bar
                    key={category}
                    dataKey={category}
                    stackId="a"
                    fill={categoryColors[category as keyof typeof categoryColors] || "#8884d8"}
                    name={category}
                  />
                ))}
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
