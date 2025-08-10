"use client"

import React, { useMemo, useState } from "react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useFilters } from "@/contexts/filter-context"
import { formatCurrency } from "@/lib/analytics-utils"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface ProductTrendsChartProps {
  height?: number
}

export default function ProductTrendsChart({
  height = 400
}: ProductTrendsChartProps) {
  const { filteredData } = useFilters()
  const [hasError, setHasError] = useState(false)
  const [chartType, setChartType] = useState<'line' | 'area'>('line')

  // Process data for the chart
  const chartData = useMemo(() => {
    if (!filteredData || filteredData.length === 0) return []
    
    try {
      // Group data by month and product
      const monthlySales = new Map<string, Map<string, number>>()
      
      filteredData.forEach(item => {
        if (!item.challanDate || !item["Item Name"] || !item.itemTotal) return
        
        try {
          // Format month key: YYYY-MM
          const date = new Date(item.challanDate)
          if (isNaN(date.getTime())) return // Skip invalid dates
          
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
          const productKey = String(item["Item Name"])
          const amount = typeof item.itemTotal === 'number' ? item.itemTotal : parseFloat(String(item.itemTotal))
          
          if (isNaN(amount)) return // Skip invalid amounts
          
          // Initialize month if not exists
          if (!monthlySales.has(monthKey)) {
            monthlySales.set(monthKey, new Map<string, number>())
          }
          
          // Add sales amount for product
          const productSales = monthlySales.get(monthKey)!
          productSales.set(
            productKey,
            (productSales.get(productKey) || 0) + amount
          )
        } catch (err) {
          console.error("Error processing data item:", err)
          // Continue to next item
        }
      })
      
      // Convert to array format for chart
      const monthKeys = Array.from(monthlySales.keys()).sort()
      
      // Calculate top products by total sales
      const productTotals = new Map<string, number>()
      monthlySales.forEach((productSales) => {
        productSales.forEach((sales, product) => {
          productTotals.set(product, (productTotals.get(product) || 0) + sales)
        })
      })
      
      // Get top 10 products
      const topProducts = Array.from(productTotals.entries())
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([product]) => product)
      
      setHasError(false)
      return monthKeys.map(month => {
        // Parse date from key
        const [year, monthNum] = month.split('-').map(Number)
        const monthDate = new Date(year, monthNum - 1, 1)
        
        // Format label: MMM YYYY (e.g. Jan 2023)
        const formattedMonth = monthDate.toLocaleDateString('en-US', { 
          month: 'short',
          year: 'numeric'
        })
        
        // Get all products for this month
        const productSales = monthlySales.get(month)!
        const chartPoint: any = {
          month: formattedMonth,
          date: monthDate,
          monthKey: month
        }
        
        // Add only top products' sales to the chart point
        topProducts.forEach(product => {
          chartPoint[product] = productSales.get(product) || 0
        })
        
        return chartPoint
      })
    } catch (error) {
      console.error("Error processing chart data:", error)
      setHasError(true)
      return []
    }
  }, [filteredData])

  // Get products from chart data (already limited to top 10)
  const products = useMemo(() => {
    if (!chartData.length) return []
    
    const productSet = new Set<string>()
    chartData.forEach(point => {
      Object.keys(point).forEach(key => {
        if (key !== 'month' && key !== 'date' && key !== 'monthKey') {
          productSet.add(key)
        }
      })
    })
    
    return Array.from(productSet).sort()
  }, [chartData])

  const getProductColor = (index: number) => {
    const colors = [
      '#3b82f6', // blue
      '#10b981', // emerald
      '#f59e0b', // amber
      '#ef4444', // red
      '#8b5cf6', // violet
      '#06b6d4', // cyan
      '#84cc16', // lime
      '#f97316', // orange
      '#ec4899', // pink
      '#6366f1', // indigo
    ]
    return colors[index % colors.length]
  }

  if (hasError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          There was an error processing the chart data. Please try refreshing the page.
        </AlertDescription>
      </Alert>
    )
  }

  if (!chartData.length) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>No Data</AlertTitle>
        <AlertDescription>
          No product trend data available for the selected filters.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-lg font-semibold">Product Sales Trends</h3>
            <p className="text-sm text-muted-foreground">
              Showing top {products.length} products by total sales
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant={chartType === 'line' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setChartType('line')}
            >
              Line Chart
            </Button>
            <Button
              variant={chartType === 'area' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setChartType('area')}
            >
              Area Chart
            </Button>
          </div>
        </div>
        
        <div style={{ height }}>
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'line' ? (
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="month" 
                  tick={{ fontSize: 12 }}
                  interval="preserveStartEnd"
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => `₹${(value / 100000).toFixed(0)}L`}
                />
                <Tooltip
                  formatter={(value: number) => [formatCurrency(value), "Sales"]}
                  labelStyle={{ fontSize: "12px" }}
                />
                <Legend />
                {products.map((product, index) => (
                  <Line
                    key={product}
                    type="monotone"
                    dataKey={product}
                    stroke={getProductColor(index)}
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    name={product}
                  />
                ))}
              </LineChart>
            ) : (
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="month" 
                  tick={{ fontSize: 12 }}
                  interval="preserveStartEnd"
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => `₹${(value / 100000).toFixed(0)}L`}
                />
                <Tooltip
                  formatter={(value: number) => [formatCurrency(value), "Sales"]}
                  labelStyle={{ fontSize: "12px" }}
                />
                <Legend />
                {products.map((product, index) => (
                  <Area
                    key={product}
                    type="monotone"
                    dataKey={product}
                    stroke={getProductColor(index)}
                    fill={getProductColor(index)}
                    fillOpacity={0.3}
                    strokeWidth={2}
                    name={product}
                  />
                ))}
              </AreaChart>
            )}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
